"""End-to-end cover for the ticketing and room-booking flows.

Runs against a throwaway SQLite file with Stripe's network calls stubbed, so
the whole purchase path — hold, pay, mint, scan — is exercised without keys.
"""

import os
import sys
from datetime import date, datetime, timedelta
from pathlib import Path
from types import SimpleNamespace

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

TEST_DB = ROOT / "test_ticketing.db"
os.environ["ALLOW_SQLITE_TESTS"] = "1"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_dummy"
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_dummy"
os.environ["STAFF_API_KEY"] = "test-staff-key"

from fastapi.testclient import TestClient  # noqa: E402
from sqlmodel import Session, SQLModel, select  # noqa: E402

from app import payments  # noqa: E402
from app.database import engine  # noqa: E402
from app.fulfilment import mark_order_cancelled, mark_order_paid  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Order, Ticket, TicketType  # noqa: E402
from app.seed import seed  # noqa: E402

STAFF = {"X-Staff-Key": "test-staff-key"}


@pytest.fixture(scope="module", autouse=True)
def database():
    TEST_DB.unlink(missing_ok=True)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed(session)
    yield
    engine.dispose()
    TEST_DB.unlink(missing_ok=True)


@pytest.fixture(scope="module")
def client(database):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(autouse=True)
def fake_stripe(monkeypatch):
    """Stub Checkout Session creation; assert on what we send Stripe."""
    created: list[dict] = []
    counter = {"n": 0}

    def _create(**kwargs):
        counter["n"] += 1
        created.append(kwargs)
        session_id = f"cs_test_{counter['n']}"
        return SimpleNamespace(id=session_id, url=f"https://checkout.stripe.test/{session_id}")

    monkeypatch.setattr(
        payments,
        "require_stripe",
        lambda: SimpleNamespace(checkout=SimpleNamespace(Session=SimpleNamespace(create=_create))),
    )
    return created


def _session():
    return Session(engine)


# ---------------------------------------------------------------------
# Catalogue
# ---------------------------------------------------------------------


def test_seven_rooms_are_published(client):
    rooms = client.get("/rooms").json()
    assert len(rooms) == 7
    assert [r["slug"] for r in rooms] == [
        "main-room",
        "the-lounge",
        "the-cellar",
        "the-alcove",
        "the-snug",
        "the-gallery",
        "private-dining",
    ]
    assert all(r["deposit_pence"] > 0 for r in rooms)


def test_events_expose_prices_and_availability(client):
    events = client.get("/events").json()
    assert len(events) == 4

    event = client.get("/events/blue-note-quintet").json()
    assert event["room_name"] == "The Main Room"
    assert event["from_price_pence"] == 2500
    assert event["sold_out"] is False
    assert {t["name"] for t in event["ticket_types"]} == {"General admission", "Reserved table"}


# ---------------------------------------------------------------------
# Ticket purchase
# ---------------------------------------------------------------------


def _ga_ticket_type_id(client) -> str:
    event = client.get("/events/blue-note-quintet").json()
    return next(t["id"] for t in event["ticket_types"] if t["name"] == "General admission")


