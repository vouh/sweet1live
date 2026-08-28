"""Seed the venue's seven rooms and a sample season of ticketed nights.

Idempotent — matches on slug, so re-running updates the catalogue rather than
duplicating it. Run with:

    python -m app.seed
"""

from datetime import datetime, timedelta

from sqlmodel import Session, SQLModel, select

from app.database import engine
from app.models import Event, MenuItem, Room, TicketType

# Venue photos live in public/images/ and are mapped on the frontend — not in the DB.

# The seven bookable spaces. hire_fee_pence is the "from" figure on the card;
# deposit_pence is what Stripe actually charges to hold the date.
ROOMS: list[dict] = [
    {
        "slug": "main-room",
        "name": "The Main Room",
        "tagline": "Stage, brass, and 250 people who came to listen",
        "description": (
            "The heart of the venue. A raked floor facing a full stage, house PA and lighting rig, "
            "and a bar that runs the length of the back wall. Built for headline sets and full takeovers."
        ),
        "capacity_seated": 160,
        "capacity_standing": 250,
        "min_party": 40,
        "hire_fee_pence": 250000,
        "deposit_pence": 50000,
        "features": "Full stage,House PA & lighting,Green room,Private bar,Step-free access",
        "sort_order": 1,
    },
    {
        "slug": "the-lounge",
        "name": "The Lounge",
        "tagline": "Low light, deep booths, and a late licence",
        "description": (
            "Velvet booths around a small corner stage. The room the soul and R&B sets were written "
            "for — close enough to hear the room breathe between songs."
        ),
        "capacity_seated": 60,
        "capacity_standing": 80,
        "min_party": 20,
        "hire_fee_pence": 120000,
        "deposit_pence": 25000,
        "features": "Corner stage,Booth seating,Dedicated host,Cocktail menu,Late licence",
        "sort_order": 2,
    },
    {
        "slug": "the-cellar",
        "name": "The Cellar",
        "tagline": "Brick, candlelight, and nothing amplified",
        "description": (
            "A vaulted brick cellar under the main floor. Acoustic sets, tastings, and listening "
            "sessions — no PA, no phones, and a bottle list that rewards a long evening."
        ),
        "capacity_seated": 45,
        "capacity_standing": 60,
        "min_party": 12,
        "hire_fee_pence": 90000,
        "deposit_pence": 20000,
        "features": "Acoustic room,Tasting table,Sommelier service,Candlelit,Private entrance",
        "sort_order": 3,
    },
    {
        "slug": "the-alcove",
        "name": "The Alcove",
        "tagline": "Secluded dining for the table that matters",
        "description": (
            "A curtained dining room off the main floor. Tasting menus, milestone toasts, and "
            "conversations that deserve a door — with the music still just audible."
        ),
        "capacity_seated": 24,
        "capacity_standing": 30,
        "min_party": 8,
        "hire_fee_pence": 60000,
        "deposit_pence": 15000,
        "features": "Private dining,Tasting menu,Curtained entry,Dedicated server",
        "sort_order": 4,
    },
    {
        "slug": "the-snug",
        "name": "The Snug",
        "tagline": "Eight seats, one fire, no agenda",
        "description": (
            "The smallest room we hire. A fireplace, eight armchairs, and a hatch to the bar — "
            "for small celebrations and the kind of meeting that should not happen in an office."
        ),
        "capacity_seated": 8,
        "capacity_standing": 12,
        "min_party": 2,
        "hire_fee_pence": 20000,
        "deposit_pence": 5000,
        "features": "Fireplace,Bar hatch,Armchair seating,Board-friendly",
        "sort_order": 5,
    },
    {
        "slug": "the-gallery",
        "name": "The Gallery",
        "tagline": "The mezzanine — the room above the room",
        "description": (
            "A balcony running the width of the main floor, with its own service bar. Keeps your "
            "party together and the stage in view without buying out the whole venue."
        ),
        "capacity_seated": 40,
        "capacity_standing": 70,
        "min_party": 15,
        "hire_fee_pence": 80000,
        "deposit_pence": 20000,
        "features": "Stage view,Service bar,Semi-private,Reserved entry",
        "sort_order": 6,
    },
    {
        "slug": "private-dining",
        "name": "The Private Dining Room",
        "tagline": "One long table, one kitchen, one evening",
        "description": (
            "A single 30-seat table with a pass straight through to the kitchen. Bespoke menus "
            "written with the chef, AV for speeches, and a room that stays yours until close."
        ),
        "capacity_seated": 30,
        "capacity_standing": 45,
        "min_party": 10,
        "hire_fee_pence": 110000,
        "deposit_pence": 25000,
        "features": "Chef's table,Bespoke menu,AV for speeches,Private cloakroom,Step-free access",
        "sort_order": 7,
    },
]


