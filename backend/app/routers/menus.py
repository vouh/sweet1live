from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.config import settings
from app.database import get_db
from app.models import MenuItem, MenuItemPublic

router = APIRouter(prefix="/menus", tags=["menus"])

# Dishes guests can order for collection — cellar pours are dine-in only.
COLLECTION_COURSES = {"Small Plates", "Mains"}


def serialize_menu_item(item: MenuItem) -> MenuItemPublic:
    return MenuItemPublic(**item.model_dump(), currency=settings.currency)


@router.get("", response_model=list[MenuItemPublic])
def list_menu_items(
    db: Session = Depends(get_db),
    collection_only: bool = Query(default=False, description="Only items eligible for collection"),
):
    statement = (
        select(MenuItem)
        .where(MenuItem.is_active == True)  # noqa: E712
        .order_by(MenuItem.course, MenuItem.sort_order, MenuItem.name)
    )
    if collection_only:
        statement = statement.where(MenuItem.course.in_(COLLECTION_COURSES))  # type: ignore[attr-defined]

    items = db.exec(statement).all()
    return [serialize_menu_item(item) for item in items]