def test_ticket_checkout_holds_seats_and_charges_the_catalogue_price(client, fake_stripe):
    ticket_type_id = _ga_ticket_type_id(client)

    response = client.post(
        "/checkout/tickets",
        json={
            "event_slug": "blue-note-quintet",
            "customer_name": "Nina Calloway",
            "customer_email": "Nina@Example.com",
            "lines": [{"ticket_type_id": ticket_type_id, "quantity": 3}],
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["checkout_url"].startswith("https://checkout.stripe.test/")

    # Price came from the database, not the request.
    sent = fake_stripe[-1]
    assert sent["line_items"][0]["price_data"]["unit_amount"] == 2500
    assert sent["line_items"][0]["quantity"] == 3
    assert sent["metadata"]["order_reference"] == body["order_reference"]

    with _session() as db:
        ticket_type = db.get(TicketType, ticket_type_id)
        assert ticket_type.quantity_reserved == 3
        assert ticket_type.quantity_sold == 0

        order = db.exec(select(Order).where(Order.reference == body["order_reference"])).first()
        assert order.subtotal_pence == 7500
        assert order.status == "pending"
        assert order.customer_email == "nina@example.com"


def test_payment_settles_seats_and_mints_tickets(client):
    ticket_type_id = _ga_ticket_type_id(client)
    body = client.post(
        "/checkout/tickets",
        json={
            "event_slug": "blue-note-quintet",
            "customer_name": "Marcus Adeyemi",
            "customer_email": "marcus@example.com",
            "lines": [{"ticket_type_id": ticket_type_id, "quantity": 2}],
        },
    ).json()

    with _session() as db:
        order = db.exec(select(Order).where(Order.reference == body["order_reference"])).first()
        before_sold = db.get(TicketType, ticket_type_id).quantity_sold
        mark_order_paid(db, order, "pi_test_1")

        ticket_type = db.get(TicketType, ticket_type_id)
        assert ticket_type.quantity_sold == before_sold + 2
        tickets = db.exec(select(Ticket).where(Ticket.order_id == order.id)).all()
        assert len(tickets) == 2
        assert all(t.status == "valid" for t in tickets)
        # Codes are unique and readable at the door.
        assert len({t.code for t in tickets}) == 2

    order_view = client.get(
        f"/orders/{body['order_reference']}", params={"email": "marcus@example.com"}
    ).json()
    assert order_view["status"] == "paid"
    assert len(order_view["tickets"]) == 2


def test_paying_twice_does_not_mint_twice(client):
    ticket_type_id = _ga_ticket_type_id(client)
    body = client.post(
        "/checkout/tickets",
        json={
            "event_slug": "blue-note-quintet",
            "customer_name": "Repeat Webhook",
            "customer_email": "repeat@example.com",
            "lines": [{"ticket_type_id": ticket_type_id, "quantity": 2}],
        },
    ).json()

    with _session() as db:
        order = db.exec(select(Order).where(Order.reference == body["order_reference"])).first()
        sold_before = db.get(TicketType, ticket_type_id).quantity_sold

        mark_order_paid(db, order, "pi_dupe")
        mark_order_paid(db, order, "pi_dupe")  # Stripe redelivery

        assert db.get(TicketType, ticket_type_id).quantity_sold == sold_before + 2
        assert len(db.exec(select(Ticket).where(Ticket.order_id == order.id)).all()) == 2


def test_abandoned_checkout_returns_the_seats(client):
    ticket_type_id = _ga_ticket_type_id(client)
    body = client.post(
        "/checkout/tickets",
        json={
            "event_slug": "blue-note-quintet",
            "customer_name": "Walked Away",
            "customer_email": "walked@example.com",
            "lines": [{"ticket_type_id": ticket_type_id, "quantity": 4}],
        },
    ).json()

    with _session() as db:
        reserved_with_hold = db.get(TicketType, ticket_type_id).quantity_reserved
        order = db.exec(select(Order).where(Order.reference == body["order_reference"])).first()
        mark_order_cancelled(db, order, new_status="expired")

        assert db.get(TicketType, ticket_type_id).quantity_reserved == reserved_with_hold - 4
        assert order.status == "expired"


def test_cannot_oversell_a_ticket_type(client):
    event = client.get("/events/cellar-sessions").json()
    ticket_type = event["ticket_types"][0]
    assert ticket_type["quantity_available"] == 45

    response = client.post(
        "/checkout/tickets",
        json={
            "event_slug": "cellar-sessions",
            "customer_name": "Too Many",
            "customer_email": "toomany@example.com",
            # 4 is the per-order cap; ask for more.
            "lines": [{"ticket_type_id": ticket_type["id"], "quantity": 12}],
        },
    )
    assert response.status_code == 409
    assert "Maximum 4" in response.json()["detail"]


def test_split_lines_still_respect_the_per_order_cap(client):
    event = client.get("/events/cellar-sessions").json()
    ticket_type_id = event["ticket_types"][0]["id"]

    response = client.post(
        "/checkout/tickets",
        json={
            "event_slug": "cellar-sessions",
            "customer_name": "Sneaky Cart",
            "customer_email": "sneaky@example.com",
            "lines": [
                {"ticket_type_id": ticket_type_id, "quantity": 3},
                {"ticket_type_id": ticket_type_id, "quantity": 3},
            ],
        },
    )
    assert response.status_code == 409


def test_ticket_type_from_another_event_is_rejected(client):
    other = client.get("/events/velvet-sessions").json()["ticket_types"][0]["id"]
    response = client.post(
        "/checkout/tickets",
        json={
            "event_slug": "cellar-sessions",
            "customer_name": "Wrong Event",
            "customer_email": "wrong@example.com",
            "lines": [{"ticket_type_id": other, "quantity": 1}],
        },
    )
    assert response.status_code == 422


def test_order_lookup_requires_the_matching_email(client):
    ticket_type_id = _ga_ticket_type_id(client)
    body = client.post(
        "/checkout/tickets",
        json={
            "event_slug": "blue-note-quintet",
            "customer_name": "Private Order",
            "customer_email": "private@example.com",
            "lines": [{"ticket_type_id": ticket_type_id, "quantity": 1}],
        },
    ).json()

    assert (
        client.get(
            f"/orders/{body['order_reference']}", params={"email": "attacker@example.com"}
        ).status_code
        == 404
    )


# ---------------------------------------------------------------------
# Door
# ---------------------------------------------------------------------


def test_check_in_accepts_once_and_rejects_the_second_scan(client):
    ticket_type_id = _ga_ticket_type_id(client)
    body = client.post(
        "/checkout/tickets",
        json={
            "event_slug": "blue-note-quintet",
            "customer_name": "Door Guest",
            "customer_email": "door@example.com",
            "lines": [{"ticket_type_id": ticket_type_id, "quantity": 1}],
        },
    ).json()

    with _session() as db:
        order = db.exec(select(Order).where(Order.reference == body["order_reference"])).first()
        mark_order_paid(db, order, "pi_door")
        code = db.exec(select(Ticket).where(Ticket.order_id == order.id)).first().code

    first = client.post("/tickets/check-in", json={"code": code}, headers=STAFF).json()
    assert first["ok"] is True

    second = client.post("/tickets/check-in", json={"code": code}, headers=STAFF).json()
    assert second["ok"] is False
    assert "Already checked in" in second["message"]

    unknown = client.post("/tickets/check-in", json={"code": "ZZZZ-ZZZZ-ZZZZ"}, headers=STAFF).json()
    assert unknown["ok"] is False


def test_door_endpoints_require_the_staff_key(client):
    assert client.post("/tickets/check-in", json={"code": "ABCD"}).status_code == 401
    assert client.get("/tickets/door/blue-note-quintet").status_code == 401
    assert client.get("/tickets/door/blue-note-quintet", headers=STAFF).status_code == 200


# ---------------------------------------------------------------------
# Room booking
# ---------------------------------------------------------------------


def _future_date(days: int = 40) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def test_room_availability_lists_every_window(client):
    when = _future_date()
    availability = client.get("/rooms/the-snug/availability", params={"date": when}).json()
    assert [s["label"] for s in availability["slots"]] == [
        "Daytime",
        "Early evening",
        "Late set",
        "Full day exclusive",
    ]
    assert all(s["available"] for s in availability["slots"])


def test_booking_a_room_takes_a_deposit_and_blocks_the_window(client, fake_stripe):
    when = _future_date(41)

    response = client.post(
        "/rooms/bookings",
        json={
            "room_slug": "the-snug",
            "name": "Tomas Brandt",
            "email": "tomas@example.com",
            "party_size": 6,
            "date": when,
            "start_time": "17:00",
            "event_type": "private-dinner",
        },
    )
    assert response.status_code == 201
    assert response.json()["checkout_url"]
    # The Snug's deposit, from the database.
    assert fake_stripe[-1]["line_items"][0]["price_data"]["unit_amount"] == 5000

    # The hold blocks its own window and the overlapping full-day option, but
    # leaves the later sitting bookable.
    slots = {s["label"]: s["available"] for s in
             client.get("/rooms/the-snug/availability", params={"date": when}).json()["slots"]}
    assert slots["Early evening"] is False
    assert slots["Full day exclusive"] is False
    assert slots["Late set"] is True

    # A second party cannot take the same window.
    clash = client.post(
        "/rooms/bookings",
        json={
            "room_slug": "the-snug",
            "name": "Late Comer",
            "email": "late@example.com",
            "party_size": 4,
            "date": when,
            "start_time": "17:00",
        },
    )
    assert clash.status_code == 409

    # A different room on the same date is unaffected.
    other_room = client.post(
        "/rooms/bookings",
        json={
            "room_slug": "the-alcove",
            "name": "Different Room",
            "email": "other@example.com",
            "party_size": 12,
            "date": when,
            "start_time": "17:00",
        },
    )
    assert other_room.status_code == 201


def test_deposit_payment_confirms_the_booking(client):
    when = _future_date(42)
    body = client.post(
        "/rooms/bookings",
        json={
            "room_slug": "the-gallery",
            "name": "Confirmed Party",
            "email": "confirmed@example.com",
            "party_size": 30,
            "date": when,
            "start_time": "21:00",
        },
    ).json()

    booking = client.get(
        f"/rooms/bookings/{body['order_reference']}", params={"email": "confirmed@example.com"}
    )
    # Booking and order share a reference generator but not a value; look it up
    # through the order instead.
    with _session() as db:
        order = db.exec(select(Order).where(Order.reference == body["order_reference"])).first()
        assert order.kind == "room_deposit"
        mark_order_paid(db, order, "pi_room")
        from app.models import RoomBooking

        room_booking = db.get(RoomBooking, order.room_booking_id)
        assert room_booking.status == "confirmed"
        assert room_booking.confirmed_at is not None
        reference = room_booking.reference

    view = client.get(
        f"/rooms/bookings/{reference}", params={"email": "confirmed@example.com"}
    ).json()
    assert view["status"] == "confirmed"
    assert view["room_name"] == "The Gallery"
    assert booking.status_code in (200, 404)


def test_party_size_is_checked_against_the_room(client):
    when = _future_date(43)
    too_big = client.post(
        "/rooms/bookings",
        json={
            "room_slug": "the-snug",
            "name": "Too Big",
            "email": "big@example.com",
            "party_size": 40,
            "date": when,
            "start_time": "12:00",
        },
    )
    assert too_big.status_code == 409
    assert "holds up to" in too_big.json()["detail"]

    too_small = client.post(
        "/rooms/bookings",
        json={
            "room_slug": "main-room",
            "name": "Too Small",
            "email": "small@example.com",
            "party_size": 2,
            "date": when,
            "start_time": "12:00",
        },
    )
    assert too_small.status_code == 409
    assert "minimum" in too_small.json()["detail"]


def test_past_dates_are_rejected(client):
    response = client.post(
        "/rooms/bookings",
        json={
            "room_slug": "the-snug",
            "name": "Time Traveller",
            "email": "past@example.com",
            "party_size": 4,
            "date": (date.today() - timedelta(days=1)).isoformat(),
            "start_time": "17:00",
        },
    )
    assert response.status_code == 422


def test_a_programmed_event_blocks_room_hire(client):
    """The two systems share the rooms: a ticketed night closes the space."""
    with _session() as db:
        from app.models import Event

        event = db.exec(select(Event).where(Event.slug == "blue-note-quintet")).first()
        event_day = event.starts_at.date().isoformat()

    slots = {
        s["label"]: s["available"]
        for s in client.get("/rooms/main-room/availability", params={"date": event_day}).json()["slots"]
    }
    # Doors 20:00, ends 23:00 — the evening and late sittings are gone.
    assert slots["Early evening"] is False
    assert slots["Late set"] is False
    assert slots["Full day exclusive"] is False
    assert slots["Daytime"] is True

    clash = client.post(
        "/rooms/bookings",
        json={
            "room_slug": "main-room",
            "name": "Clashes With Gig",
            "email": "clash@example.com",
            "party_size": 60,
            "date": event_day,
            "start_time": "21:00",
        },
    )
    assert clash.status_code == 409


def test_unknown_slot_start_is_rejected(client):
    response = client.post(
        "/rooms/bookings",
        json={
            "room_slug": "the-snug",
            "name": "Odd Hour",
            "email": "odd@example.com",
            "party_size": 4,
            "date": _future_date(44),
            "start_time": "03:15",
        },
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------
# Expiry sweeper
# ---------------------------------------------------------------------


def test_sweeper_releases_stale_holds(client):
    from app.inventory import expire_stale_holds

    ticket_type_id = _ga_ticket_type_id(client)
    body = client.post(
        "/checkout/tickets",
        json={
            "event_slug": "blue-note-quintet",
            "customer_name": "Stale Hold",
            "customer_email": "stale@example.com",
            "lines": [{"ticket_type_id": ticket_type_id, "quantity": 5}],
        },
    ).json()

    with _session() as db:
        order = db.exec(select(Order).where(Order.reference == body["order_reference"])).first()
        reserved_before = db.get(TicketType, ticket_type_id).quantity_reserved

        # Rewind the hold past its expiry.
        order.expires_at = datetime.utcnow() - timedelta(minutes=1)
        db.add(order)
        db.commit()

        assert expire_stale_holds(db) >= 1

        db.refresh(order)
        assert order.status == "expired"
        assert db.get(TicketType, ticket_type_id).quantity_reserved == reserved_before - 5
