"""Backend integration tests for Exotic OS API."""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://design-showcase-1016.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]  # set before running tests


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    assert data["user"]["email"] == ADMIN_EMAIL
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def new_user():
    """Register a fresh user; returns dict with email, password, token."""
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = os.environ.get("TEST_USER_PASSWORD", "change-me-123")
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": password, "name": "TEST User"}, timeout=20)
    assert r.status_code == 200, f"Register failed: {r.text}"
    data = r.json()
    return {"email": email, "password": password, "token": data["token"], "user": data["user"]}


# --- Health & public stats ----------------------------------------------------
class TestHealthAndStats:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=10)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_stats(self):
        r = requests.get(f"{API}/stats", timeout=10)
        assert r.status_code == 200
        d = r.json()
        for k in ["waitlist", "active_kits", "uptime_hours", "alerts_handled"]:
            assert k in d
        assert isinstance(d["waitlist"], int)


# --- Waitlist ------------------------------------------------------------------
class TestWaitlist:
    def test_join_waitlist(self):
        email = f"wl_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/waitlist", json={"email": email, "name": "TEST WL", "reptile_type": "ball_python"}, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["ok"] is True
        assert "position" in d

    def test_waitlist_duplicate_upserts(self):
        email = f"wl_dup_{uuid.uuid4().hex[:8]}@example.com"
        r1 = requests.post(f"{API}/waitlist", json={"email": email, "name": "TEST Dup"}, timeout=10)
        r2 = requests.post(f"{API}/waitlist", json={"email": email, "name": "TEST Dup2"}, timeout=10)
        assert r1.status_code == 200
        assert r2.status_code == 200

    def test_waitlist_invalid_email(self):
        r = requests.post(f"{API}/waitlist", json={"email": "not-an-email", "name": "X"}, timeout=10)
        assert r.status_code == 422


# --- Auth ----------------------------------------------------------------------
class TestAuth:
    def test_admin_login(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=10)
        assert r.status_code == 401

    def test_me(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert d["role"] == "admin"

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code == 401

    def test_register_and_auto_seed(self, new_user):
        token = new_user["token"]
        # confirm auto-seed of 4 enclosures
        r = requests.get(f"{API}/enclosures", headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r.status_code == 200
        encls = r.json()
        assert len(encls) == 4
        slugs = {e["slug"] for e in encls}
        assert slugs == {"cora", "sonic", "motley", "confused-spider"}

    def test_register_duplicate(self, new_user):
        r = requests.post(f"{API}/auth/register", json={"email": new_user["email"], "password": "abc123", "name": "Dup"}, timeout=10)
        assert r.status_code == 400


# --- Enclosures ----------------------------------------------------------------
class TestEnclosures:
    def test_list_enclosures(self, admin_headers):
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert len(d) == 4
        for e in d:
            assert "id" in e and "latest" in e and "status" in e
            for k in ["hot_temp", "cool_temp", "humidity", "uvi", "duty_cycle"]:
                assert k in e["latest"]

    def test_list_requires_auth(self):
        r = requests.get(f"{API}/enclosures", timeout=10)
        assert r.status_code == 401

    def test_get_single_enclosure(self, admin_headers):
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        eid = r.json()[0]["id"]
        r2 = requests.get(f"{API}/enclosures/{eid}", headers=admin_headers, timeout=10)
        assert r2.status_code == 200
        assert r2.json()["id"] == eid

    def test_readings_24h(self, admin_headers):
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        eid = r.json()[0]["id"]
        r2 = requests.get(f"{API}/enclosures/{eid}/readings?hours=24", headers=admin_headers, timeout=15)
        assert r2.status_code == 200
        d = r2.json()
        assert d["enclosure_id"] == eid
        assert len(d["points"]) > 20
        p0 = d["points"][0]
        for k in ["ts", "hot_temp", "cool_temp", "humidity", "uvi"]:
            assert k in p0

    def test_alerts(self, admin_headers):
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        eid = r.json()[0]["id"]
        r2 = requests.get(f"{API}/enclosures/{eid}/alerts", headers=admin_headers, timeout=10)
        assert r2.status_code == 200
        assert isinstance(r2.json(), list)

    def test_control_setpoint_persists(self, admin_headers):
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        encls = r.json()
        e = encls[0]
        eid = e["id"]
        new_sp = (e["current_setpoint"] or 80) + 1
        # Clamp to allowed range
        if new_sp > 100:
            new_sp = 99
        r2 = requests.post(f"{API}/enclosures/{eid}/control", headers=admin_headers, json={"setpoint": new_sp}, timeout=10)
        assert r2.status_code == 200
        assert r2.json()["current_setpoint"] == new_sp
        # verify persisted
        r3 = requests.get(f"{API}/enclosures/{eid}", headers=admin_headers, timeout=10)
        assert r3.json()["current_setpoint"] == new_sp

    def test_control_clamps_setpoint(self, admin_headers):
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        eid = r.json()[0]["id"]
        r2 = requests.post(f"{API}/enclosures/{eid}/control", headers=admin_headers, json={"setpoint": 250}, timeout=10)
        assert r2.status_code == 200
        assert r2.json()["current_setpoint"] == 100

    def test_invalid_enclosure_id(self, admin_headers):
        # Non-existent valid ObjectId
        r = requests.get(f"{API}/enclosures/507f1f77bcf86cd799439011", headers=admin_headers, timeout=10)
        assert r.status_code == 404


# --- AI Chat -------------------------------------------------------------------
class TestAIChat:
    def test_chat_requires_auth(self):
        r = requests.post(f"{API}/chat", json={"message": "hi"}, timeout=10)
        assert r.status_code == 401

    def test_chat_basic(self, admin_headers):
        r = requests.post(f"{API}/chat", headers=admin_headers, json={"message": "What humidity should a ball python be kept at?"}, timeout=60)
        assert r.status_code == 200, f"Chat failed: {r.text}"
        d = r.json()
        assert "reply" in d and isinstance(d["reply"], str) and len(d["reply"]) > 10
        assert "session_id" in d

    def test_chat_with_enclosure_context(self, admin_headers):
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        eid = r.json()[0]["id"]
        r2 = requests.post(f"{API}/chat", headers=admin_headers,
                           json={"message": "How is this enclosure trending?", "enclosure_id": eid}, timeout=60)
        assert r2.status_code == 200, f"Chat ctx failed: {r2.text}"
        assert len(r2.json()["reply"]) > 10
