import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.security_middleware import SecurityMiddleware
from sqlmodel import Session, SQLModel

from app.config import settings
from app.database import engine
from app.inventory import expire_stale_holds
from app.routers import (
    admin,
    auth,
    checkout,
    contact,
    events,
    menus,
    orders,
    reservations,
    rooms,
    staff_auth,
    staff_rbac,
    tickets,
    venue_enquiries,
    webhooks,
)
from app.staff_seed import init_rbac

logger = logging.getLogger(__name__)
logging.getLogger("sweet1ne.security").setLevel(logging.WARNING)

SWEEP_INTERVAL_SECONDS = 120


async def _sweep_expired_holds() -> None:
    """Return seats and room slots from checkouts nobody finished.

    Stripe's `checkout.session.expired` webhook normally does this; the sweeper
    is the backstop for when the webhook is delayed or the endpoint was down.
    """
    while True:
        await asyncio.sleep(SWEEP_INTERVAL_SECONDS)
        try:
            with Session(engine) as session:
                released = expire_stale_holds(session)
            if released:
                logger.info("Released %s expired hold(s)", released)
        except Exception:  # noqa: BLE001 - a sweep failure must not kill the loop
            logger.exception("Hold sweeper failed")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Ensures new tables exist even before migrations run.
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        init_rbac(session)

    sweeper = asyncio.create_task(_sweep_expired_holds())
    try:
        yield
    finally:
        sweeper.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await sweeper


app = FastAPI(title="Sweet1neLIVE API", lifespan=lifespan)

app.add_middleware(SecurityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reservations.router)
app.include_router(venue_enquiries.router)
app.include_router(auth.router)
app.include_router(staff_auth.router)
app.include_router(staff_rbac.router)
app.include_router(contact.router)
app.include_router(rooms.router)
app.include_router(events.router)
app.include_router(menus.router)
app.include_router(checkout.router)
app.include_router(orders.router)
app.include_router(tickets.router)
app.include_router(webhooks.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok", "stripe": settings.stripe_enabled}
