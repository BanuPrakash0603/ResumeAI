import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
import stripe
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

from database import (
    init_db, create_user, get_user_by_email, get_user_by_id,
    update_user_plan, update_last_login, save_scan, get_user_scans,
    upsert_lead, increment_referral_click, save_subscription
)
from analyzer import analyze_resume

# ── Bootstrap ──────────────────────────────────────────────────────────────────
load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", secrets.token_hex(32))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

CORS(app, origins=[FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
     supports_credentials=True)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# Run DB migrations on startup
init_db()

PLANS = {
    "pro_monthly":  {"amount": 900,  "name": "Pro Plan — Monthly",  "interval": "month"},
    "pro_yearly":   {"amount": 8400, "name": "Pro Plan — Yearly",   "interval": "year"},
    "team_monthly": {"amount": 2900, "name": "Team Plan — Monthly", "interval": "month"},
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


# ── Auth helpers ───────────────────────────────────────────────────────────────
def hash_password(pw: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + pw).encode()).hexdigest()
    return f"{salt}:{h}"


def verify_password(pw: str, stored: str) -> bool:
    try:
        salt, h = stored.split(":", 1)
        return hashlib.sha256((salt + pw).encode()).hexdigest() == h
    except Exception:
        return False


def make_token(user_id: int, email: str, plan: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "plan": plan,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")


def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
        if not token:
            return jsonify({"error": "Authentication required"}), 401
        try:
            payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            g.user_id = payload["sub"]
            g.user_email = payload["email"]
            g.user_plan = payload.get("plan", "free")
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired, please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated


def jwt_optional(f):
    """Like jwt_required but doesn't block if no token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        g.user_id = None
        g.user_email = None
        g.user_plan = "free"
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
            try:
                payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
                g.user_id = payload["sub"]
                g.user_email = payload["email"]
                g.user_plan = payload.get("plan", "free")
            except Exception:
                pass
        return f(*args, **kwargs)
    return decorated


# ── Health ─────────────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok", "ts": datetime.utcnow().isoformat(), "version": "2.0"})


# ── Auth endpoints ─────────────────────────────────────────────────────────────
@app.route("/auth/register", methods=["POST"])
@limiter.limit("10 per hour")
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or "@" not in email or "." not in email:
        return jsonify({"error": "Invalid email address"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    pw_hash = hash_password(password)
    user_id = create_user(email, pw_hash)
    if user_id is None:
        return jsonify({"error": "Email already registered"}), 409

    token = make_token(user_id, email, "free")
    return jsonify({"token": token, "email": email, "plan": "free"}), 201


@app.route("/auth/login", methods=["POST"])
@limiter.limit("20 per hour")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    user = get_user_by_email(email)
    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid email or password"}), 401

    update_last_login(user["id"])
    token = make_token(user["id"], email, user["plan"])
    return jsonify({"token": token, "email": email, "plan": user["plan"]})


@app.route("/auth/me")
@jwt_required
def me():
    user = get_user_by_id(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id": user["id"],
        "email": user["email"],
        "plan": user["plan"],
        "created_at": user["created_at"],
        "last_login": user["last_login"],
    })


# ── Resume Analysis ─────────────────────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
@jwt_optional
@limiter.limit("5 per minute")
def analyze():
    """
    Accept PDF/DOCX/TXT file upload, extract text, run AI analysis.
    Free users: 3 scans/day. Pro/Team: unlimited.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Send the resume as multipart/form-data with key 'file'."}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    filename = file.filename
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext not in ("pdf", "docx", "doc", "txt"):
        return jsonify({"error": "Unsupported file type. Upload PDF, DOCX, or TXT."}), 400

    file_bytes = file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({"error": "File too large (max 5MB)"}), 413

    job_description = request.form.get("job_description", "")

    try:
        result = analyze_resume(file_bytes, filename, job_description)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422
    except Exception as e:
        app.logger.error(f"Analysis error: {e}")
        return jsonify({"error": "Analysis failed. Please try again."}), 500

    # Persist scan to database
    print("USER ID:", g.user_id)
    print("EMAIL:", g.user_email)
    scan_id = save_scan(g.user_id, g.user_email or "", filename, result, job_description)
    result["scan_id"] = scan_id

    return jsonify(result)


# ── User Dashboard ─────────────────────────────────────────────────────────────
@app.route("/dashboard/scans")
@jwt_required
def user_scans():
    scans = get_user_scans(g.user_id, limit=20)
    return jsonify({"scans": scans, "total": len(scans)})


# ── Stripe Checkout ────────────────────────────────────────────────────────────
@app.route("/create-checkout-session", methods=["POST"])
@limiter.limit("10 per hour")
def checkout():
    if not stripe.api_key:
        return jsonify({"error": "Stripe not configured"}), 503

    data = request.get_json() or {}
    plan_id = data.get("plan", "pro_monthly")
    plan = PLANS.get(plan_id, PLANS["pro_monthly"])
    ref = (data.get("ref_code") or "").strip()[:32]
    email = (data.get("email") or "").strip().lower()

    try:
        session_kwargs = dict(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": plan["name"]},
                    "unit_amount": plan["amount"],
                    "recurring": {"interval": plan["interval"]},
                },
                "quantity": 1,
            }],
            mode="subscription",
            allow_promotion_codes=True,
            metadata={"ref_code": ref, "plan_id": plan_id},
            success_url=f"{FRONTEND_URL}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/pricing",
        )
        if email:
            session_kwargs["customer_email"] = email

        session = stripe.checkout.Session.create(**session_kwargs)
        return jsonify({"url": session.url})
    except stripe.StripeError as e:
        return jsonify({"error": str(e)}), 500


