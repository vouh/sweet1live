import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_db
from app.fulfilment import mark_order_paid, serialize_order
from app.models import Order, OrderPublic, User
from app.stripe_client import require_stripe

router = APIRouter(prefix="/orders", tags=["orders"])


def _authorise(
    db: Session,
    reference: str,
    email: str | None,
    session_id: str | None,
) -> Order:
    """Resolve an order for a guest who has no account.

    Either credential proves ownership: the email they gave at checkout, or the
    Stripe Checkout Session id, which Stripe hands only to the buyer's browser
    on the success redirect. Every failure returns the same 404 so references
    cannot be enumerated.
    """
    not_found = HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order = db.exec(select(Order).where(Order.reference == reference)).first()
    if order is None:
        raise not_found

    if session_id and order.stripe_checkout_session_id:
        if secrets.compare_digest(session_id, order.stripe_checkout_session_id):
            return order

    if email and secrets.compare_digest(order.customer_email, email.lower()):
        return order

    raise not_found


@router.get("/{reference}", response_model=OrderPublic)
def get_order(
    reference: str,
    email: str | None = Query(default=None, description="The email used at checkout"),
    session_id: str | None = Query(default=None, description="Stripe Checkout Session id"),
    db: Session = Depends(get_db),
):
    return serialize_order(db, _authorise(db, reference, email, session_id))


@router.post("/{reference}/sync", response_model=OrderPublic)
def sync_order(
    reference: str,
    email: str | None = Query(default=None, description="The email used at checkout"),
    session_id: str | None = Query(default=None, description="Stripe Checkout Session id"),
    db: Session = Depends(get_db),
):
    """Reconcile an order against Stripe directly.

    The webhook is the source of truth, but it can be slow (or, in local dev,
    not forwarded at all). The success page calls this so the guest sees their
    tickets immediately. Both paths end in the same idempotent `mark_order_paid`.
    """
    order = _authorise(db, reference, email, session_id)

    if order.status == "pending" and order.stripe_checkout_session_id:
        stripe = require_stripe()
        session = stripe.checkout.Session.retrieve(order.stripe_checkout_session_id)
        if session.get("payment_status") == "paid":
            payment_intent = session.get("payment_intent")
            mark_order_paid(
                db,
                order,
                payment_intent if isinstance(payment_intent, str) else None,
            )

    return serialize_order(db, order)


@router.get("", response_model=list[OrderPublic])
def my_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Order history for the signed-in guest."""
    orders = db.exec(
        select(Order)
        .where(Order.user_id == user.id, Order.status.in_(("paid", "refunded")))  # type: ignore[attr-defined]
        .order_by(Order.created_at.desc())  # type: ignore[attr-defined]
    ).all()
    return [serialize_order(db, order) for order in orders]
