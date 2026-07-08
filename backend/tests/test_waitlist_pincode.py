"""Backend tests for the waitlist pincode gate feature.

Covers:
- POST /api/waitlist with Hyderabad pincode (500xxx / 501xxx) => is_hyderabad=true + welcome msg
- POST /api/waitlist with non-Hyderabad pincode => is_hyderabad=false + future-cities msg
- POST /api/waitlist invalid pincode -> 422
- POST /api/waitlist duplicate email preserves original is_hyderabad
- GET /api/waitlist/pincode-check for valid/invalid/hyd/non-hyd cases
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://mumzo-hyderabad.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _unique_email(prefix: str = "TEST_pin") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}@mumzo-test.dev"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- POST /api/waitlist ----------
class TestWaitlistCreate:
    def test_hyderabad_pincode_500033(self, api_client):
        payload = {
            "name": "TEST Hyd User",
            "email": _unique_email("TEST_hyd"),
            "address": "Flat 101, Jubilee Hills",
            "pincode": "500033",
            "baby_name": "Kabir",
            "baby_age": "6 months",
        }
        r = api_client.post(f"{API}/waitlist", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["is_hyderabad"] is True
        assert "id" in data and isinstance(data["id"], str)
        assert isinstance(data.get("position"), int) and data["position"] >= 1
        # welcome message for Hyderabad
        assert "Hyderabad" in data["message"] or "family" in data["message"].lower()

    def test_hyderabad_pincode_501101(self, api_client):
        payload = {
            "name": "TEST Sec User",
            "email": _unique_email("TEST_sec"),
            "address": "Secunderabad",
            "pincode": "501101",
            "baby_name": "Anaya",
            "baby_age": "3 months",
        }
        r = api_client.post(f"{API}/waitlist", json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["is_hyderabad"] is True

    def test_non_hyderabad_pincode_400001(self, api_client):
        payload = {
            "name": "TEST Mumbai User",
            "email": _unique_email("TEST_mum"),
            "address": "Colaba, Mumbai",
            "pincode": "400001",
            "baby_name": "Ira",
            "baby_age": "1 year",
        }
        r = api_client.post(f"{API}/waitlist", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["is_hyderabad"] is False
        # future-cities message
        msg_lower = data["message"].lower()
        assert "future" in msg_lower or "not in your city" in msg_lower or "near you" in msg_lower

    def test_non_hyderabad_pincode_560001(self, api_client):
        payload = {
            "name": "TEST Blr User",
            "email": _unique_email("TEST_blr"),
            "address": "MG Road, Bangalore",
            "pincode": "560001",
            "baby_name": "Vihaan",
            "baby_age": "9 months",
        }
        r = api_client.post(f"{API}/waitlist", json=payload)
        assert r.status_code == 200, r.text
        assert r.json()["is_hyderabad"] is False

    def test_invalid_pincode_too_short(self, api_client):
        payload = {
            "name": "TEST", "email": _unique_email(),
            "address": "Somewhere", "pincode": "12",
            "baby_name": "B", "baby_age": "1m",
        }
        r = api_client.post(f"{API}/waitlist", json=payload)
        assert r.status_code == 422, r.text

    def test_invalid_pincode_non_numeric(self, api_client):
        payload = {
            "name": "TEST", "email": _unique_email(),
            "address": "Somewhere", "pincode": "5000AB",
            "baby_name": "B", "baby_age": "1m",
        }
        r = api_client.post(f"{API}/waitlist", json=payload)
        assert r.status_code == 422, r.text

    def test_missing_pincode(self, api_client):
        payload = {
            "name": "TEST", "email": _unique_email(),
            "address": "Somewhere",
            "baby_name": "B", "baby_age": "1m",
        }
        r = api_client.post(f"{API}/waitlist", json=payload)
        assert r.status_code == 422, r.text


# ---------- Duplicate-email preservation of is_hyderabad ----------
class TestDuplicateEmail:
    def test_duplicate_email_preserves_original_flag(self, api_client):
        """Original entry with Hyderabad pincode => duplicate post with Mumbai pincode
        must still return is_hyderabad=True (original flag)."""
        email = _unique_email("TEST_dup")

        # 1st post: Hyderabad
        first_payload = {
            "name": "TEST Dup Hyd",
            "email": email,
            "address": "Banjara Hills",
            "pincode": "500034",
            "baby_name": "Aarav",
            "baby_age": "5 months",
        }
        r1 = api_client.post(f"{API}/waitlist", json=first_payload)
        assert r1.status_code == 200
        d1 = r1.json()
        assert d1["is_hyderabad"] is True
        original_id = d1["id"]

        # 2nd post: same email, non-Hyd pincode
        second_payload = dict(first_payload)
        second_payload["pincode"] = "400001"
        second_payload["address"] = "Mumbai now"
        r2 = api_client.post(f"{API}/waitlist", json=second_payload)
        assert r2.status_code == 200
        d2 = r2.json()
        # Must be same id (idempotent)
        assert d2["id"] == original_id
        # Must retain ORIGINAL is_hyderabad flag, not the new pincode's flag
        assert d2["is_hyderabad"] is True, f"Expected original hyd flag preserved, got {d2}"

    def test_duplicate_email_non_hyd_preserved(self, api_client):
        """Original non-Hyd, duplicate with Hyd pincode should still return is_hyderabad=False."""
        email = _unique_email("TEST_dup2")
        first = {
            "name": "TEST Dup NonHyd",
            "email": email,
            "address": "Delhi",
            "pincode": "110001",
            "baby_name": "Sia",
            "baby_age": "1 year",
        }
        r1 = api_client.post(f"{API}/waitlist", json=first)
        assert r1.status_code == 200
        assert r1.json()["is_hyderabad"] is False
        original_id = r1.json()["id"]

        second = dict(first)
        second["pincode"] = "500001"
        r2 = api_client.post(f"{API}/waitlist", json=second)
        assert r2.status_code == 200
        d2 = r2.json()
        assert d2["id"] == original_id
        assert d2["is_hyderabad"] is False, f"Expected original non-hyd flag preserved, got {d2}"


# ---------- GET /api/waitlist/pincode-check ----------
class TestPincodeCheck:
    def test_pincode_check_hyd_500001(self, api_client):
        r = api_client.get(f"{API}/waitlist/pincode-check", params={"pincode": "500001"})
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True
        assert d["is_hyderabad"] is True

    def test_pincode_check_hyd_501500(self, api_client):
        r = api_client.get(f"{API}/waitlist/pincode-check", params={"pincode": "501500"})
        assert r.status_code == 200
        assert r.json() == {"valid": True, "is_hyderabad": True}

    def test_pincode_check_non_hyd_560001(self, api_client):
        r = api_client.get(f"{API}/waitlist/pincode-check", params={"pincode": "560001"})
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True
        assert d["is_hyderabad"] is False

    def test_pincode_check_invalid_short(self, api_client):
        r = api_client.get(f"{API}/waitlist/pincode-check", params={"pincode": "12"})
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is False
        assert d["is_hyderabad"] is False

    def test_pincode_check_invalid_alpha(self, api_client):
        r = api_client.get(f"{API}/waitlist/pincode-check", params={"pincode": "5000AB"})
        assert r.status_code == 200
        assert r.json()["valid"] is False

    def test_pincode_check_boundary_499999(self, api_client):
        """Boundary: just below Hyderabad range => valid but not hyderabad."""
        r = api_client.get(f"{API}/waitlist/pincode-check", params={"pincode": "499999"})
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True and d["is_hyderabad"] is False

    def test_pincode_check_boundary_502000(self, api_client):
        """Boundary: just above 501xxx => valid but not hyderabad."""
        r = api_client.get(f"{API}/waitlist/pincode-check", params={"pincode": "502000"})
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is True and d["is_hyderabad"] is False


# ---------- Sanity checks (unchanged endpoints) ----------
class TestSanity:
    def test_root(self, api_client):
        r = api_client.get(f"{API}/")
        assert r.status_code == 200
        assert "Mumzo" in r.json()["message"]

    def test_list_no_object_id_leak(self, api_client):
        r = api_client.get(f"{API}/waitlist")
        assert r.status_code == 200
        entries = r.json()
        assert isinstance(entries, list)
        for e in entries[:5]:
            assert "_id" not in e
            assert "pincode" in e
            assert "is_hyderabad" in e
