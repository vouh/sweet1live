"""Creating Stripe Checkout Sessions for an order.

We use hosted Checkout rather than a bespoke card form: Stripe holds the PCI
burden, and the venue gets Apple Pay / Google Pay / Link for free.
"""

import time
from dataclasses import dataclass

from sqlmodel import Session

from app.config import settings
from app.models import CheckoutSessionResponse, Order
from app.stripe_client import require_stripe

# Stripe rejects a session that expires in under 30 minutes.
STRIPE_MIN_SESSION_MINUTES = 30


@dataclass
class LineItem:
    name: str
    amount_pence: int
    quantity: int
    description: str = ""


def create_checkout_for_order(
    db: Session,
    order: Order,
    line_items: list[LineItem],
) -> CheckoutSessionResponse:
    """Send the customer to Stripe, or settle now if nothing is owed."""
    if order.subtotal_pence <= 0:
        # Free tickets or a deposit-free room: no card needed. Fulfil directly.
        from app.fulfilment import mark_order_paid

        mark_order_paid(db, order)
        return CheckoutSessionResponse(
            order_reference=order.reference,
            checkout_url=None,
            settled_without_payment=True,
        )

    stripe = require_stripe()
    expires_at = int(time.time() + max(settings.checkout_hold_minutes, STRIPE_MIN_SESSION_MINUTES) * 60)

    session = stripe.checkout.Session.create(
        mode="payment",
        customer_email=order.customer_email,
        client_reference_id=order.reference,
        expires_at=expires_at,
        line_items=[
            {
                "quantity": item.quantity,
                "price_data": {
                    "currency": order.currency,
                    "unit_amount": item.amount_pence,
                    "product_data": (
                        {"name": item.name, "description": item.description}
                        if item.description
                        else {"name": item.name}
                    ),
                },
            }
            for item in line_items
        ],
        # The webhook trusts this metadata to find the order — it is written by
        # us, never by the client.
        metadata={"order_id": order.id, "order_reference": order.reference, "kind": order.kind},
        payment_intent_data={
            "metadata": {"order_id": order.id, "order_reference": order.reference},
        },
        success_url=(
            f"{settings.public_site_url}/checkout/success"
            f"?ref={order.reference}&session_id={{CHECKOUT_SESSION_ID}}"
        ),
        cancel_url=f"{settings.public_site_url}/checkout/cancelled?ref={order.reference}",
    )

    order.stripe_checkout_session_id = session.id
    db.add(order)
    db.commit()
    db.refresh(order)

    return CheckoutSessionResponse(order_reference=order.reference, checkout_url=session.url)
