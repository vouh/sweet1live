"""Security headers and request body size limits."""

from __future__ import annotations

from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from sqlmodel import Session

from app.audit import record_audit
from app.auth import get_staff_from_token
from app.database import engine

MAX_BODY_BYTES = 1_048_576  # 1 MiB

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
}


async def security_middleware(request: Request, call_next) -> Response:
    """HTTP middleware — avoid BaseHTTPMiddleware so FastAPI exception handlers
    (and their CORS headers) still run on 4xx/5xx responses."""
    if request.method in ("POST", "PUT", "PATCH"):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > MAX_BODY_BYTES:
                    return JSONResponse(
                        {"detail": "Request body too large."},
                        status_code=413,
                    )
            except ValueError:
                pass

    response = await call_next(request)

    is_delete_action = request.method == "DELETE" or (
        request.method == "POST" and request.url.path.endswith("/bulk-delete")
    )
    if is_delete_action and response.status_code < 400 and request.url.path.startswith("/admin/"):
        authorization = request.headers.get("authorization", "")
        if authorization.lower().startswith("bearer "):
            try:
                with Session(engine) as db:
                    actor = get_staff_from_token(authorization[7:], db)
                    if actor:
                        forwarded = request.headers.get("x-forwarded-for", "")
                        ip = forwarded.split(",", 1)[0].strip() or (
                            request.client.host if request.client else ""
                        )
                        record_audit(
                            db,
                            action="records.deleted",
                            actor=actor,
                            target=request.url.path,
                            detail="Bulk deletion" if request.url.path.endswith("/bulk-delete") else "Record deleted",
                            ip_address=ip,
                        )
            except Exception:
                # Audit logging must never turn an otherwise successful admin
                # operation into an error response.
                pass
    for key, value in SECURITY_HEADERS.items():
        if key not in response.headers:
            response.headers[key] = value
    return response