# ── Stripe Webhook ─────────────────────────────────────────────────────────────
@app.route("/webhook", methods=["POST"])
def webhook():
    payload = request.data
    sig = request.headers.get("Stripe-Signature", "")
    secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig, secret)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        email = session.get("customer_email", "")
        ref_code = session.get("metadata", {}).get("ref_code", "")
        plan_id = session.get("metadata", {}).get("plan_id", "pro_monthly")
        plan_name = "pro" if "pro" in plan_id else "team"

        if email:
            # Persist subscription + upgrade user plan
            save_subscription(email, session["id"], plan_name, ref_code)
            update_user_plan(email, plan_name)
            upsert_lead(email, "stripe_checkout", ref_code)
            if ref_code:
                increment_referral_click(ref_code)  # count as conversion

        app.logger.info(f"[WEBHOOK] New {plan_name} subscription: {email} ref={ref_code}")

    elif event["type"] == "customer.subscription.deleted":
        # Downgrade to free on cancellation
        customer_id = event["data"]["object"].get("customer")
        if customer_id:
            app.logger.info(f"[WEBHOOK] Subscription cancelled for customer {customer_id}")

    return jsonify({"received": True})


# ── Email Capture ──────────────────────────────────────────────────────────────
@app.route("/capture-email", methods=["POST"])
@limiter.limit("5 per minute")
def capture_email():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    source = (data.get("source") or "unknown")[:50]
    ref = (data.get("ref_code") or "")[:32]

    if not email or "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        return jsonify({"error": "Invalid email"}), 400

    upsert_lead(email, source, ref)
    return jsonify({"ok": True})


# ── Referral ───────────────────────────────────────────────────────────────────
@app.route("/referral-click", methods=["POST"])
@limiter.limit("30 per minute")
def referral_click():
    data = request.get_json() or {}
    ref = (data.get("ref_code") or "").strip()[:32]
    if not ref:
        return jsonify({"error": "No ref_code"}), 400
    clicks = increment_referral_click(ref)
    return jsonify({"ok": True, "clicks": clicks})


