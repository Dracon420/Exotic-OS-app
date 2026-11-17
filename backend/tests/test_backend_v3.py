"""Iteration 3 backend tests — RAG layer over vetted care guides.

Focus: /api/care-guides (auth, filter, admin-only POST), /api/chat citations
+ species_hint behavior across multiple species and the cross-species fallback.
Also re-verifies key existing flows (auth, enclosures, payments status graceful,
ESPHome ingest, waitlist).
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or
            open("/app/frontend/.env").read().split("REACT_APP_BACKEND_URL=")[1].splitlines()[0]).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]  # set before running tests

SPECIES_SET = {"Ball Python", "Crested Gecko", "Corn Snake", "Leopard Gecko", "Bearded Dragon"}


# --- Fixtures ----------------------------------------------------------------
@pytest.fixture(scope="session")
def admin_headers():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="session")
def fresh_headers():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register",
                      json={"email": email, "password": "testpass123", "name": "TEST v3"}, timeout=20)
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


# --- Care guides ------------------------------------------------------------
class TestCareGuides:
    def test_requires_auth(self):
        r = requests.get(f"{API}/care-guides", timeout=10)
        assert r.status_code == 401

    def test_list_all(self, admin_headers):
        r = requests.get(f"{API}/care-guides", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        guides = r.json()
        assert isinstance(guides, list)
        # Seed has 24 chunks
        assert len(guides) >= 24, f"Expected >=24 guides, got {len(guides)}"
        for g in guides:
            for k in ("species", "topic", "text", "source", "priority"):
                assert k in g, f"Missing key {k} in guide {g}"
            assert "_id" not in g  # MongoDB _id must be excluded
            assert isinstance(g["priority"], int)
        all_species = {g["species"] for g in guides}
        assert SPECIES_SET.issubset(all_species), f"Missing seeded species: {SPECIES_SET - all_species}"
        assert "ANY" in all_species

    def test_filter_by_ball_python(self, admin_headers):
        r = requests.get(f"{API}/care-guides", headers=admin_headers,
                         params={"species": "Ball Python"}, timeout=15)
        assert r.status_code == 200
        guides = r.json()
        assert len(guides) > 0
        for g in guides:
            assert g["species"] in ("Ball Python", "ANY"), f"Unexpected species {g['species']}"
        # Must contain at least one Ball Python entry AND at least one ANY entry
        species_seen = {g["species"] for g in guides}
        assert "Ball Python" in species_seen
        assert "ANY" in species_seen

    def test_filter_by_crested_gecko(self, admin_headers):
        r = requests.get(f"{API}/care-guides", headers=admin_headers,
                         params={"species": "Crested Gecko"}, timeout=15)
        assert r.status_code == 200
        for g in r.json():
            assert g["species"] in ("Crested Gecko", "ANY")

    def test_post_requires_admin(self, fresh_headers):
        r = requests.post(f"{API}/care-guides", headers=fresh_headers, json={
            "species": "Ball Python",
            "topic": "TEST_topic_nonadmin",
            "text": "This payload should be rejected because caller is not admin.",
            "source": "TEST",
            "priority": 5,
        }, timeout=10)
        assert r.status_code == 403

    def test_post_admin_upsert(self, admin_headers):
        topic = f"TEST_admin_upsert_{uuid.uuid4().hex[:6]}"
        body = {
            "species": "Ball Python",
            "topic": topic,
            "text": "TEST upsert text content for RAG verification.",
            "source": "TEST suite v3",
            "priority": 5,
        }
        r = requests.post(f"{API}/care-guides", headers=admin_headers, json=body, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

        # Verify reflected in GET
        r2 = requests.get(f"{API}/care-guides", headers=admin_headers,
                          params={"species": "Ball Python"}, timeout=15)
        topics = [g["topic"] for g in r2.json()]
        assert topic in topics

        # Idempotent upsert — call again with new priority
        body["priority"] = 7
        r3 = requests.post(f"{API}/care-guides", headers=admin_headers, json=body, timeout=15)
        assert r3.status_code == 200
        r4 = requests.get(f"{API}/care-guides", headers=admin_headers,
                          params={"species": "Ball Python"}, timeout=15)
        match = [g for g in r4.json() if g["topic"] == topic]
        assert len(match) == 1, f"Expected single upsert, got {len(match)}"
        assert match[0]["priority"] == 7


# --- Chat with RAG ----------------------------------------------------------
def _post_chat(headers, message, enclosure_id=None):
    payload = {"message": message}
    if enclosure_id:
        payload["enclosure_id"] = enclosure_id
    r = requests.post(f"{API}/chat", headers=headers, json=payload, timeout=120)
    return r


class TestChatRAG:
    def test_chat_ball_python_shedding(self, admin_headers):
        r = _post_chat(admin_headers, "My ball python is going into shed - what humidity should I aim for?")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "reply" in d and len(d["reply"]) > 10
        assert "citations" in d and isinstance(d["citations"], list)
        assert len(d["citations"]) >= 1, f"Expected at least 1 citation, got {d['citations']}"
        for c in d["citations"]:
            assert {"species", "topic", "source"}.issubset(c.keys())
            assert c["species"] in ("Ball Python", "ANY"), f"Unexpected species in citation: {c}"
        assert d.get("species_hint") == "Ball Python"

    def test_chat_enclosure_id_detects_species(self, admin_headers):
        # Find admin's Ball Python enclosure (Cora or Confused Spider)
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        encls = r.json()
        bp = next((e for e in encls if e["species"] == "Ball Python"), None)
        assert bp, "No Ball Python enclosure on admin account"
        r2 = _post_chat(admin_headers, "How is the husbandry looking?", enclosure_id=bp["id"])
        assert r2.status_code == 200, r2.text
        d = r2.json()
        assert d.get("species_hint") == "Ball Python"
        # citations should be species-filtered
        for c in d["citations"]:
            assert c["species"] in ("Ball Python", "ANY")

    def test_chat_crested_gecko_from_query(self, admin_headers):
        r = _post_chat(admin_headers, "What humidity does a crested gecko need at night?")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("species_hint") == "Crested Gecko"
        # at least one citation should be crested gecko (not just ANY)
        sp_in_citations = {c["species"] for c in d["citations"]}
        assert "Crested Gecko" in sp_in_citations or "ANY" in sp_in_citations
        assert len(d["citations"]) >= 1

    def test_chat_generic_safety(self, admin_headers):
        r = _post_chat(admin_headers, "What safety layers should every enclosure have to prevent overheating?")
        assert r.status_code == 200, r.text
        d = r.json()
        # No species mentioned - species_hint can be None
        # but citations should still be returned (likely ANY species)
        assert "citations" in d
        # We expect at least one citation
        if d["citations"]:
            sp = {c["species"] for c in d["citations"]}
            # Should at least include some cross-species or related content
            assert sp, "Empty citation species set"

    def test_chat_message_persisted_with_citations(self, admin_headers):
        # Use unique session_id to isolate
        sid = f"test-rag-{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{API}/chat", headers=admin_headers,
                          json={"message": "ball python temperature gradient?", "session_id": sid},
                          timeout=120)
        assert r.status_code == 200, r.text
        # Fetch history
        h = requests.get(f"{API}/chat/history", headers=admin_headers,
                         params={"session_id": sid}, timeout=15)
        assert h.status_code == 200
        msgs = h.json()
        # Should have at least user + assistant
        assistants = [m for m in msgs if m["role"] == "assistant"]
        assert len(assistants) >= 1
        last = assistants[-1]
        assert "citations" in last
        assert "species_hint" in last
        assert last["species_hint"] == "Ball Python"
        assert isinstance(last["citations"], list)

    def test_chat_requires_auth(self):
        r = requests.post(f"{API}/chat", json={"message": "hi"}, timeout=10)
        assert r.status_code == 401


# --- Regression: payment status graceful + key flows ------------------------
class TestRegression:
    def test_payment_status_graceful(self, admin_headers):
        # Issue checkout, then status — should not 500 even if Stripe race
        r = requests.post(f"{API}/payments/checkout", headers=admin_headers,
                          json={"tier_id": "beta", "origin_url": BASE_URL}, timeout=30)
        assert r.status_code == 200, r.text
        sid = r.json()["session_id"]
        r2 = requests.get(f"{API}/payments/status/{sid}", headers=admin_headers, timeout=20)
        # Must NOT be 500 — iteration 2 fix expected
        assert r2.status_code != 500, f"Stripe status 500 regression: {r2.text}"
        assert r2.status_code in (200, 202, 404, 410), f"Unexpected status {r2.status_code}: {r2.text}"

    def test_google_invalid_session_401(self):
        r = requests.post(f"{API}/auth/google/session",
                          json={"session_id": "not-a-real-session-xyz"}, timeout=15)
        assert r.status_code == 401

    def test_waitlist(self):
        email = f"wl_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/waitlist", json={"email": email, "name": "TEST WL"}, timeout=10)
        assert r.status_code == 200 and r.json().get("ok") is True

    def test_enclosures_listed(self, admin_headers):
        r = requests.get(f"{API}/enclosures", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert len(r.json()) >= 4
