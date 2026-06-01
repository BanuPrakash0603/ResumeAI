"""
analyzer.py — Core resume analysis engine
Extracts text from PDF/DOCX, runs AI scoring via OpenAI GPT-4o-mini,
returns structured JSON with scores, keywords, and suggestions.
"""
import os
import re
import json
import io

import pdfplumber
import docx
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) resume analyzer with deep knowledge of:
- How ATS software parses and scores resumes
- HR and recruiting best practices
- Keyword optimization techniques
- Resume writing that converts to interviews

Analyze the provided resume text against the job description and return ONLY valid JSON (no markdown, no explanation outside JSON).
"""

ANALYSIS_PROMPT = """You are a professional ATS system. Compare the resume against the job description and return ONLY valid JSON with exactly this structure:

{{
  "job_match_score": <0-100 integer, how well resume matches the specific job description>,
  "ats_score": <0-100 integer, how well it would pass ATS filters>,
  "keyword_score": <0-100 integer, keyword density and relevance to job>,
  "readability": <0-100 integer, formatting, structure, clarity>,
  "impact_score": <0-100 integer, use of quantified achievements>,
  "overall": <0-100 integer, weighted average of all scores>,
  "grade": <"A" | "B" | "C" | "D" | "F">,

  "matched_keywords": [<list of keywords from JD that appear in resume, max 15 strings>],
  "missing_keywords": [<list of important keywords from JD missing from resume, max 15 strings>],
  "missing_skills": [<list of required skills from JD not demonstrated in resume, max 10 strings>],

  "headline": <one sentence summary comparing resume to this specific job>,

  "suggestions": [
    {{
      "priority": <"critical" | "high" | "medium">,
      "category": <"ATS" | "Keywords" | "Impact" | "Format" | "Content" | "Job Match">,
      "title": <short title>,
      "detail": <1-2 sentence actionable advice specific to this job>
    }}
  ]
}}

Rules:
- suggestions must have exactly 6 items (2 critical, 2 high, 2 medium)
- job_match_score reflects how well the resume targets THIS specific job description
- matched_keywords and missing_keywords come from the actual job description
- Be specific — reference actual job requirements and resume content
- If no job description is provided, set job_match_score to null and analyze generically

Job Description:
{job_description}

Resume:
{resume_text}
"""


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from PDF bytes using pdfplumber."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
    return "\n".join(text_parts)


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract all text from DOCX bytes."""
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text(file_bytes: bytes, filename: str) -> str:
    """Route to correct extractor based on filename extension."""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ("docx", "doc"):
        return extract_text_from_docx(file_bytes)
    elif ext == "txt":
        return file_bytes.decode("utf-8", errors="ignore")
    else:
        try:
            return extract_text_from_pdf(file_bytes)
        except Exception:
            return file_bytes.decode("utf-8", errors="ignore")


def analyze_with_ai(resume_text: str, job_description: str = "") -> dict:
    """Call OpenAI to get structured analysis. Falls back to heuristic if no API key."""
    if not client.api_key or client.api_key == "sk-...":
        return heuristic_analysis(resume_text, job_description)

    # Truncate to stay within token limits
    truncated_resume = resume_text[:5000]
    truncated_jd = job_description[:2000] if job_description else "No job description provided."

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": ANALYSIS_PROMPT.format(
                    resume_text=truncated_resume,
                    job_description=truncated_jd
                )},
            ],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"},
        )
        raw = resp.choices[0].message.content
        result = json.loads(raw)
        result["raw_text_len"] = len(resume_text)
        result["used_ai"] = True
        # Normalize field names
        if "keywords_found" not in result and "matched_keywords" in result:
            result["keywords_found"] = result["matched_keywords"]
        if "keywords_missing" not in result and "missing_keywords" in result:
            result["keywords_missing"] = result["missing_keywords"]
        return result
    except Exception as e:
        print(f"[ANALYZER] OpenAI error: {e} — falling back to heuristic")
        return heuristic_analysis(resume_text, job_description)


