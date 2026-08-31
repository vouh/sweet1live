import secrets
import uuid
from datetime import date as date_type, datetime
from typing import Literal

from pydantic import EmailStr
from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

# Unambiguous alphabet for anything a guest may have to read aloud or type in
# (no 0/O, 1/I/L) — order references and ticket codes.
_READABLE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def _uuid() -> str:
    return uuid.uuid4().hex


def _readable_code(length: int) -> str:
    return "".join(secrets.choice(_READABLE) for _ in range(length))


def order_reference() -> str:
    return f"S1L-{_readable_code(6)}"


def ticket_code() -> str:
    # 12 chars of the readable alphabet ≈ 59 bits — not guessable at the door.
    raw = _readable_code(12)
    return f"{raw[:4]}-{raw[4:8]}-{raw[8:]}"


# ---------- Reservation ----------


class ReservationBase(SQLModel):
    name: str = Field(min_length=1, max_length=200)
    email: str
    party_size: int = Field(ge=1, le=20)
    date: date_type
    time: str = Field(min_length=1)
    notes: str | None = Field(default=None, max_length=500)


class Reservation(ReservationBase, table=True):
    __tablename__ = "reservations"

    id: str = Field(default_factory=_uuid, primary_key=True)
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReservationCreate(ReservationBase):
    email: EmailStr


class ReservationPublic(ReservationBase):
    id: str
    status: str
    created_at: datetime


# ---------- Venue enquiry ----------


class VenueEnquiryBase(SQLModel):
    name: str = Field(min_length=1, max_length=200)
    email: str
    event_type: str
    guests: int = Field(ge=1, le=300)
    date: date_type
    details: str | None = Field(default=None, max_length=1000)


