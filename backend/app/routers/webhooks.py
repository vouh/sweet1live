import logging

from fastapi import APIRouter, Depends, Header, Request
from sqlmodel import Session, select

from app.database import get_db
from app.fulfilment import mark_order_cancelled, mark_order_paid, mark_order_refunded
from app.models import Order, StripeEvent
from app.stripe_client import construct_webhook_event

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stripe", tags=["stripe"])

HANDLED = {
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.expired",
    "checkout.session.async_payment_failed",
    "charge.refunded",
}


def _order_from_object(db: Session, obj: dict) -> Order | None:
    """Find the order a Stripe object belongs to.

    Prefers our own metadata, then the session id, then the payment intent —
    `charge.refunded` carries none of the first two.
    """
    metadata = obj.get("metadata") or {}
    order_id = metadata.get("order_id")
    if order_id:
        order = db.get(Order, order_id)
        if order:
            return order

    session_id = obj.get("id") if obj.get("object") == "checkout.session" else None
    if session_id:
        order = db.exec(
            select(Order).where(Order.stripe_checkout_session_id == session_id)
        ).first()
        if order:
            return order

    payment_intent = obj.get("payment_intent")
    if isinstance(payment_intent, str):
        return db.exec(
            select(Order).where(Order.stripe_payment_intent_id == payment_intent)
        ).first()

    return None


@router.post("/webhook", status_code=200)
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    """Stripe's callback — the authoritative signal that money moved.

    Always returns 2xx once the signature verifies, even for events we ignore,
    so Stripe does not retry them forever.
    """
    payload = await request.body()
    event = construct_webhook_event(payload, stripe_signature)

    event_id = event["id"]
    event_type = event["type"]

    if event_type not in HANDLED:
        return {"received": True, "handled": False}

    # Stripe delivers at least once. The primary key on stripe_events is what
    # stops a redelivery from minting a second set of tickets.
    if db.get(StripeEvent, event_id) is not None:
        return {"received": True, "duplicate": True}

    obj = event["data"]["object"]
    order = _order_from_object(db, obj)

    if order is None:
        logger.warning("Stripe event %s (%s) matched no order", event_id, event_type)
        db.add(StripeEvent(id=event_id, type=event_type))
        db.commit()
        return {"received": True, "handled": False}

    if event_type in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        # `completed` fires for delayed methods too, before the money lands —
        # only fulfil once payment_status says it is actually paid.
        if obj.get("payment_status") == "paid":
            payment_intent = obj.get("payment_intent")
            mark_order_paid(
                db,
                order,
                payment_intent if isinstance(payment_intent, str) else None,
                stripe_currency=obj.get("currency"),
                stripe_amount_total=obj.get("amount_total"),
            )
        else:
            logger.info("Order %s awaiting async payment", order.reference)

    elif event_type == "checkout.session.expired":
        mark_order_cancelled(db, order, new_status="expired")

    elif event_type == "checkout.session.async_payment_failed":
        mark_order_cancelled(db, order, new_status="cancelled")

    elif event_type == "charge.refunded":
        # Partial refunds leave the booking standing; only a full refund voids it.
        if obj.get("amount_refunded") and obj.get("amount_refunded") >= obj.get("amount", 0):
            mark_order_refunded(db, order)

    db.add(StripeEvent(id=event_id, type=event_type))
    db.commit()

    return {"received": True, "handled": True, "order": order.reference}
