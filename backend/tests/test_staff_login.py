"""Staff login must use the provider and never expose bootstrap credentials."""
import os
import sys
from pathlib import Path
from unittest.mock import Mock

os.environ.setdefault("ALLOW_SQLITE_TESTS", "1")
os.environ.setdefault("DATABASE_URL", "sqlite://")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.database import get_db
from app.models import StaffMember
from app.routers import staff_auth


@pytest.fixture
def client(monkeypatch):
    staff = StaffMember(email="admin@example.com", name="Admin", password_hash="unused", identity_id="provider-id", status="active", must_reset_password=False)
    db = Mock()
    db.exec.return_value.first.return_value = staff
    app = FastAPI()
    app.include_router(staff_auth.router)
    app.dependency_overrides[get_db] = lambda: db
    from app.rate_limit import clear_rate_limits
    clear_rate_limits()
    monkeypatch.setattr(staff_auth, "record_audit", lambda *a, **k: None)
    monkeypatch.setattr(staff_auth, "staff_roles", lambda *a: [])
    monkeypatch.setattr(staff_auth, "staff_permissions", lambda *a: set())
    monkeypatch.setattr(staff_auth, "staff_is_super_admin", lambda *a: True)
    return TestClient(app)


def test_prefill_removed(client):
    assert client.get("/auth/staff/dev-prefill").status_code == 404


def test_provider_login(client, monkeypatch):
    provider = Mock(return_value=("provider-token", "provider-id"))
    monkeypatch.setattr(staff_auth, "sign_in_with_password", provider)
    response = client.post("/auth/staff/login", json={"email": "admin@example.com", "password": "TestPassword7+"})
    assert response.status_code == 200
    assert response.json()["access_token"] == "provider-token"
    assert response.json()["staff"]["is_super_admin"] is True
    provider.assert_called_once_with("admin@example.com", "TestPassword7+")


def test_wrong_provider_identity_rejected(client, monkeypatch):
    monkeypatch.setattr(staff_auth, "sign_in_with_password", lambda *a: ("token", "other-id"))
    response = client.post("/auth/staff/login", json={"email": "admin@example.com", "password": "TestPassword7+"})
    assert response.status_code == 401
