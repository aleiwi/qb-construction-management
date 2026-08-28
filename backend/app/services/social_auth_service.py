"""OAuth2 social login (Google / Facebook / Microsoft / GitHub).

Two flows are supported:

1. Redirect flow (default): the backend redirects the browser to the provider,
   the provider calls back `/auth/oauth/{provider}/callback` with a `code`,
   which the backend exchanges for an access token and profile.
2. Token flow (SPA/mobile): the frontend obtains an access token from the
   provider itself and posts it to `/auth/oauth/{provider}/token`.

Both end with the same `social_login()` logic:
  - existing link (provider + provider_user_id)  -> log the user in
  - existing user with the same verified email   -> link + log in
  - otherwise                                    -> create user (ENGINEER by
    default; never admin), link + log in.
"""
import httpx
from typing import Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, JWTError

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.models.user import User, UserRole
from app.models.oauth_account import OAuthAccount
from app.schemas.auth import TokenResponse
from app.schemas.user import UserOut
from app.services.audit_log_service import AuditLogService


class OAuthNotConfiguredError(Exception):
    pass


class OAuthExchangeError(Exception):
    pass


class OAuthStateError(Exception):
    pass


class ProviderConfig:
    def __init__(self, name: str, auth_url: str, token_url: str, userinfo_url: str,
                 scope: str, user_id_field: str, email_field: str = "email",
                 name_field: str = "name", extra_auth: Optional[dict] = None):
        self.name = name
        self.auth_url = auth_url
        self.token_url = token_url
        self.userinfo_url = userinfo_url
        self.scope = scope
        self.user_id_field = user_id_field
        self.email_field = email_field
        self.name_field = name_field
        self.extra_auth = extra_auth or {}

    @property
    def client_id(self) -> str:
        return getattr(settings, f"{self.name.upper()}_CLIENT_ID", "")

    @property
    def client_secret(self) -> str:
        return getattr(settings, f"{self.name.upper()}_CLIENT_SECRET", "")

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)


PROVIDERS: dict[str, ProviderConfig] = {
    "google": ProviderConfig(
        name="google",
        auth_url="https://accounts.google.com/o/oauth2/v2/auth",
        token_url="https://oauth2.googleapis.com/token",
        userinfo_url="https://openidconnect.googleapis.com/v1/userinfo",
        scope="openid email profile",
        user_id_field="sub",
    ),
    "facebook": ProviderConfig(
        name="facebook",
        auth_url="https://www.facebook.com/v19.0/dialog/oauth",
        token_url="https://graph.facebook.com/v19.0/oauth/access_token",
        userinfo_url="https://graph.facebook.com/me",
        scope="email public_profile",
        user_id_field="id",
        extra_auth={"fields": "id,name,email"},
    ),
    "microsoft": ProviderConfig(
        name="microsoft",
        auth_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        token_url="https://login.microsoftonline.com/common/oauth2/v2.0/token",
        userinfo_url="https://graph.microsoft.com/oidc/userinfo",
        scope="openid email profile",
        user_id_field="sub",
    ),
    "github": ProviderConfig(
        name="github",
        auth_url="https://github.com/login/oauth/authorize",
        token_url="https://github.com/login/oauth/access_token",
        userinfo_url="https://api.github.com/user",
        scope="read:user user:email",
        user_id_field="id",
        name_field="name",
    ),
}


def configured_providers() -> list[str]:
    return [name for name, cfg in PROVIDERS.items() if cfg.is_configured()]


def get_provider(name: str) -> Optional[ProviderConfig]:
    cfg = PROVIDERS.get(name)
    if cfg is None or not cfg.is_configured():
        return None
    return cfg


def _redirect_uri(provider: str) -> str:
    base = settings.PUBLIC_API_URL.rstrip("/")
    return f"{base}{settings.API_V1_STR}/auth/oauth/{provider}/callback"


