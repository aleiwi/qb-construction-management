import time
import threading
from collections import defaultdict, deque
from fastapi import Request, HTTPException, status

from app.core.config import settings

_lock = threading.Lock()
_hits: dict[str, deque[float]] = defaultdict(deque)


def _window_key(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "unknown"
    return client_ip


def check_login_rate_limit(request: Request) -> None:
    if settings.ENVIRONMENT != "production":
        return

    key = _window_key(request)
    now = time.monotonic()
    window = settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS
    limit = settings.LOGIN_RATE_LIMIT_ATTEMPTS

    with _lock:
        hits = _hits[key]
        while hits and now - hits[0] > window:
            hits.popleft()
        if len(hits) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="محاولات تسجيل دخول كثيرة، الرجاء الانتظار ثم إعادة المحاولة",
            )
        hits.append(now)


def reset_login_rate_limit(request: Request) -> None:
    key = _window_key(request)
    with _lock:
        _hits[key].clear()