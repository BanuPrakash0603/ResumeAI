"""
database.py — SQLite persistence for ResumeAI
All data survives server restarts and redeployments.
"""
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "resumeai.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist. Safe to call multiple times."""
    conn = get_conn()
    c = conn.cursor()

    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            email       TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            plan        TEXT NOT NULL DEFAULT 'free',
            stripe_customer_id TEXT,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            last_login  TEXT
        );

        CREATE TABLE IF NOT EXISTS scans (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER REFERENCES users(id),
            email           TEXT,
            filename        TEXT,
            job_title       TEXT,
            company_name    TEXT,
            job_description TEXT,
            job_match_score INTEGER,
            ats_score       INTEGER,
            keyword_score   INTEGER,
            readability     INTEGER,
            impact_score    INTEGER,
            overall         INTEGER,
            grade           TEXT,
            keywords_found  TEXT,
            keywords_missing TEXT,
            matched_keywords TEXT,
            missing_keywords TEXT,
            missing_skills  TEXT,
            suggestions     TEXT,
            raw_text_len    INTEGER,
            used_ai         INTEGER DEFAULT 0,
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS leads (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            email   TEXT UNIQUE NOT NULL,
            source  TEXT,
            ref     TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS referrals (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            ref_code TEXT NOT NULL,
            clicks  INTEGER NOT NULL DEFAULT 0,
            conversions INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER REFERENCES users(id),
            email           TEXT,
            stripe_session_id TEXT UNIQUE,
            plan            TEXT,
            status          TEXT,
            ref_code        TEXT,
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """)

    # Run migrations for existing DBs that may be missing new columns
    _migrate(c)

    conn.commit()
    conn.close()


def _migrate(c):
    """Add new columns to existing tables if they don't exist."""
    existing = {row[1] for row in c.execute("PRAGMA table_info(scans)")}
    new_cols = {
        "job_title": "TEXT",
        "company_name": "TEXT",
        "job_description": "TEXT",
        "job_match_score": "INTEGER",
        "grade": "TEXT",
        "matched_keywords": "TEXT",
        "missing_keywords": "TEXT",
        "missing_skills": "TEXT",
        "used_ai": "INTEGER DEFAULT 0",
    }
    for col, col_type in new_cols.items():
        if col not in existing:
            try:
                c.execute(f"ALTER TABLE scans ADD COLUMN {col} {col_type}")
            except Exception:
                pass


# ── User helpers ───────────────────────────────────────────────────────────────
def create_user(email: str, password_hash: str) -> int | None:
    conn = get_conn()
    try:
        c = conn.cursor()
        c.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email.lower().strip(), password_hash),
        )
        conn.commit()
        return c.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_user_by_email(email: str) -> dict | None:
    conn = get_conn()
    c = conn.cursor()
    row = c.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> dict | None:
    conn = get_conn()
    c = conn.cursor()
    row = c.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def update_user_plan(email: str, plan: str, stripe_customer_id: str = None):
    conn = get_conn()
    c = conn.cursor()
    if stripe_customer_id:
        c.execute(
            "UPDATE users SET plan=?, stripe_customer_id=? WHERE email=?",
            (plan, stripe_customer_id, email.lower()),
        )
    else:
        c.execute("UPDATE users SET plan=? WHERE email=?", (plan, email.lower()))
    conn.commit()
    conn.close()


def update_last_login(user_id: int):
    conn = get_conn()
    conn.execute(
        "UPDATE users SET last_login=? WHERE id=?",
        (datetime.utcnow().isoformat(), user_id),
    )
    conn.commit()
    conn.close()


# ── Scan helpers ───────────────────────────────────────────────────────────────
def save_scan(user_id: int | None, email: str, filename: str, result: dict, job_description: str = "") -> int:
    import json
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        """INSERT INTO scans
           (user_id, email, filename, job_description, job_match_score,
            ats_score, keyword_score, readability, impact_score, overall, grade,
            keywords_found, keywords_missing, matched_keywords, missing_keywords,
            missing_skills, suggestions, raw_text_len, used_ai)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            user_id,
            email,
            filename,
            job_description,
            result.get("job_match_score"),
            result.get("ats_score", 0),
            result.get("keyword_score", 0),
            result.get("readability", 0),
            result.get("impact_score", 0),
            result.get("overall", 0),
            result.get("grade", ""),
            json.dumps(result.get("keywords_found", [])),
            json.dumps(result.get("keywords_missing", [])),
            json.dumps(result.get("matched_keywords", result.get("keywords_found", []))),
            json.dumps(result.get("missing_keywords", result.get("keywords_missing", []))),
            json.dumps(result.get("missing_skills", [])),
            json.dumps(result.get("suggestions", [])),
            result.get("raw_text_len", 0),
            1 if result.get("used_ai") else 0,
        ),
    )
    conn.commit()
    scan_id = c.lastrowid
    conn.close()
    return scan_id


def get_user_scans(user_id: int, limit: int = 20) -> list[dict]:
    import json
    conn = get_conn()
    c = conn.cursor()
    rows = c.execute(
        "SELECT * FROM scans WHERE user_id=? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit),
    ).fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        for k in ("keywords_found", "keywords_missing", "matched_keywords", "missing_keywords", "missing_skills", "suggestions"):
            try:
                d[k] = json.loads(d[k] or "[]")
            except Exception:
                d[k] = []
        out.append(d)
    return out


# ── Lead helpers ───────────────────────────────────────────────────────────────
def upsert_lead(email: str, source: str, ref: str) -> bool:
    conn = get_conn()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO leads (email, source, ref) VALUES (?,?,?)",
            (email.lower().strip(), source, ref),
        )
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


# ── Referral helpers ───────────────────────────────────────────────────────────
def increment_referral_click(ref_code: str) -> int:
    conn = get_conn()
    c = conn.cursor()
    existing = c.execute(
        "SELECT id, clicks FROM referrals WHERE ref_code=?", (ref_code,)
    ).fetchone()
    if existing:
        new_clicks = existing["clicks"] + 1
        c.execute(
            "UPDATE referrals SET clicks=?, updated_at=? WHERE ref_code=?",
            (new_clicks, datetime.utcnow().isoformat(), ref_code),
        )
    else:
        new_clicks = 1
        c.execute(
            "INSERT INTO referrals (ref_code, clicks) VALUES (?,?)",
            (ref_code, 1),
        )
    conn.commit()
    conn.close()
    return new_clicks


def save_subscription(email: str, stripe_session_id: str, plan: str, ref_code: str):
    conn = get_conn()
    user = get_user_by_email(email)
    user_id = user["id"] if user else None
    try:
        conn.execute(
            """INSERT OR IGNORE INTO subscriptions
               (user_id, email, stripe_session_id, plan, status, ref_code)
               VALUES (?,?,?,?,?,?)""",
            (user_id, email, stripe_session_id, plan, "active", ref_code),
        )
        conn.commit()
    finally:
        conn.close()