# ── Plans Info ─────────────────────────────────────────────────────────────────
@app.route("/plans")
def get_plans():
    return jsonify({
        k: {**v, "amount_display": f"${v['amount'] // 100}/mo"}
        for k, v in PLANS.items()
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)


# ── Streaming endpoints ────────────────────────────────────────────────────────

@app.route("/analyze/stream", methods=["POST"])
@limiter.limit("10 per minute")
def analyze_stream():
    """Stream AI analysis feedback token-by-token using SSE."""
    import json
    import time

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    file_bytes = file.read(MAX_FILE_SIZE + 1)
    if len(file_bytes) > MAX_FILE_SIZE:
        return jsonify({"error": "File too large (max 5 MB)"}), 413

    # Run the regular analysis to get scores
    job_description = request.form.get("job_description", "")
    try:
        result = analyze_resume(file_bytes, file.filename, job_description)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    openai_key = os.getenv("OPENAI_API_KEY", "")

    def generate():
        if not openai_key:
            # Fallback: stream the heuristic headline character by character
            msg = result.get("headline", "Analysis complete. Review your scores above.")
            for char in msg:
                data = json.dumps({"delta": char})
                yield f"data: {data}\n\n"
                time.sleep(0.02)
            yield "data: [DONE]\n\n"
            return

        try:
            import openai
            client = openai.OpenAI(api_key=openai_key)
            score = result.get("overall", 0)
            grade = result.get("grade", "C")
            suggestions = result.get("suggestions", [])[:3]
            missing_kw = result.get("keywords_missing", [])[:5]

            job_match = result.get("job_match_score")
            job_match_str = f"Job match score: {job_match}/100. " if job_match is not None else ""
            missing_skills = result.get("missing_skills", [])[:4]
            prompt = (
                f"You are a professional resume coach. A resume just scored {score}/100 (Grade {grade}). "
                f"{job_match_str}"
                f"Top issues: {', '.join(s['title'] for s in suggestions)}. "
                f"Missing keywords: {', '.join(missing_kw)}. "
                f"{'Missing skills: ' + ', '.join(missing_skills) + '. ' if missing_skills else ''}"
                f"In 3-4 sentences, give a direct, motivating assessment and the single most impactful thing to fix first."
            )

            stream = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                stream=True,
                max_tokens=200,
            )

            for chunk in stream:
                delta = chunk.choices[0].delta.content if chunk.choices[0].delta.content else ""
                if delta:
                    data = json.dumps({"delta": delta})
                    yield f"data: {data}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            error_msg = f"AI insight unavailable: {str(e)}"
            yield f"data: {json.dumps({'delta': error_msg})}\n\n"
            yield "data: [DONE]\n\n"

    return app.response_class(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.route("/ai/chat", methods=["POST"])
@limiter.limit("20 per minute")
def ai_chat():
    """Streaming AI chat about the resume."""
    import json

    data = request.get_json(silent=True) or {}
    messages = data.get("messages", [])
    context = data.get("context", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    if not messages:
        return jsonify({"error": "No messages provided"}), 400

    def generate():
        if not openai_key:
            msg = "AI chat requires an OpenAI API key. Set OPENAI_API_KEY in your .env file."
            yield msg
            return

        try:
            import openai
            client = openai.OpenAI(api_key=openai_key)

            system = (
                "You are an expert resume coach and career advisor. "
                "You give concise, actionable advice. Keep replies under 150 words unless asked for more. "
                f"Resume context: {context}"
            )

            oai_messages = [{"role": "system", "content": system}]
            for m in messages[-10:]:  # Last 10 turns
                oai_messages.append({"role": m["role"], "content": m["content"]})

            stream = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=oai_messages,
                stream=True,
                max_tokens=300,
            )

            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta

        except Exception as e:
            yield f"Error: {str(e)}"

    return app.response_class(
        generate(),
        mimetype="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
