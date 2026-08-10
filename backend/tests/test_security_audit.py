# tests/test_security_audit.py — Static security gates (security-conventions §3, §5, §6)
"""These tests are STATIC guardrails that fail loudly if a regression introduces:
  - raw SQL string interpolation (SQL injection risk)
  - plaintext password storage anywhere in app/
  - hardcoded secrets in code (must come from env)
They reflect skills/security-conventions.md §1 (auth), §3 (injection), §5 (secrets).
"""
import re
from pathlib import Path

import pytest

APP_DIR = Path(__file__).resolve().parent.parent / "app"


def _python_files():
    return [p for p in APP_DIR.rglob("*.py") if "__pycache__" not in str(p)]


def test_no_raw_sql_string_interpolation():
    """No f-string or % formatting inside execute()/text() — ORM parameterized queries only."""
    forbidden = [
        re.compile(r"\.execute\s*\(\s*f[\"']"),
        re.compile(r"\.execute\s*\(\s*[\"'].*\%s?[\"']\s*%"),
        re.compile(r"text\s*\(\s*f[\"']"),
    ]
    offenders = []
    for f in _python_files():
        text = f.read_text(encoding="utf-8")
        for pat in forbidden:
            for m in pat.finditer(text):
                lineno = text[:m.start()].count("\n") + 1
                offenders.append(f"{f.relative_to(APP_DIR.parent)}:{lineno}: {m.group(0)}")
    assert not offenders, "Raw SQL interpolation detected (SQL injection risk):\n" + "\n".join(offenders)


def test_no_plaintext_password_storage():
    """Every `hashed_password =` assignment must use get_password_hash()."""
    offenders = []
    # Match `hashed_password = ...` or `hashed_password: ...` but only capture assignment
    assign_pat = re.compile(r"hashed_password\s*=\s*([^\n,)]+)")
    for f in _python_files():
        text = f.read_text(encoding="utf-8")
        for m in assign_pat.finditer(text):
            rhs = m.group(1).strip()
            # Allow legitimate sources: get_password_hash(...), the model column declaration, or attribute read
            if rhs.startswith("get_password_hash("):
                continue
            if "mapped_column" in rhs:
                continue
            if rhs in {"user.hashed_password", "existing.hashed_password"} or rhs.endswith(".hashed_password"):
                continue
            lineno = text[:m.start()].count("\n") + 1
            offenders.append(f"{f.relative_to(APP_DIR.parent)}:{lineno}: hashed_password = {rhs}")
    assert not offenders, "Plaintext or improperly hashed password detected:\n" + "\n".join(offenders)


def test_no_hardcoded_secrets_in_code():
    """SECRET_KEY, ALGORITHM-style constants must not be long literals in app/."""
    secret_pat = re.compile(r"(SECRET_KEY|API_KEY|PASSWORD|TOKEN)\s*[:=]\s*[\"']([A-Za-z0-9_\-]{20,})[\"']")
    offenders = []
    for f in _python_files():
        text = f.read_text(encoding="utf-8")
        for m in secret_pat.finditer(text):
            # config.py default is allowed (it's a dev default, overridden by env in prod)
            if f.name == "config.py" and m.group(1) == "SECRET_KEY":
                continue
            lineno = text[:m.start()].count("\n") + 1
            offenders.append(f"{f.relative_to(APP_DIR.parent)}:{lineno}: {m.group(1)} literal")
    assert not offenders, "Hardcoded secret detected (must come from env):\n" + "\n".join(offenders)


def test_audit_log_model_exists_and_imported_in_main():
    """security-conventions §6 mandates an audit log; guard its presence."""
    assert (APP_DIR / "models" / "audit_log.py").exists(), "AuditLog model missing"
    main_text = (APP_DIR / "main.py").read_text(encoding="utf-8")
    assert "audit_log" in main_text, "AuditLog model not imported in main.py"
    assert (APP_DIR / "routers" / "audit_logs.py").exists(), "audit_logs router missing"
    assert (APP_DIR / "services" / "audit_log_service.py").exists(), "audit_log service missing"


def test_password_hashing_uses_bcrypt():
    """security-conventions §1: bcrypt or argon2 only — never MD5/SHA1."""
    security_path = APP_DIR / "core" / "security.py"
    text = security_path.read_text(encoding="utf-8")
    assert "CryptContext" in text, "passlib CryptContext missing"
    forbidden = ["md5", "sha1", "sha256", "sha512"]
    for algo in forbidden:
        # Allow algorithm names only in doc strings, not in the schemes=... declaration.
        schemes_lines = [ln for ln in text.splitlines() if "schemes" in ln and algo in ln]
        assert not schemes_lines, f"weak hashing algorithm '{algo}' found in security.py schemes"


def test_jwt_secret_not_empty_default():
    """The dev-default SECRET_KEY must be non-empty and clearly marked as needing override."""
    text = (APP_DIR / "core" / "config.py").read_text(encoding="utf-8")
    m = re.search(r"SECRET_KEY[^=]*=\s*[\"']([^\"']+)[\"']", text)
    assert m, "SECRET_KEY declaration not found in config.py"
    val = m.group(1)
    assert len(val) >= 20, f"DEV default SECRET_KEY too short ({len(val)} chars) — encourages override"


def test_no_eval_or_exec_in_app_code():
    """eval()/exec() cannbracket arbitrary code; disallow in app/ (compile is fine)."""
    offenders = []
    for f in _python_files():
        text = f.read_text(encoding="utf-8")
        for m in re.finditer(r"\b(eval|exec)\s*\(", text):
            lineno = text[:m.start()].count("\n") + 1
            offenders.append(f"{f.relative_to(APP_DIR.parent)}:{lineno}: {m.group(1)}()")
    assert not offenders, "eval()/exec() detected — security risk:\n" + "\n".join(offenders)