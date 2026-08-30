"""Canonical permission list — synced to the DB on startup."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PermissionDef:
    id: str
    category: str
    label: str
    sort_order: int = 0


PERMISSIONS: tuple[PermissionDef, ...] = (
    PermissionDef("dashboard.view", "Dashboard", "View dashboard", 0),
    PermissionDef("reservations.view", "Reservations", "View reservations", 10),
    PermissionDef("reservations.edit", "Reservations", "Edit reservations", 11),
    PermissionDef("reservations.delete", "Reservations", "Delete reservations", 12),
    PermissionDef("events.view", "Events", "View events", 20),
    PermissionDef("events.edit", "Events", "Edit events", 21),
    PermissionDef("events.delete", "Events", "Delete events", 22),
    PermissionDef("menus.view", "Menus", "View menus", 30),
    PermissionDef("menus.edit", "Menus", "Edit menus", 31),
    PermissionDef("menus.delete", "Menus", "Delete menus", 32),
    PermissionDef("collection.view", "Collection", "View collection orders", 40),
    PermissionDef("collection.edit", "Collection", "Edit collection orders", 41),
    PermissionDef("collection.delete", "Collection", "Delete collection orders", 42),
    PermissionDef("venue_hire.view", "Venue Hire", "View venue hire", 50),
    PermissionDef("venue_hire.edit", "Venue Hire", "Edit venue hire", 51),
    PermissionDef("venue_hire.delete", "Venue Hire", "Delete venue hire", 52),
    PermissionDef("enquiries.view", "Enquiries", "View enquiries", 60),
    PermissionDef("enquiries.delete", "Enquiries", "Delete enquiries", 61),
    PermissionDef("guests.view", "Guests", "View guests", 70),
    PermissionDef("finance.view", "Finance", "View finance", 80),
    PermissionDef("finance.delete", "Finance", "Delete finance records", 81),
    PermissionDef("notifications.view", "Notifications", "View notifications", 90),
    PermissionDef("settings.manage", "Settings", "Manage roles and staff", 100),
)

SUPER_ADMIN_ROLE_NAME = "Super Admin"