class VenueEnquiry(VenueEnquiryBase, table=True):
    __tablename__ = "venue_enquiries"

    id: str = Field(default_factory=_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class VenueEnquiryCreate(VenueEnquiryBase):
    email: EmailStr
    event_type: Literal["corporate", "birthday", "private-dinner", "other"]


class VenueEnquiryPublic(VenueEnquiryBase):
    id: str
    created_at: datetime


# ---------- Guest account ----------


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=_uuid, primary_key=True)
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(unique=True, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserRegister(SQLModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(SQLModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserPublic(SQLModel):
    id: str
    name: str
    email: str
    created_at: datetime


class AuthResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ---------- Contact / conversation ----------


class ContactMessageBase(SQLModel):
    name: str = Field(min_length=1, max_length=200)
    email: str
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=2000)


class ContactMessage(ContactMessageBase, table=True):
    __tablename__ = "contact_messages"

    id: str = Field(default_factory=_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ContactMessageCreate(ContactMessageBase):
    email: EmailStr


class ContactMessagePublic(ContactMessageBase):
    id: str
    created_at: datetime


class MailingListSubscriber(SQLModel, table=True):
    __tablename__ = "mailing_list_subscribers"

    id: str = Field(default_factory=_uuid, primary_key=True)
    email: str = Field(index=True, unique=True, max_length=254)
    name: str = Field(default="Guest", max_length=200)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MailingListSubscriberPublic(SQLModel):
    id: str
    email: str
    name: str
    created_at: datetime


# =====================================================================
# Ticketing & room booking
#
# All money is stored as integer minor units (pence) in `settings.currency`.
# Never use floats for money — Stripe takes integer minor units too, so the
# value we store is the value we charge.
# =====================================================================


# ---------- Rooms ----------


class Room(SQLModel, table=True):
    """One of the seven bookable spaces in the venue."""

    __tablename__ = "rooms"

    id: str = Field(default_factory=_uuid, primary_key=True)
    slug: str = Field(unique=True, index=True)
    name: str
    tagline: str
    description: str
    capacity_seated: int
    capacity_standing: int
    min_party: int = 1
    # Headline "hire from" figure shown on the room card.
    hire_fee_pence: int = 0
    # Taken through Stripe to hold the date. 0 => enquiry-only, no card needed.
    deposit_pence: int = 0
    image_url: str = ""
    # Comma-separated feature list, e.g. "Stage,Private bar,Step-free access".
    features: str = ""
    sort_order: int = 0
    is_active: bool = True


class RoomPublic(SQLModel):
    id: str
    slug: str
    name: str
    tagline: str
    description: str
    capacity_seated: int
    capacity_standing: int
    min_party: int
    hire_fee_pence: int
    deposit_pence: int
    image_url: str
    features: list[str]
    sort_order: int


class RoomSlot(SQLModel):
    """One bookable window on a given date, with its availability resolved."""

    start_time: str
    end_time: str
    label: str
    available: bool


class RoomAvailability(SQLModel):
    room_id: str
    room_slug: str
    date: date_type
    slots: list[RoomSlot]


# ---------- Events ----------


class Event(SQLModel, table=True):
    __tablename__ = "events"

    id: str = Field(default_factory=_uuid, primary_key=True)
    slug: str = Field(unique=True, index=True)
    title: str
    subtitle: str = ""
    description: str = ""
    room_id: str = Field(foreign_key="rooms.id", index=True)
    image_url: str = ""
    doors_at: datetime | None = None
    starts_at: datetime = Field(index=True)
    ends_at: datetime | None = None
    # draft | published | cancelled
    status: str = Field(default="published", index=True)
    is_top_event: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TicketType(SQLModel, table=True):
    __tablename__ = "ticket_types"

    id: str = Field(default_factory=_uuid, primary_key=True)
    event_id: str = Field(foreign_key="events.id", index=True)
    name: str
    description: str = ""
    price_pence: int
    quantity_total: int
    # Settled sales. Incremented only when Stripe confirms payment.
    quantity_sold: int = 0
    # Seats held by in-flight checkout sessions. Released on expiry/cancel.
    quantity_reserved: int = 0
    max_per_order: int = 8
    sales_start: datetime | None = None
    sales_end: datetime | None = None
    sort_order: int = 0
    is_active: bool = True

    @property
    def quantity_available(self) -> int:
        return max(0, self.quantity_total - self.quantity_sold - self.quantity_reserved)


class TicketTypePublic(SQLModel):
    id: str
    name: str
    description: str
    price_pence: int
    max_per_order: int
    quantity_available: int
    on_sale: bool


class EventPublic(SQLModel):
    id: str
    slug: str
    title: str
    subtitle: str
    description: str
    image_url: str
    images: list[str] = []
    room_name: str
    room_slug: str
    doors_at: datetime | None
    starts_at: datetime
    ends_at: datetime | None
    status: str
    is_top_event: bool = False
    currency: str
    from_price_pence: int | None
    sold_out: bool
    ticket_types: list[TicketTypePublic]


# ---------- Orders, tickets ----------


class Order(SQLModel, table=True):
    __tablename__ = "orders"

    id: str = Field(default_factory=_uuid, primary_key=True)
    reference: str = Field(default_factory=order_reference, unique=True, index=True)
    user_id: str | None = Field(default=None, foreign_key="users.id", index=True)
    customer_name: str
    customer_email: str = Field(index=True)
    # tickets | room_deposit | food_collection
    kind: str = Field(default="tickets")
    # pending | paid | cancelled | expired | refunded
    status: str = Field(default="pending", index=True)
    subtotal_pence: int = 0
    currency: str = "gbp"
    # Original Stripe charge when it differed from `currency` (audit trail after FX normalisation).
    charged_currency: str | None = None
    charged_amount_pence: int | None = None
    event_id: str | None = Field(default=None, foreign_key="events.id", index=True)
    room_booking_id: str | None = Field(default=None, index=True)
    stripe_checkout_session_id: str | None = Field(default=None, index=True)
    stripe_payment_intent_id: str | None = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime | None = None
    paid_at: datetime | None = None


class OrderItem(SQLModel, table=True):
    __tablename__ = "order_items"

    id: str = Field(default_factory=_uuid, primary_key=True)
    order_id: str = Field(foreign_key="orders.id", index=True)
    ticket_type_id: str | None = Field(default=None, foreign_key="ticket_types.id")
    menu_item_id: str | None = Field(default=None, foreign_key="menu_items.id", index=True)
    description: str
    quantity: int
    unit_price_pence: int


class Ticket(SQLModel, table=True):
    __tablename__ = "tickets"

    id: str = Field(default_factory=_uuid, primary_key=True)
    code: str = Field(default_factory=ticket_code, unique=True, index=True)
    order_id: str = Field(foreign_key="orders.id", index=True)
    event_id: str = Field(foreign_key="events.id", index=True)
    ticket_type_id: str = Field(foreign_key="ticket_types.id", index=True)
    holder_name: str = ""
    # valid | checked_in | void
    status: str = Field(default="valid", index=True)
    checked_in_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TicketPublic(SQLModel):
    id: str
    code: str
    status: str
    holder_name: str
    ticket_type_name: str
    event_title: str
    event_slug: str
    room_name: str
    starts_at: datetime
    doors_at: datetime | None


class OrderItemPublic(SQLModel):
    description: str
    quantity: int
    unit_price_pence: int


class OrderPublic(SQLModel):
    id: str
    reference: str
    status: str
    kind: str
    customer_name: str
    customer_email: str
    subtotal_pence: int
    currency: str
    created_at: datetime
    paid_at: datetime | None
    items: list[OrderItemPublic]
    tickets: list[TicketPublic]


# ---------- Checkout request payloads ----------


class CartLine(SQLModel):
    ticket_type_id: str
    quantity: int = Field(ge=1, le=20)


class TicketCheckoutRequest(SQLModel):
    event_slug: str
    customer_name: str = Field(min_length=1, max_length=200)
    customer_email: EmailStr
    lines: list[CartLine] = Field(min_length=1)


class FoodCartLine(SQLModel):
    menu_item_id: str
    quantity: int = Field(ge=1, le=10)


class FoodCheckoutRequest(SQLModel):
    customer_name: str = Field(min_length=1, max_length=200)
    customer_email: EmailStr
    pickup_time: str = Field(min_length=1, max_length=20, description="Requested collection time, e.g. 19:30")
    lines: list[FoodCartLine] = Field(min_length=1)


class CheckoutSessionResponse(SQLModel):
    order_reference: str
    checkout_url: str | None = None
    # True when nothing was owed (free tickets, deposit-free room) and the
    # order was confirmed immediately without a trip to Stripe.
    settled_without_payment: bool = False


# ---------- Room bookings ----------


class RoomBooking(SQLModel, table=True):
    __tablename__ = "room_bookings"

    id: str = Field(default_factory=_uuid, primary_key=True)
    reference: str = Field(default_factory=order_reference, unique=True, index=True)
    room_id: str = Field(foreign_key="rooms.id", index=True)
    user_id: str | None = Field(default=None, foreign_key="users.id", index=True)
    name: str
    email: str = Field(index=True)
    phone: str = ""
    party_size: int
    date: date_type = Field(index=True)
    start_time: str
    end_time: str
    event_type: str = "other"
    notes: str | None = None
    # pending_payment | confirmed | cancelled | expired
    status: str = Field(default="pending_payment", index=True)
    deposit_pence: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime | None = None
    confirmed_at: datetime | None = None


class RoomBookingCreate(SQLModel):
    room_slug: str
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    party_size: int = Field(ge=1, le=300)
    date: date_type
    start_time: str
    notes: str | None = Field(default=None, max_length=1000)
    event_type: Literal["corporate", "birthday", "private-dinner", "performance", "other"] = "other"


class RoomBookingPublic(SQLModel):
    id: str
    reference: str
    room_id: str
    room_name: str
    room_slug: str
    name: str
    email: str
    party_size: int
    date: date_type
    start_time: str
    end_time: str
    event_type: str
    status: str
    deposit_pence: int
    currency: str
    notes: str | None
    created_at: datetime


# ---------- Menu ----------


class MenuItemBase(SQLModel):
    # "Small Plates", "Mains", "The Cellar" — the category the dish sits under.
    # Column name stays `course` (pre-dates the category-management feature);
    # the admin UI and API responses both call it "category".
    course: str = Field(max_length=80, index=True)
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=600)
    # Dietary flag shown as a chip on the public menu, e.g. "VG" / "GF".
    tag: str = Field(default="", max_length=20)
    price_pence: int = Field(default=0, ge=0)
    sort_order: int = 0
    is_active: bool = True
    images: list[str] = Field(default_factory=list)
    ingredients: str = Field(default="", max_length=1000)
    nutrition: str = Field(default="", max_length=500)


class MenuItem(MenuItemBase, table=True):
    __tablename__ = "menu_items"

    id: str = Field(default_factory=_uuid, primary_key=True)
    # Re-declared here (rather than left on MenuItemBase) so the JSON column
    # type only applies to the table model — Create/Update/Public stay plain
    # Pydantic lists.
    images: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(SQLModel):
    """Every field optional — the admin form PATCHes only what changed."""

    course: str | None = Field(default=None, max_length=80)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=600)
    tag: str | None = Field(default=None, max_length=20)
    price_pence: int | None = Field(default=None, ge=0)
    sort_order: int | None = None
    is_active: bool | None = None
    images: list[str] | None = None
    ingredients: str | None = Field(default=None, max_length=1000)
    nutrition: str | None = Field(default=None, max_length=500)


class MenuItemPublic(MenuItemBase):
    id: str
    currency: str
    created_at: datetime
    updated_at: datetime


# ---------- Menu categories ----------
# A managed list of category names, kept separate from `menu_items.course`
# (a plain string) so renaming a category updates every dish that uses it
# without needing a foreign key / migration for each rename.


class MenuCategoryBase(SQLModel):
    name: str = Field(min_length=1, max_length=80)
    sort_order: int = 0


class MenuCategory(MenuCategoryBase, table=True):
    __tablename__ = "menu_categories"

    id: str = Field(default_factory=_uuid, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MenuCategoryCreate(SQLModel):
    name: str = Field(min_length=1, max_length=80)


class MenuCategoryUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    sort_order: int | None = None


class MenuCategoryPublic(MenuCategoryBase):
    id: str
    created_at: datetime


# ---------- Stripe webhook idempotency ledger ----------


class StripeEvent(SQLModel, table=True):
    """Every Stripe event id we have already applied.

    Stripe guarantees at-least-once delivery, so the same event can arrive
    twice. Inserting the id under a primary-key constraint is what makes the
    handler idempotent.
    """

    __tablename__ = "stripe_events"

    id: str = Field(primary_key=True)
    type: str
    received_at: datetime = Field(default_factory=datetime.utcnow)


# ---------- Staff RBAC ----------


class Permission(SQLModel, table=True):
    __tablename__ = "permissions"

    id: str = Field(primary_key=True, max_length=80)
    category: str = Field(max_length=80)
    label: str = Field(max_length=120)
    sort_order: int = 0


class Role(SQLModel, table=True):
    __tablename__ = "roles"

    id: str = Field(default_factory=_uuid, primary_key=True)
    name: str = Field(unique=True, index=True, max_length=80)
    is_super_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RolePermission(SQLModel, table=True):
    __tablename__ = "role_permissions"

    role_id: str = Field(foreign_key="roles.id", primary_key=True)
    permission_id: str = Field(foreign_key="permissions.id", primary_key=True)


class StaffMember(SQLModel, table=True):
    __tablename__ = "staff_members"

    id: str = Field(default_factory=_uuid, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=254)
    name: str = Field(max_length=120)
    phone: str = Field(default="", max_length=32)
    location: str = Field(default="", max_length=120)
    job_title: str = Field(default="", max_length=80)
    notes: str = Field(default="", max_length=500)
    # Legacy local bcrypt hash — no longer used to authenticate (Supabase Auth
    # owns credentials now), kept only so existing rows don't need a backfill.
    password_hash: str
    # The account id this staff member maps to with the external auth
    # provider. Null until they complete an invite/reset — that's when the
    # provider-side account is created.
    identity_id: str | None = Field(default=None, index=True)
    # invited | active | suspended
    status: str = Field(default="active", index=True)
    must_reset_password: bool = False
    invited_by_id: str | None = Field(default=None, foreign_key="staff_members.id")
    # Who granted super-admin — that account cannot demote this person.
    promoted_by_id: str | None = Field(default=None, foreign_key="staff_members.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class StaffRoleAssignment(SQLModel, table=True):
    __tablename__ = "staff_role_assignments"

    staff_id: str = Field(foreign_key="staff_members.id", primary_key=True)
    role_id: str = Field(foreign_key="roles.id", primary_key=True)


class StaffInvite(SQLModel, table=True):
    __tablename__ = "staff_invites"

    id: str = Field(default_factory=_uuid, primary_key=True)
    staff_id: str = Field(foreign_key="staff_members.id", index=True)
    token_hash: str = Field(unique=True, index=True)
    expires_at: datetime
    used_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: str = Field(default_factory=_uuid, primary_key=True)
    actor_id: str | None = Field(default=None, index=True)
    actor_email: str = Field(default="", max_length=254, index=True)
    action: str = Field(max_length=80, index=True)
    target: str = Field(default="", max_length=300)
    detail: str = Field(default="", max_length=500)
    ip_address: str = Field(default="", max_length=64)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class AuditLogPublic(SQLModel):
    id: str
    actor_email: str
    action: str
    target: str
    detail: str
    ip_address: str
    created_at: datetime


class StaffPublic(SQLModel):
    id: str
    email: str
    name: str
    phone: str
    location: str
    job_title: str
    notes: str
    status: str
    must_reset_password: bool
    is_super_admin: bool
    roles: list[str]
    permissions: list[str]
    created_at: datetime | None = None


class StaffAuthResponse(SQLModel):
    access_token: str
    staff: StaffPublic


class StaffLogin(SQLModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)


class StaffSetPassword(SQLModel):
    token: str = Field(max_length=128)
    password: str = Field(max_length=128)


class StaffForgotPassword(SQLModel):
    email: str = Field(max_length=254)


class StaffForgotPasswordResponse(SQLModel):
    message: str


class StaffDevPrefill(SQLModel):
    email: str
    password: str


# One row per "change my password while signed in" attempt. The new password
# is hashed and stored immediately, so confirming only needs the emailed code
# — never a second copy of the password over the wire.
class StaffPasswordChangeCode(SQLModel, table=True):
    __tablename__ = "staff_password_change_codes"

    id: str = Field(default_factory=_uuid, primary_key=True)
    staff_id: str = Field(foreign_key="staff_members.id", index=True)
    code_hash: str
    # No longer written — Supabase's admin API needs the plaintext password at
    # apply time, so it's supplied again on confirm instead of stored here.
    # Column kept (rather than migrated away) since it's unused, not harmful.
    new_password_hash: str = ""
    expires_at: datetime
    used_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class StaffChangePasswordRequest(SQLModel):
    new_password: str


class StaffChangePasswordConfirm(SQLModel):
    code: str
    new_password: str


class RolePublic(SQLModel):
    id: str
    name: str
    is_super_admin: bool
    permission_ids: list[str]
    member_emails: list[str]
    created_at: datetime


class RoleCreate(SQLModel):
    name: str = Field(min_length=1, max_length=80)
    permission_ids: list[str] = Field(default_factory=list)


class RoleUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    permission_ids: list[str] | None = None
    member_emails: list[str] | None = None


class StaffCreate(SQLModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    temp_password: str = Field(min_length=1, max_length=128)
    phone: str = Field(default="", max_length=32)
    location: str = Field(default="", max_length=120)
    job_title: str = Field(default="", max_length=80)
    notes: str = Field(default="", max_length=500)
    role_ids: list[str] = Field(default_factory=list)
    grant_super_admin: bool = False
    send_invite: bool = True


class StaffBulkDelete(SQLModel):
    ids: list[str] = Field(min_length=1)


class BulkDeleteResult(SQLModel):
    deleted: int


class StaffUpdate(SQLModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    location: str | None = Field(default=None, max_length=120)
    job_title: str | None = Field(default=None, max_length=80)
    notes: str | None = Field(default=None, max_length=500)
    status: str | None = Field(default=None, max_length=20)
    role_ids: list[str] | None = None
    grant_super_admin: bool | None = None


class PermissionPublic(SQLModel):
    id: str
    category: str
    label: str
    sort_order: int