def heuristic_analysis(text: str, job_description: str = "") -> dict:
    """
    Fallback heuristic analyzer when OpenAI is not configured.
    Useful for local dev and demo without API keys.
    """
    text_lower = text.lower()
    jd_lower = job_description.lower() if job_description else ""
    word_count = len(text.split())

    # ATS keywords by category
    power_keywords = [
        "achieved", "managed", "led", "developed", "implemented", "designed",
        "optimized", "increased", "reduced", "launched", "delivered", "built",
        "python", "javascript", "react", "aws", "sql", "machine learning",
        "api", "agile", "scrum", "kubernetes", "docker", "ci/cd",
    ]
    quantifiers = re.findall(r"\d+%|\$\d+|\d+x|\d+k|\d+ (users|clients|team|members|projects)", text_lower)
    found_kw = [kw for kw in power_keywords if kw in text_lower][:10]
    missing_kw = [kw for kw in power_keywords if kw not in text_lower][:8]

    has_email = bool(re.search(r"[\w.-]+@[\w.-]+\.\w+", text))
    has_phone = bool(re.search(r"\+?\d[\d\s\-()]{7,}", text))
    has_sections = sum(1 for s in ["experience", "education", "skills", "projects"] if s in text_lower)

    # Job match scoring based on JD keyword overlap — computed first so other scores can use it
    matched_keywords = []
    missing_keywords = []
    missing_skills = []
    job_match_score = None
    jd_match_ratio = 0.5  # neutral default when no JD provided

    if jd_lower:
        # Extract meaningful words and multi-word tech phrases from JD
        jd_words = re.findall(r'\b[a-z][a-z+#.]{2,}\b', jd_lower)
        stopwords = {"the", "and", "for", "with", "that", "this", "will", "are", "was", "has", "have", "been",
                     "you", "our", "your", "their", "from", "they", "all", "can", "not", "but", "its", "who",
                     "also", "well", "more", "such", "each", "into", "able", "both", "only", "very", "most",
                     "some", "any", "use", "using", "used", "work", "working", "strong", "good", "best"}
        jd_terms = list(set(w for w in jd_words if w not in stopwords and len(w) > 3))

        # Also extract multi-word technical phrases
        tech_phrases = re.findall(
            r'\b(machine learning|deep learning|data structures|rest api|restful api|ci[/ ]cd|'
            r'object.oriented|natural language|neural network|large language|computer vision)\b', jd_lower)
        jd_terms.extend(tech_phrases)
        jd_terms = list(set(jd_terms))[:60]

        for term in jd_terms:
            if term in text_lower:
                matched_keywords.append(term)
            else:
                missing_keywords.append(term)

        matched_keywords = sorted(matched_keywords, key=len, reverse=True)[:15]
        missing_keywords = sorted(missing_keywords, key=len, reverse=True)[:15]

        # Skills from JD not in resume — check a broad set
        all_skills = [
            "python", "javascript", "java", "react", "node", "aws", "docker", "kubernetes",
            "sql", "postgres", "postgresql", "mongodb", "redis", "terraform", "machine learning",
            "deep learning", "nlp", "typescript", "golang", "rust", "c++", "swift", "kotlin",
            "flutter", "vue", "angular", "fastapi", "flask", "django", "tensorflow", "pytorch",
            "scikit-learn", "pandas", "numpy", "spark", "kafka", "elasticsearch", "graphql",
            "android", "ios", "firebase", "jetpack", "retrofit", "coroutines", "mvvm",
            "kotlin", "java", "room", "gradle", "material design",
        ]
        missing_skills = [s for s in all_skills if s in jd_lower and s not in text_lower][:10]

        # Job match: ratio of matched JD terms found in resume
        total_jd = len(matched_keywords) + len(missing_keywords)
        job_match_score = int((len(matched_keywords) / max(total_jd, 1)) * 100) if total_jd > 0 else 50
        jd_match_ratio = len(matched_keywords) / max(total_jd, 1)
    else:
        matched_keywords = found_kw
        missing_keywords = missing_kw

    # ── Scores that vary with how well the resume fits the JD ──────────────────
    # ATS: does the resume contain the structural + keyword signals the JD demands?
    jd_kw_ats_bonus = int(jd_match_ratio * 30) if jd_lower else 15  # 0-30 pts from JD alignment
    ats_score = min(100, 35
                    + len(found_kw) * 2
                    + (8 if has_email else 0)
                    + (5 if has_phone else 0)
                    + has_sections * 4
                    + jd_kw_ats_bonus)

    # Keyword score: entirely driven by overlap with JD when JD is present
    if jd_lower:
        keyword_score = min(100, int(jd_match_ratio * 100))
    else:
        keyword_score = min(100, int((len(found_kw) / max(len(power_keywords), 1)) * 100))

    # Readability: structural quality + mild JD context (well-formatted resume reads better for the role)
    readability_base = min(100, 45 + has_sections * 10 + (8 if 300 < word_count < 900 else 0) + (5 if has_email else 0))
    # Penalise readability slightly for highly mismatched roles (recruiter noise)
    if jd_lower:
        readability = int(readability_base * (0.75 + 0.25 * jd_match_ratio))
    else:
        readability = readability_base

    # Impact score: quantified achievements in resume + bonus when they align with JD domain
    base_impact = min(100, 20 + len(quantifiers) * 12)
    if jd_lower:
        # If the candidate's impact bullets mention JD-relevant terms, amplify; otherwise dampen
        jd_impact_terms = [kw for kw in matched_keywords if any(
            t in text_lower for t in [kw + " by", kw + " from", kw + " to"])]
        impact_alignment_bonus = min(20, len(jd_impact_terms) * 5)
        # Dampen heavily if very low JD match (impacts are about wrong domain)
        impact_score = int(min(100, (base_impact + impact_alignment_bonus) * (0.6 + 0.4 * jd_match_ratio)))
    else:
        impact_score = base_impact

    overall = int((ats_score * 0.25 + keyword_score * 0.25 + readability * 0.15 + impact_score * 0.15 +
                   ((job_match_score or 50) * 0.20)))

    if overall >= 85:   grade = "A"
    elif overall >= 70: grade = "B"
    elif overall >= 55: grade = "C"
    elif overall >= 40: grade = "D"
    else:               grade = "F"

    jd_context = "for this specific role" if job_description else "generally"
    suggestions = [
        {"priority": "critical", "category": "Job Match", "title": "Tailor keywords to job description",
         "detail": f"Add these high-priority keywords from the job posting: {', '.join(missing_keywords[:5])}. Mirror exact terms used by the employer."},
        {"priority": "critical", "category": "ATS", "title": "Add ATS-friendly section headers",
         "detail": "Use standard headers like 'Work Experience', 'Education', 'Skills'. ATS bots fail to parse creative section names."},
        {"priority": "high", "category": "Impact", "title": "Quantify your achievements",
         "detail": "Replace vague bullets with measurable results. E.g., 'Improved performance' → 'Improved API response time by 40% serving 50K daily users'."},
        {"priority": "high", "category": "Keywords", "title": "Add missing technical skills",
         "detail": f"The job requires: {', '.join(missing_skills[:5] or missing_keywords[:5])}. Add these where you have relevant experience."},
        {"priority": "medium", "category": "Content", "title": "Add LinkedIn and GitHub profile links",
         "detail": "73% of recruiters verify LinkedIn before contacting. Include your URL prominently in the header."},
        {"priority": "medium", "category": "Format", "title": "Optimize resume length",
         "detail": f"Your resume is {'too short' if word_count < 300 else 'too long' if word_count > 900 else 'well-sized'} at ~{word_count} words. Aim for 400-700 words for most roles."},
    ]

    return {
        "job_match_score": job_match_score,
        "ats_score": int(ats_score),
        "keyword_score": int(keyword_score),
        "readability": int(readability),
        "impact_score": int(impact_score),
        "overall": overall,
        "grade": grade,
        "headline": f"Resume scores {overall}/100 {jd_context} — {'strong match, refine keywords' if overall > 65 else 'significant improvements needed to pass ATS filters'}.",
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "missing_skills": missing_skills,
        "keywords_found": matched_keywords,   # backward compat
        "keywords_missing": missing_keywords,  # backward compat
        "suggestions": suggestions,
        "raw_text_len": len(text),
        "used_ai": False,
    }


def analyze_resume(file_bytes: bytes, filename: str, job_description: str = "") -> dict:
    """Main entry point: extract text, run analysis, return result dict."""
    text = extract_text(file_bytes, filename)
    if len(text.strip()) < 50:
        raise ValueError("Could not extract readable text from this file. Please check the file format.")
    return analyze_with_ai(text, job_description)