# The card as it reads on the public menus page. Prices in pence, like
# everything else that touches money.
MENU_ITEMS: list[dict] = [
    {
        "course": "Small Plates",
        "name": "Truffle Arancini",
        "tag": "VG",
        "description": (
            "Crispy wild mushroom risotto balls with a molten mozzarella centre, "
            "over black truffle aioli."
        ),
        "price_pence": 1400,
        "sort_order": 1,
    },
    {
        "course": "Small Plates",
        "name": "Scallop Crudo",
        "tag": "GF",
        "description": "Hand-dived scallops, dressed with yuzu kosho, finger lime, and estate olive oil.",
        "price_pence": 1800,
        "sort_order": 2,
    },
    {
        "course": "Small Plates",
        "name": "Charred Octopus",
        "tag": "GF",
        "description": "Slow-braised then wood-fired octopus, smoked paprika potato purée, caper salsa verde.",
        "price_pence": 2200,
        "sort_order": 3,
    },
    {
        "course": "Mains",
        "name": "Miso Black Cod",
        "description": (
            "Sustainably sourced black cod in sweet Saikyo miso, roasted until caramelised, "
            "with pickled ginger shoot."
        ),
        "price_pence": 4200,
        "sort_order": 1,
    },
    {
        "course": "Mains",
        "name": "Dry-Aged Ribeye",
        "tag": "GF",
        "description": "35-day dry-aged British ribeye, charcoal grilled, bone marrow butter and watercress. 300g.",
        "price_pence": 5500,
        "sort_order": 2,
    },
    {
        "course": "Mains",
        "name": "Black Truffle Tagliatelle",
        "tag": "VG",
        "description": "Hand-rolled pasta folded through aged parmesan cream, finished with shaved winter truffle.",
        "price_pence": 2800,
        "sort_order": 3,
    },
    {
        "course": "The Cellar",
        "name": "Château Margaux 2015",
        "description": "Bordeaux, France. Cassis, violet, and a long graphite finish.",
        "price_pence": 24000,
        "sort_order": 1,
    },
    {
        "course": "The Cellar",
        "name": "Midnight Velvet",
        "description": "Premium vodka, fresh espresso, dark chocolate, silky foam top. Our signature pour.",
        "price_pence": 1600,
        "sort_order": 2,
    },
    {
        "course": "The Cellar",
        "name": "Blanc de Blancs",
        "description": "Grower champagne — brioche, white peach, a fine persistent bead.",
        "price_pence": 9500,
        "sort_order": 3,
    },
]


def _next_weekday(base: datetime, weekday: int, weeks_ahead: int = 0) -> datetime:
    """The next given weekday (0=Mon) at or after `base`, plus whole weeks."""
    days = (weekday - base.weekday()) % 7
    return (base + timedelta(days=days, weeks=weeks_ahead)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )


def _at(day: datetime, hour: int, minute: int = 0) -> datetime:
    return day.replace(hour=hour, minute=minute)