def create_state_token(provider: str) -> str:
    payload = {
        "type": "oauth_state",
        "provider": provider,
        "exp": datetime.utcnow() + timedelta(minutes=settings.OAUTH_STATE_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_state_token(state: str, provider: str) -> None:
    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise OAuthStateError("حالة تسجيل الدخول غير صالحة أو منتهية")
    if payload.get("type") != "oauth_state" or payload.get("provider") != provider:
        raise OAuthStateError("حالة تسجيل الدخول غير صالحة")


def build_authorize_url(provider: str) -> str:
    cfg = get_provider(provider)
    if cfg is None:
        raise OAuthNotConfiguredError("مزود تسجيل الدخول هذا غير مفعّل")
    from urllib.parse import urlencode
    params = {
        "client_id": cfg.client_id,
        "redirect_uri": _redirect_uri(provider),
        "response_type": "code",
        "scope": cfg.scope,
        "state": create_state_token(provider),
        "prompt": "select_account",
        **cfg.extra_auth,
    }
    return f"{cfg.auth_url}?{urlencode(params)}"


def _http() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=15.0)


async def exchange_code(provider: str, code: str, http: Optional[httpx.AsyncClient] = None) -> Tuple[str, str, str]:
    """Exchange an authorization code for (provider_user_id, email, name)."""
    cfg = get_provider(provider)
    if cfg is None:
        raise OAuthNotConfiguredError("مزود تسجيل الدخول هذا غير مفعّل")
    close = False
    if http is None:
        http = _http()
        close = True
    try:
        token_resp = await http.post(cfg.token_url, data={
            "client_id": cfg.client_id,
            "client_secret": cfg.client_secret,
            "redirect_uri": _redirect_uri(provider),
            "grant_type": "authorization_code",
            "code": code,
        }, headers={"Accept": "application/json"})
        if token_resp.status_code >= 400:
            raise OAuthExchangeError("فشل تبادل رمز التفويض مع المزود")
        data = token_resp.json()
        access_token = data.get("access_token")
        if not access_token:
            raise OAuthExchangeError("لم يستجب المزود برمز وصول")
        return await fetch_profile(provider, access_token, http)
    finally:
        if close:
            await http.aclose()


async def fetch_profile(provider: str, access_token: str, http: Optional[httpx.AsyncClient] = None) -> Tuple[str, str, str]:
    """Fetch (provider_user_id, email, name) from the provider's userinfo endpoint."""
    cfg = get_provider(provider)
    if cfg is None:
        raise OAuthNotConfiguredError("مزود تسجيل الدخول هذا غير مفعّل")
    close = False
    if http is None:
        http = _http()
        close = True
    try:
        params = {"access_token": access_token}
        params.update(cfg.extra_auth)
        if cfg.name == "github":
            headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"}
        else:
            headers = {"Authorization": f"Bearer {access_token}"}
        resp = await http.get(cfg.userinfo_url, params=params, headers=headers)
        if resp.status_code >= 400:
            raise OAuthExchangeError("فشل جلب بيانات المستخدم من المزود")
        data = resp.json()
        user_id = str(data.get(cfg.user_id_field) or "").strip()
        email = (data.get(cfg.email_field) or "").strip().lower()
        if not user_id:
            raise OAuthExchangeError("لم يقدم المزود معرّف المستخدم")
        name = (data.get(cfg.name_field) or "").strip() or None
        if cfg.name == "github" and not email:
            emails = await http.get("https://api.github.com/user/emails",
                                    headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"})
            if emails.status_code == 200:
                for e in emails.json():
                    if e.get("primary"):
                        email = (e.get("email") or "").strip().lower()
                        break
        return user_id, email, name
    finally:
        if close:
            await http.aclose()


async def social_login(
    db: AsyncSession,
    provider: str,
    provider_user_id: str,
    email: str,
    name: Optional[str],
    ip_address: Optional[str] = None,
) -> Tuple[User, bool]:
    """Find / link / create the user behind a social account.

    Returns (user, created). Provider email is trusted as verified (the
    provider already verified it).
    """
    oauth = (await db.execute(
        select(OAuthAccount).filter(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_user_id == provider_user_id,
        )
    )).scalars().first()

    audit = AuditLogService(db)

    if oauth is not None:
        user = await db.get(User, oauth.user_id)
        if user is None:
            raise OAuthExchangeError("الحساب المرتبط غير موجود")
        await audit.log(user_id=user.id, action="user_login_social", entity_type="user",
                        entity_id=user.id, old_value={"provider": provider},
                        new_value={"provider_user_id": provider_user_id}, ip_address=ip_address)
        return user, False

    user = None
    if email:
        user = (await db.execute(select(User).filter(User.email == email))).scalars().first()

    if user is not None:
        db.add(OAuthAccount(user_id=user.id, provider=provider, provider_user_id=provider_user_id,
                            email=email, full_name=name or user.full_name))
        await db.commit()
        await audit.log(user_id=user.id, action="user_linked_social", entity_type="user",
                        entity_id=user.id, old_value={"provider": provider},
                        new_value={"provider_user_id": provider_user_id}, ip_address=ip_address)
        return user, False

    new_user = User(
        email=email or f"social_{provider}_{provider_user_id}@social.qb",
        full_name=name or "مستخدم جديد",
        hashed_password=get_password_hash(provider_user_id),
        role=UserRole.ENGINEER,
        is_active=True,
        is_email_verified=True,
    )
    db.add(new_user)
    await db.flush()
    db.add(OAuthAccount(user_id=new_user.id, provider=provider, provider_user_id=provider_user_id,
                        email=email or "", full_name=name))
    await db.commit()
    await db.refresh(new_user)
    await audit.log(user_id=new_user.id, action="user_created_social", entity_type="user",
                    entity_id=new_user.id,
                    old_value={"provider": provider},
                    new_value={"email": new_user.email, "role": new_user.role.value},
                    ip_address=ip_address)
    return new_user, True


def issue_tokens(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(subject=user.id),
        refresh_token=create_refresh_token(subject=user.id),
        user=UserOut.model_validate(user),
    )