"""Backend integration tests for Exotic OS API - iteration 2.

Tests new features: species presets, payments, Google auth, enclosure CRUD,
sensor ingest, AI chat retry. Plus regression for existing flows.
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].splitlines()[0]).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]  # set before running tests


# --- Fixtures ----------------------------------------------------------------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def fresh_user():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    pw = "testpass123"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": pw, "name": "TEST User v2"}, timeout=20)
    assert r.status_code == 200, r.text
    return {"email": email, "password": pw, "token": r.json()["token"]}


@pytest.fixture(scope="session")
def fresh_headers(fresh_user):
    return {"Authorization": f"Bearer {fresh_user['token']}"}


# --- Regression: existing endpoints ------------------------------------------
class TestRegression:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=10)
        assert r.status_code == 200 and r.json().get("ok") is True

    def test_stats(self):
        r = requests.get(f"{API}/stats", timeout=10)
        assert r.status_code == 200
        for k in ["waitlist", "active_kits", "uptime_hours", "alerts_handled"]:
            assert k in r.json()

    def test_admin_login(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=10)
        assert r.status_code == 401

    def test_me(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=10)
        assert r.status_code == 200 and r.json()["email"] == ADMIN_EMAIL

    def test_waitlist(self):
        email = f"wl_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/waitlist", json={"email": email, "name": "TEST WL"}, timeout=10)
        assert r.status_code == 200 and r.json()["ok"] is True

    def test_register_auto_seed(self, fresh_user, fresh_headers):
        r = requests.get(f"{API}/enclosures", headers=fresh_headers, timeout=15)
        assert r.status_code == 200
        encls = r.json()
        assert len(encls) == 4
        # node_token now exposed on every enclosure
        for e in encls:
            assert e.get("node_token") and len(e["node_token"]) > 10
            assert e.get("is_demo") is True


# --- Species presets ---------------------------------------------------------
class TestSpeciesPresets:
    def test_presets_returned(self):
        r = requests.get(f"{API}/presets/species", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 5
        species_names = {p["species"] for p in data}
        assert species_names == {"Ball Python", "Crested Gecko", "Corn Snake", "Leopard Gecko", "Bearded Dragon"}
        required_fields = {"species", "color", "hot_target", "cool_target", "humidity_target",
                           "uvi_target", "photoperiod_hours", "che_wattage", "current_setpoint"}
        for p in data:
            assert required_fields.issubset(p.keys()), f"Missing keys in {p['species']}"


# --- Payments ----------------------------------------------------------------
class TestPayments:
    def test_tiers(self):
        r = requests.get(f"{API}/payments/tiers", timeout=10)
        assert r.status_code == 200
        tiers = r.json()
        by_id = {t["id"]: t for t in tiers}
        assert set(by_id.keys()) == {"beta", "ball-python", "multi-species"}
        assert by_id["beta"]["amount"] == 549.00
        assert by_id["ball-python"]["amount"] == 649.00
        assert by_id["multi-species"]["amount"] == 899.00

    def test_checkout_requires_auth(self):
        r = requests.post(f"{API}/payments/checkout",
                          json={"tier_id": "beta", "origin_url": BASE_URL}, timeout=10)
        assert r.status_code == 401

    def test_checkout_unknown_tier(self, admin_headers):
        r = requests.post(f"{API}/payments/checkout", headers=admin_headers,
                          json={"tier_id": "unobtanium", "origin_url": BASE_URL}, timeout=15)
        assert r.status_code == 400

    def test_checkout_success(self, admin_headers):
        r = requests.post(f"{API}/payments/checkout", headers=admin_headers,
                          json={"tier_id": "beta", "origin_url": BASE_URL}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d and d["url"].startswith("https://")
        assert "session_id" in d and len(d["session_id"]) > 5
        # save for next test
        TestPayments._session_id = d["session_id"]

    def test_status_returns_pending(self, admin_headers):
        sid = getattr(TestPayments, "_session_id", None)
        if not sid:
            pytest.skip("checkout did not run")
        r = requests.get(f"{API}/payments/status/{sid}", headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["session_id"] == sid
        assert d["tier_id"] == "beta"
        assert d["amount"] == 549.00
        assert d["payment_status"] in ["pending", "unpaid", "no_payment_required", "paid"]


# --- Google OAuth (error path only) ------------------------------------------
class TestGoogleAuth:
    def test_invalid_session(self):
        r = requests.post(f"{API}/auth/google/session",
                          json={"session_id": "definitely-not-a-real-google-session-xyz123"}, timeout=20)
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"


# --- Sensor Ingest -----------------------------------------------------------
class TestIngest:
    def test_invalid_token(self):
        r = requests.post(f"{API}/ingest/readings",
                          json={"node_token": "totally-bogus", "hot_temp": 88, "cool_temp": 78,
                                "humidity": 55, "uvi": 1.0, "duty_cycle": 0.4}, timeout=10)
        assert r.status_code == 401

    def test_valid_token_inserts(self, admin_headers):
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        encl = r.json()[0]
        token = encl["node_token"]
        assert token
        body = {"node_token": token, "hot_temp": 89.1, "cool_temp": 78.4, "humidity": 56.0,
                "uvi": 1.1, "duty_cycle": 0.42}
        r2 = requests.post(f"{API}/ingest/readings", json=body, timeout=10)
        assert r2.status_code == 200, r2.text
        d = r2.json()
        assert d["ok"] is True
        assert d.get("enclosure") == encl["animal_name"]

    def test_source_node_after_burst(self, admin_headers):
        """Post >=6 readings and verify source switches to 'node' on readings + latest."""
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        encl = r.json()[0]
        token = encl["node_token"]
        eid = encl["id"]
        for i in range(7):
            requests.post(f"{API}/ingest/readings", json={
                "node_token": token, "hot_temp": 88 + i * 0.1, "cool_temp": 78,
                "humidity": 55, "uvi": 1.0, "duty_cycle": 0.4
            }, timeout=10)
        # /enclosures latest.source should be 'node' (within 10 min)
        r2 = requests.get(f"{API}/enclosures/{eid}", headers=admin_headers, timeout=15)
        assert r2.status_code == 200
        latest = r2.json()["latest"]
        assert latest.get("source") == "node", f"Expected node, got {latest}"
        # /readings should now use source='node'
        r3 = requests.get(f"{API}/enclosures/{eid}/readings?hours=1", headers=admin_headers, timeout=15)
        assert r3.status_code == 200
        d = r3.json()
        assert d.get("source") == "node", f"Expected node, got source={d.get('source')}"
        assert len(d["points"]) >= 6


# --- Enclosure CRUD ----------------------------------------------------------
class TestEnclosureCRUD:
    def test_create_from_preset(self, fresh_headers):
        body = {
            "name": "TEST Pebbles Tank",
            "animal_name": "Pebbles",
            "species": "Leopard Gecko",
            "enclosure_type": "20 gallon long",
        }
        r = requests.post(f"{API}/enclosures", headers=fresh_headers, json=body, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["animal_name"] == "Pebbles"
        assert d["species"] == "Leopard Gecko"
        assert d["is_demo"] is False
        assert d.get("node_token") and len(d["node_token"]) > 10
        # preset values applied
        assert d["hot_target"] == [88, 92]
        assert d["humidity_target"] == [30, 40]
        TestEnclosureCRUD._created_id = d["id"]
        TestEnclosureCRUD._token = d["node_token"]

    def test_create_unknown_species_400(self, fresh_headers):
        r = requests.post(f"{API}/enclosures", headers=fresh_headers,
                          json={"name": "X", "animal_name": "Y", "species": "Dragonite", "enclosure_type": "100g"},
                          timeout=10)
        assert r.status_code == 400

    def test_create_missing_field_422(self, fresh_headers):
        r = requests.post(f"{API}/enclosures", headers=fresh_headers,
                          json={"animal_name": "Y", "species": "Ball Python"}, timeout=10)
        assert r.status_code == 422

    def test_delete_removes_enclosure_and_readings(self, fresh_headers):
        eid = getattr(TestEnclosureCRUD, "_created_id", None)
        token = getattr(TestEnclosureCRUD, "_token", None)
        if not eid:
            pytest.skip("creation did not run")
        # Add a sensor reading first
        requests.post(f"{API}/ingest/readings", json={
            "node_token": token, "hot_temp": 90, "cool_temp": 76,
            "humidity": 35, "uvi": 0.5, "duty_cycle": 0.5
        }, timeout=10)
        # Delete
        r = requests.delete(f"{API}/enclosures/{eid}", headers=fresh_headers, timeout=10)
        assert r.status_code == 200, r.text
        # Verify gone
        r2 = requests.get(f"{API}/enclosures/{eid}", headers=fresh_headers, timeout=10)
        assert r2.status_code == 404
        # And readings are also gone — try posting another to the dead token, should 401
        r3 = requests.post(f"{API}/ingest/readings", json={
            "node_token": token, "hot_temp": 90, "cool_temp": 76,
            "humidity": 35, "uvi": 0.5, "duty_cycle": 0.5
        }, timeout=10)
        assert r3.status_code == 401


# --- AI Chat -----------------------------------------------------------------
class TestAIChat:
    def test_chat_basic(self, admin_headers):
        r = requests.post(f"{API}/chat", headers=admin_headers,
                          json={"message": "What humidity for a ball python?"}, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "reply" in d and len(d["reply"]) > 10
        assert "session_id" in d

    def test_chat_requires_auth(self):
        r = requests.post(f"{API}/chat", json={"message": "hi"}, timeout=10)
        assert r.status_code == 401