def seed(session: Session) -> None:
    rooms: dict[str, Room] = {}

    for spec in ROOMS:
        room = session.exec(select(Room).where(Room.slug == spec["slug"])).first()
        if room is None:
            room = Room(**spec)
        else:
            for key, value in spec.items():
                setattr(room, key, value)
        room.image_url = ""
        session.add(room)
        rooms[spec["slug"]] = room

    session.commit()
    for room in rooms.values():
        session.refresh(room)

    today = datetime.utcnow()
    friday = _next_weekday(today, 4)
    saturday = _next_weekday(today, 5)

    events: list[dict] = [
        {
            "slug": "blue-note-quintet",
            "title": "Blue Note Quintet",
            "subtitle": "Modal jazz · Hard bop",
            "description": (
                "Modal jazz and hard bop from leading session musicians. Doors at 20:00, first set "
                "at 20:30 — intimate, precise, and gone before you want it to be."
            ),
            "room": "main-room",
            "doors_at": _at(friday, 20, 0),
            "starts_at": _at(friday, 20, 30),
            "ends_at": _at(friday, 23, 0),
            "tickets": [
                {"name": "General admission", "price_pence": 2500, "quantity_total": 180, "sort_order": 1,
                 "description": "Standing, main floor."},
                {"name": "Reserved table", "price_pence": 4500, "quantity_total": 40, "max_per_order": 6,
                 "sort_order": 2, "description": "Seated table for the full evening, front of house."},
            ],
        },
        {
            "slug": "velvet-sessions",
            "title": "Velvet Sessions",
            "subtitle": "Soul · R&B",
            "description": (
                "Reimagined soul and R&B at a slower tempo, played to a room lit for lingering. "
                "The perfect companion to a late dinner and a second bottle."
            ),
            "room": "the-lounge",
            "doors_at": _at(saturday, 20, 30),
            "starts_at": _at(saturday, 21, 0),
            "ends_at": _at(saturday, 23, 30),
            "tickets": [
                {"name": "Lounge entry", "price_pence": 3500, "quantity_total": 60, "sort_order": 1,
                 "description": "Entry with standing room at the bar."},
                {"name": "Booth for four", "price_pence": 18000, "quantity_total": 8, "max_per_order": 2,
                 "sort_order": 2, "description": "A reserved booth seating four, with bottle service."},
            ],
        },
        {
            "slug": "cellar-sessions",
            "title": "Cellar Sessions",
            "subtitle": "Acoustic · Tasting",
            "description": (
                "Unamplified acoustic sets in the brick cellar, paired with a four-glass flight "
                "chosen by our sommelier. Forty-five seats, no phones."
            ),
            "room": "the-cellar",
            "doors_at": _at(friday + timedelta(weeks=1), 21, 0),
            "starts_at": _at(friday + timedelta(weeks=1), 21, 30),
            "ends_at": _at(friday + timedelta(weeks=1), 23, 30),
            "tickets": [
                {"name": "Seat & flight", "price_pence": 3000, "quantity_total": 45, "max_per_order": 4,
                 "sort_order": 1, "description": "Reserved seat with a four-glass tasting flight."},
            ],
        },
        {
            "slug": "last-orders-trio",
            "title": "The Last Orders Trio",
            "subtitle": "Standards",
            "description": "Standards until close — brass, brushes, and nowhere else to be.",
            "room": "main-room",
            "doors_at": _at(friday + timedelta(weeks=2), 21, 30),
            "starts_at": _at(friday + timedelta(weeks=2), 22, 0),
            "ends_at": _at(friday + timedelta(weeks=2), 0, 30) + timedelta(days=1),
            "tickets": [
                {"name": "Late set", "price_pence": 2500, "quantity_total": 200, "sort_order": 1,
                 "description": "Standing, late licence."},
            ],
        },
    ]

    for spec in events:
        ticket_specs = spec.pop("tickets")
        room_slug = spec.pop("room")

        event = session.exec(select(Event).where(Event.slug == spec["slug"])).first()
        if event is None:
            event = Event(**spec, room_id=rooms[room_slug].id)
        else:
            for key, value in spec.items():
                setattr(event, key, value)
            event.room_id = rooms[room_slug].id
        event.image_url = ""
        session.add(event)
        session.commit()
        session.refresh(event)

        for ticket_spec in ticket_specs:
            existing = session.exec(
                select(TicketType).where(
                    TicketType.event_id == event.id, TicketType.name == ticket_spec["name"]
                )
            ).first()
            if existing is None:
                session.add(TicketType(**ticket_spec, event_id=event.id))
            else:
                # Never rewrite sold/reserved counts — only the catalogue fields.
                for key, value in ticket_spec.items():
                    setattr(existing, key, value)
                session.add(existing)

    # Menu items are staff-editable in the admin, so seed inserts only — never
    # overwrite a dish somebody has since reworded or repriced.
    for spec in MENU_ITEMS:
        existing_item = session.exec(
            select(MenuItem).where(
                MenuItem.course == spec["course"], MenuItem.name == spec["name"]
            )
        ).first()
        if existing_item is None:
            session.add(MenuItem(**spec))

    session.commit()


def main() -> None:
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed(session)
    print(
        f"Seeded {len(ROOMS)} rooms, the sample event season, "
        f"and {len(MENU_ITEMS)} menu items."
    )


if __name__ == "__main__":
    main()
