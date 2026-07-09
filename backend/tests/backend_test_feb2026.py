"""
Backend tests for the Feb 2026 changes on Resonance ERP:
  1. POST /api/teachers/with-user (combined teacher+user creation)
  2. GET /api/teachers/me/classes (teacher's derived classes from Timetable)
  3. Student add auto-creates parent user via phone
  4. Parent login via phone / password change
  5. Teacher-scoped GET /api/students
  6. Attendance date / class / student restrictions for teachers
  7. Principal/Admin bypass of teacher restrictions
"""
import os
import time
import uuid
import datetime as dt
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

CREDS = {
    "principal": ("principal", "Principal@123"),
    "admin": ("admin", "Admin@123"),
    "teacher": ("t.kavita", "Teacher@123"),
    "parent": ("parent.gupta", "Parent@123"),
}


def _login(username, password):
    return requests.post(f"{API}/auth/login", json={"username": username, "password": password}, timeout=15)


def _hdr(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def tokens():
    out = {}
    for role, (u, p) in CREDS.items():
        r = _login(u, p)
        assert r.status_code == 200, f"login {role} failed: {r.status_code} {r.text}"
        out[role] = r.json()["token"]
    return out


# Created resources — collected here so we can clean up at the end of the session
CREATED = {"users": [], "teachers": [], "students": []}


@pytest.fixture(scope="session", autouse=True)
def cleanup(tokens):
    yield
    # NOTE: We don't have a hard-delete for users; best effort deactivate for teachers/students.
    for tid in CREATED["teachers"]:
        try:
            requests.delete(f"{API}/teachers/{tid}", headers=_hdr(tokens["principal"]), timeout=10)
        except Exception:
            pass
    for sid in CREATED["students"]:
        try:
            requests.delete(f"{API}/students/{sid}", headers=_hdr(tokens["principal"]), timeout=10)
        except Exception:
            pass


# ---------------- 1. Teacher combined create ----------------
class TestTeacherWithUser:
    def _payload(self, emp="T101", uname=None, pw="Testpw@123", extra=None):
        uname = uname or f"t.pw{uuid.uuid4().hex[:5]}"
        p = {
            "employeeId": emp,
            "fullName": "Test Playwright Teacher",
            "email": f"pw{uuid.uuid4().hex[:4]}@test.edu.in",
            "phone": "9998887777",
            "subjects": ["Art"],
            "classes": ["VII-A"],
            "username": uname,
            "password": pw,
        }
        if extra:
            p.update(extra)
        return p

    def test_create_teacher_with_user(self, tokens):
        p = self._payload(emp=f"T09{uuid.uuid4().hex[:4].upper()}")
        r = requests.post(f"{API}/teachers/with-user", headers=_hdr(tokens["principal"]), json=p, timeout=15)
        assert r.status_code == 201, r.text
        d = r.json()
        assert "teacher" in d and "user" in d
        assert d["teacher"]["employeeId"] == p["employeeId"]
        assert d["user"]["username"] == p["username"].lower()
        assert d["user"]["role"] == "teacher"
        assert d["user"]["linkedRef"] == d["teacher"]["_id"]
        CREATED["teachers"].append(d["teacher"]["_id"])
        CREATED["users"].append(d["user"]["id"])
        # Login as new teacher works
        lr = _login(p["username"], p["password"])
        assert lr.status_code == 200, lr.text
        assert lr.json()["user"]["role"] == "teacher"

    def test_duplicate_username_returns_409(self, tokens):
        uname = f"t.pw{uuid.uuid4().hex[:5]}"
        p1 = self._payload(emp=f"T09{uuid.uuid4().hex[:4].upper()}", uname=uname)
        r1 = requests.post(f"{API}/teachers/with-user", headers=_hdr(tokens["principal"]), json=p1, timeout=15)
        assert r1.status_code == 201, r1.text
        CREATED["teachers"].append(r1.json()["teacher"]["_id"])
        # Try to reuse username
        p2 = self._payload(emp=f"T09{uuid.uuid4().hex[:4].upper()}", uname=uname)
        r2 = requests.post(f"{API}/teachers/with-user", headers=_hdr(tokens["principal"]), json=p2, timeout=15)
        assert r2.status_code == 409
        assert "username" in r2.json().get("error", "").lower()

    def test_duplicate_employee_id_returns_409(self, tokens):
        emp = f"T09{uuid.uuid4().hex[:4].upper()}"
        p1 = self._payload(emp=emp)
        r1 = requests.post(f"{API}/teachers/with-user", headers=_hdr(tokens["principal"]), json=p1, timeout=15)
        assert r1.status_code == 201, r1.text
        CREATED["teachers"].append(r1.json()["teacher"]["_id"])
        p2 = self._payload(emp=emp, uname=f"t.pw{uuid.uuid4().hex[:5]}")
        r2 = requests.post(f"{API}/teachers/with-user", headers=_hdr(tokens["principal"]), json=p2, timeout=15)
        assert r2.status_code == 409
        assert "employee id" in r2.json().get("error", "").lower()

    def test_missing_credentials_returns_400(self, tokens):
        p = {"employeeId": f"T09{uuid.uuid4().hex[:4].upper()}", "fullName": "no cred"}
        r = requests.post(f"{API}/teachers/with-user", headers=_hdr(tokens["principal"]), json=p, timeout=15)
        assert r.status_code == 400

    def test_short_password_returns_400(self, tokens):
        p = self._payload(emp=f"T09{uuid.uuid4().hex[:4].upper()}", pw="abc")
        r = requests.post(f"{API}/teachers/with-user", headers=_hdr(tokens["principal"]), json=p, timeout=15)
        assert r.status_code == 400
        assert "6" in r.json().get("error", "") or "password" in r.json().get("error", "").lower()


# ---------------- 2. Teacher me/classes ----------------
class TestTeacherMeClasses:
    def test_kavita_classes(self, tokens):
        r = requests.get(f"{API}/teachers/me/classes", headers=_hdr(tokens["teacher"]), timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "teacherId" in d and "classes" in d
        classes = d["classes"]
        assert isinstance(classes, list)
        # Should include VII-A
        keys = {(c["className"], c["section"]) for c in classes}
        assert ("VII", "A") in keys

    def test_principal_cannot_hit_me_classes(self, tokens):
        r = requests.get(f"{API}/teachers/me/classes", headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 403


# ---------------- 3. Student add auto-creates parent + 4. parent login ----------------
class TestParentAutoCreate:
    _phone_new = None
    _phone_shared = None
    _first_parent_id = None

    def test_first_child_creates_parent(self, tokens):
        # unique phone per test-run
        phone_digits = f"91{int(time.time())%10_000_000_000:010d}"
        TestParentAutoCreate._phone_new = f"+{phone_digits[:2]}-{phone_digits[2:]}"
        expected_uname = phone_digits  # only digits, no leading + or -
        payload = {
            "prn": f"PW0{uuid.uuid4().hex[:5].upper()}",
            "fullName": "Test Kid One",
            "className": "VII",
            "section": "A",
            "gender": "male",
            "dob": "2013-01-01",
            "parentName": "TEST Parent Auto",
            "parentPhone": TestParentAutoCreate._phone_new,
        }
        r = requests.post(f"{API}/students", headers=_hdr(tokens["principal"]), json=payload, timeout=15)
        assert r.status_code == 201, r.text
        body = r.json()
        assert "student" in body and "parentUser" in body
        pu = body["parentUser"]
        assert pu is not None
        assert pu["username"] == expected_uname
        assert body["student"]["parentUserId"] == pu["id"]
        CREATED["students"].append(body["student"]["_id"])
        CREATED["users"].append(pu["id"])
        TestParentAutoCreate._first_parent_id = pu["id"]

    def test_parent_can_login(self, tokens):
        assert TestParentAutoCreate._phone_new
        expected_uname = TestParentAutoCreate._phone_new.replace("+", "").replace("-", "")
        r = _login(expected_uname, "Parent@123")
        assert r.status_code == 200, r.text
        assert r.json()["user"]["role"] == "parent"

    def test_second_child_reuses_parent(self, tokens):
        # Use same phone -> should reuse
        payload = {
            "prn": f"PW0{uuid.uuid4().hex[:5].upper()}",
            "fullName": "Test Kid Two",
            "className": "VII",
            "section": "A",
            "gender": "female",
            "dob": "2014-01-01",
            "parentName": "TEST Parent Auto",
            "parentPhone": TestParentAutoCreate._phone_new,
        }
        r = requests.post(f"{API}/students", headers=_hdr(tokens["principal"]), json=payload, timeout=15)
        assert r.status_code == 201, r.text
        pu = r.json()["parentUser"]
        assert pu is not None
        assert pu["id"] == TestParentAutoCreate._first_parent_id, "Should reuse the same parent user"
        CREATED["students"].append(r.json()["student"]["_id"])

    def test_parent_can_change_password(self, tokens):
        assert TestParentAutoCreate._phone_new
        uname = TestParentAutoCreate._phone_new.replace("+", "").replace("-", "")
        lr = _login(uname, "Parent@123")
        assert lr.status_code == 200
        tok = lr.json()["token"]
        cr = requests.post(
            f"{API}/auth/change-password",
            headers=_hdr(tok),
            json={"oldPassword": "Parent@123", "newPassword": "ChangedByParent1"},
            timeout=15,
        )
        assert cr.status_code == 200, cr.text
        # New login works
        lr2 = _login(uname, "ChangedByParent1")
        assert lr2.status_code == 200


# ---------------- 5. Teacher-scoped GET /api/students ----------------
class TestTeacherStudentScope:
    def test_teacher_sees_only_taught_classes(self, tokens):
        r = requests.get(f"{API}/students", headers=_hdr(tokens["teacher"]), timeout=15)
        assert r.status_code == 200
        students = r.json()
        assert isinstance(students, list)
        # Get classes she teaches
        cr = requests.get(f"{API}/teachers/me/classes", headers=_hdr(tokens["teacher"]), timeout=15)
        keys = {(c["className"], c["section"]) for c in cr.json()["classes"]}
        for s in students:
            assert (s["className"], s["section"]) in keys, f"Student {s.get('fullName')} in {s['className']}-{s['section']} not in taught classes"


# ---------------- 6. Attendance restrictions for teachers ----------------
class TestTeacherAttendanceRestrictions:
    def test_date_yesterday_forbidden(self, tokens):
        yesterday = (dt.date.today() - dt.timedelta(days=1)).isoformat()
        payload = {"type": "student", "date": yesterday, "className": "VII", "section": "A", "entries": []}
        r = requests.post(f"{API}/attendance/mark", headers=_hdr(tokens["teacher"]), json=payload, timeout=15)
        assert r.status_code == 403
        assert "today" in r.json().get("error", "").lower()

    def test_date_tomorrow_forbidden(self, tokens):
        tomorrow = (dt.date.today() + dt.timedelta(days=1)).isoformat()
        payload = {"type": "student", "date": tomorrow, "className": "VII", "section": "A", "entries": []}
        r = requests.post(f"{API}/attendance/mark", headers=_hdr(tokens["teacher"]), json=payload, timeout=15)
        assert r.status_code == 403
        assert "today" in r.json().get("error", "").lower()

    def test_wrong_class_forbidden(self, tokens):
        today = dt.date.today().isoformat()
        payload = {"type": "student", "date": today, "className": "IX", "section": "A", "entries": [{"refId": "dummy", "status": "present"}]}
        r = requests.post(f"{API}/attendance/mark", headers=_hdr(tokens["teacher"]), json=payload, timeout=15)
        assert r.status_code == 403
        assert "not assigned" in r.json().get("error", "").lower()

    def test_missing_class_returns_400(self, tokens):
        today = dt.date.today().isoformat()
        payload = {"type": "student", "date": today, "entries": [{"refId": "dummy", "status": "present"}]}
        r = requests.post(f"{API}/attendance/mark", headers=_hdr(tokens["teacher"]), json=payload, timeout=15)
        assert r.status_code == 400
        assert "classname" in r.json().get("error", "").lower() or "section" in r.json().get("error", "").lower()

    def test_teacher_own_class_success(self, tokens):
        today = dt.date.today().isoformat()
        # Pick a real VII-A student via principal (kavita teaches VII-A)
        sp = requests.get(f"{API}/students?className=VII&section=A", headers=_hdr(tokens["principal"]), timeout=15)
        assert sp.status_code == 200
        vii_a = [s for s in sp.json() if s["className"] == "VII" and s["section"] == "A"]
        assert len(vii_a) >= 1, "No VII-A students seeded"
        student = vii_a[0]
        payload = {
            "type": "student",
            "date": today,
            "className": "VII",
            "section": "A",
            "entries": [{"refId": student["_id"], "status": "present"}],
        }
        r = requests.post(f"{API}/attendance/mark", headers=_hdr(tokens["teacher"]), json=payload, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["count"] >= 1

    def test_wrong_class_student_forbidden(self, tokens):
        today = dt.date.today().isoformat()
        # Fetch a VIII-A student (if any)
        sp = requests.get(f"{API}/students?className=VIII&section=A", headers=_hdr(tokens["principal"]), timeout=15)
        assert sp.status_code == 200
        eighth = [s for s in sp.json() if s["className"] == "VIII" and s["section"] == "A"]
        if not eighth:
            pytest.skip("No VIII-A students seeded; cannot test wrong-class refId")
        payload = {
            "type": "student",
            "date": today,
            "className": "VII",
            "section": "A",
            "entries": [{"refId": eighth[0]["_id"], "status": "present"}],
        }
        r = requests.post(f"{API}/attendance/mark", headers=_hdr(tokens["teacher"]), json=payload, timeout=15)
        assert r.status_code == 403
        assert "belong" in r.json().get("error", "").lower() or "class" in r.json().get("error", "").lower()


# ---------------- 7. Principal bypasses restrictions ----------------
class TestPrincipalBypass:
    def test_principal_can_mark_past_date(self, tokens):
        yesterday = (dt.date.today() - dt.timedelta(days=1)).isoformat()
        # Pick any student
        sp = requests.get(f"{API}/students", headers=_hdr(tokens["principal"]), timeout=15).json()
        assert len(sp) > 0
        payload = {
            "type": "student",
            "date": yesterday,
            "classId": sp[0]["classId"],
            "entries": [{"refId": sp[0]["_id"], "status": "present"}],
        }
        r = requests.post(f"{API}/attendance/mark", headers=_hdr(tokens["principal"]), json=payload, timeout=15)
        assert r.status_code == 200, r.text

    def test_principal_can_mark_future_date(self, tokens):
        tomorrow = (dt.date.today() + dt.timedelta(days=1)).isoformat()
        sp = requests.get(f"{API}/students", headers=_hdr(tokens["principal"]), timeout=15).json()
        payload = {
            "type": "student",
            "date": tomorrow,
            "classId": sp[0]["classId"],
            "entries": [{"refId": sp[0]["_id"], "status": "present"}],
        }
        r = requests.post(f"{API}/attendance/mark", headers=_hdr(tokens["principal"]), json=payload, timeout=15)
        assert r.status_code == 200, r.text
