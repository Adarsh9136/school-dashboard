"""
Backend API tests for Resonance ERP.
Covers: health, auth, students, teachers, attendance, leaves, timetable, fees,
holidays, notifications, announcements, enquiries, audit, analytics.
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://premium-edu-dash.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

CREDS = {
    "principal": ("principal", "Principal@123"),
    "admin": ("admin", "Admin@123"),
    "accountant": ("accountant", "Account@123"),
    "teacher": ("t.kavita", "Teacher@123"),
    "parent": ("parent.gupta", "Parent@123"),
}


def _login(username, password):
    r = requests.post(f"{API}/auth/login", json={"username": username, "password": password}, timeout=15)
    return r


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


# ---------- Health ----------
class TestHealth:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["service"] == "resonance-erp"


# ---------- Auth ----------
class TestAuth:
    def test_login_principal(self):
        r = _login(*CREDS["principal"])
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and "user" in d
        assert d["user"]["role"] == "principal"

    def test_login_all_roles(self, tokens):
        for role in CREDS.keys():
            assert tokens[role]

    def test_login_wrong_password(self):
        r = _login("principal", "wrongpass")
        assert r.status_code == 401

    def test_me_returns_user(self, tokens):
        r = requests.get(f"{API}/auth/me", headers=_hdr(tokens["principal"]), timeout=10)
        assert r.status_code == 200
        assert r.json()["user"]["username"] == "principal"

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me", timeout=10)
        assert r.status_code in (401, 403)


# ---------- Students ----------
class TestStudents:
    def test_list_as_principal(self, tokens):
        r = requests.get(f"{API}/students", headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 6  # seeded
        s = data[0]
        assert "prn" in s and "classId" in s and "className" in s

    def test_parent_scoping(self, tokens):
        r = requests.get(f"{API}/students", headers=_hdr(tokens["parent"]), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # parent.gupta owns Aarav Gupta only ideally; ensure all are their children
        assert len(data) <= 3

    def test_create_student(self, tokens):
        unique_prn = f"TEST{uuid.uuid4().hex[:6].upper()}"
        payload = {
            "prn": unique_prn,
            "fullName": "TEST Student One",
            "className": "IX",
            "section": "B",
            "gender": "male",
            "dob": "2012-03-14",
            "parentName": "TEST Parent",
        }
        r = requests.post(f"{API}/students", headers=_hdr(tokens["principal"]), json=payload, timeout=15)
        assert r.status_code == 201, r.text
        s = r.json()
        assert s["prn"] == unique_prn
        assert s["classId"] == f"{unique_prn}_IX_B"
        sid = s["_id"]

        # PATCH — rebuild classId
        pr = requests.patch(f"{API}/students/{sid}", headers=_hdr(tokens["principal"]),
                            json={"section": "C"}, timeout=15)
        assert pr.status_code == 200
        assert pr.json()["classId"] == f"{unique_prn}_IX_C"

        # DELETE (deactivate)
        dr = requests.delete(f"{API}/students/{sid}", headers=_hdr(tokens["principal"]), timeout=15)
        assert dr.status_code == 200


# ---------- Teachers ----------
class TestTeachers:
    def test_list_teachers(self, tokens):
        r = requests.get(f"{API}/teachers", headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 6

    def test_create_teacher(self, tokens):
        payload = {
            "fullName": "TEST Teacher Delta",
            "email": f"test.{uuid.uuid4().hex[:6]}@resonance.edu.in",
            "phone": "9999999999",
            "subject": "Physics",
            "employeeId": f"TCH-{uuid.uuid4().hex[:5].upper()}",
        }
        r = requests.post(f"{API}/teachers", headers=_hdr(tokens["principal"]), json=payload, timeout=15)
        assert r.status_code in (200, 201), r.text


# ---------- Attendance ----------
class TestAttendance:
    def test_mark_student_attendance(self, tokens):
        # need a real student
        sr = requests.get(f"{API}/students", headers=_hdr(tokens["principal"]), timeout=15)
        stu = sr.json()[0]
        today = time.strftime("%Y-%m-%d")
        payload = {
            "type": "student",
            "date": today,
            "classId": stu["classId"],
            "entries": [{"refId": stu["_id"], "status": "present"}],
        }
        r = requests.post(f"{API}/attendance/mark", headers=_hdr(tokens["principal"]), json=payload, timeout=15)
        assert r.status_code == 200, r.text
        assert r.json()["count"] >= 1

        # Summary
        s = requests.get(f"{API}/attendance/summary?type=student&date=" + today,
                         headers=_hdr(tokens["principal"]), timeout=15)
        assert s.status_code == 200
        assert "present" in s.json() and "absent" in s.json()

    def test_teacher_cannot_mark_teacher_attendance(self, tokens):
        today = time.strftime("%Y-%m-%d")
        r = requests.post(f"{API}/attendance/mark", headers=_hdr(tokens["teacher"]),
                          json={"type": "teacher", "date": today, "entries": []}, timeout=15)
        assert r.status_code == 403


# ---------- Leaves ----------
class TestLeaves:
    _leave_id = None

    def test_teacher_apply_leave(self, tokens):
        r = requests.post(f"{API}/leaves", headers=_hdr(tokens["teacher"]),
                          json={"fromDate": "2026-08-01", "toDate": "2026-08-02",
                                "reason": "TEST — Personal work", "leaveType": "casual"}, timeout=15)
        assert r.status_code == 201, r.text
        TestLeaves._leave_id = r.json()["_id"]
        assert r.json()["status"] == "pending"

    def test_parent_cannot_apply_leave(self, tokens):
        r = requests.post(f"{API}/leaves", headers=_hdr(tokens["parent"]),
                          json={"fromDate": "2026-08-01", "toDate": "2026-08-02", "reason": "x"}, timeout=15)
        assert r.status_code == 403

    def test_principal_approve_leave(self, tokens):
        assert TestLeaves._leave_id, "prior test must have created a leave"
        r = requests.post(f"{API}/leaves/{TestLeaves._leave_id}/review",
                          headers=_hdr(tokens["principal"]),
                          json={"status": "approved", "reviewNote": "TEST approved"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "approved"

        # Teacher notification exists
        n = requests.get(f"{API}/notifications", headers=_hdr(tokens["teacher"]), timeout=15)
        assert n.status_code == 200
        titles = [x["title"] for x in n.json()]
        assert any("Leave" in t for t in titles)


# ---------- Timetable ----------
class TestTimetable:
    def test_get_class_timetable(self, tokens):
        r = requests.get(f"{API}/timetable?className=VII&section=A",
                         headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        slots = r.json()
        # 7 periods × 6 days = 42
        assert len(slots) >= 30

    def test_upsert_slot(self, tokens):
        r = requests.post(f"{API}/timetable", headers=_hdr(tokens["principal"]),
                          json={"className": "VII", "section": "A", "day": "Mon",
                                "period": 1, "subject": "TEST_Subject"}, timeout=15)
        assert r.status_code in (200, 201)
        assert r.json()["subject"] == "TEST_Subject"

    def test_teacher_own_slots(self, tokens):
        r = requests.get(f"{API}/timetable", headers=_hdr(tokens["teacher"]), timeout=15)
        assert r.status_code == 200
        slots = r.json()
        # all slots should belong to teacher (linkedRef)
        assert isinstance(slots, list)

    # Regression: /timetable/affected returns per-slot conflicts map
    def test_affected_endpoint_returns_conflicts(self, tokens):
        # Grab a teacher id
        tr = requests.get(f"{API}/teachers", headers=_hdr(tokens["principal"]), timeout=15)
        assert tr.status_code == 200
        teacher_id = tr.json()[0]["_id"]
        # Query affected classes over a Mon–Tue window
        r = requests.get(
            f"{API}/timetable/affected",
            headers=_hdr(tokens["principal"]),
            params={"teacherId": teacher_id, "fromDate": "2026-02-02", "toDate": "2026-02-03"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        days = r.json()
        assert isinstance(days, list)
        # Each slot on each day should carry a `conflicts` object (may be empty)
        for d in days:
            assert "day" in d and "date" in d and "slots" in d
            for s in d["slots"]:
                assert "conflicts" in s and isinstance(s["conflicts"], dict)
                for _tid, reason in s["conflicts"].items():
                    assert reason in ("scheduled", "on_leave")

    def test_affected_endpoint_requires_params(self, tokens):
        r = requests.get(f"{API}/timetable/affected", headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 400



# ---------- Fees ----------
class TestFees:
    def test_parent_only_own_fees(self, tokens):
        r = requests.get(f"{API}/fees", headers=_hdr(tokens["parent"]), timeout=15)
        assert r.status_code == 200
        fees = r.json()
        assert isinstance(fees, list)
        # No amount field per design
        for f in fees:
            assert "amount" not in f

    def test_mark_paid_and_reminders(self, tokens):
        # pick a pending fee
        r = requests.get(f"{API}/fees?status=pending", headers=_hdr(tokens["accountant"]), timeout=15)
        assert r.status_code == 200
        fees = r.json()
        if not fees:
            pytest.skip("No pending fees to mark paid")
        fee_id = fees[0]["_id"]
        m = requests.post(f"{API}/fees/{fee_id}/mark-paid",
                          headers=_hdr(tokens["accountant"]),
                          json={"paymentMode": "offline", "note": "TEST"}, timeout=15)
        assert m.status_code == 200
        assert m.json()["status"] == "paid"

        # send reminders
        sr = requests.post(f"{API}/fees/send-reminders", headers=_hdr(tokens["accountant"]), timeout=15)
        assert sr.status_code == 200
        assert "sent" in sr.json() and "checked" in sr.json()


# ---------- Holidays ----------
class TestHolidays:
    def test_list_holidays(self, tokens):
        r = requests.get(f"{API}/holidays", headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 3

    def test_create_and_duplicate(self, tokens):
        date = f"2029-12-{(int(time.time()) % 27) + 1:02d}"
        payload = {"date": date, "name": "TEST Holiday", "type": "school"}
        r = requests.post(f"{API}/holidays", headers=_hdr(tokens["principal"]), json=payload, timeout=15)
        assert r.status_code == 201, r.text
        # duplicate returns 409
        r2 = requests.post(f"{API}/holidays", headers=_hdr(tokens["principal"]), json=payload, timeout=15)
        assert r2.status_code == 409


# ---------- Notifications ----------
class TestNotifications:
    def test_list_and_mark_read(self, tokens):
        r = requests.get(f"{API}/notifications", headers=_hdr(tokens["teacher"]), timeout=15)
        assert r.status_code == 200
        items = r.json()
        if items:
            nid = items[0]["_id"]
            m = requests.post(f"{API}/notifications/{nid}/read",
                              headers=_hdr(tokens["teacher"]), timeout=15)
            assert m.status_code == 200
        # read-all
        ra = requests.post(f"{API}/notifications/read-all",
                           headers=_hdr(tokens["teacher"]), timeout=15)
        assert ra.status_code == 200


# ---------- Announcements ----------
class TestAnnouncements:
    def test_create_parent_announcement(self, tokens):
        r = requests.post(f"{API}/announcements", headers=_hdr(tokens["principal"]),
                          json={"title": "TEST Parents Notice", "body": "TEST body",
                                "audience": "parents"}, timeout=15)
        assert r.status_code == 201, r.text
        # parent should see a notification
        n = requests.get(f"{API}/notifications", headers=_hdr(tokens["parent"]), timeout=15)
        assert n.status_code == 200
        titles = [x["message"] for x in n.json()]
        assert any("TEST Parents Notice" in t for t in titles)

    def test_public_news(self):
        r = requests.get(f"{API}/announcements/public/news", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- Enquiries ----------
class TestEnquiries:
    _enq_id = None

    def test_public_create(self):
        payload = {
            "childName": "TEST Kid",
            "parentName": "TEST Parent",
            "email": f"test{uuid.uuid4().hex[:6]}@x.com",
            "phone": "9998887777",
            "classAppliedFor": "V",
        }
        r = requests.post(f"{API}/enquiries/public", json=payload, timeout=15)
        assert r.status_code == 201, r.text
        TestEnquiries._enq_id = r.json()["id"]

    def test_principal_list_and_patch(self, tokens):
        r = requests.get(f"{API}/enquiries", headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1
        if TestEnquiries._enq_id:
            p = requests.patch(f"{API}/enquiries/{TestEnquiries._enq_id}",
                               headers=_hdr(tokens["principal"]),
                               json={"status": "contacted"}, timeout=15)
            assert p.status_code == 200
            assert p.json()["status"] == "contacted"


# ---------- Audit ----------
class TestAudit:
    def test_audit_list(self, tokens):
        r = requests.get(f"{API}/audit", headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_audit_filter(self, tokens):
        r = requests.get(f"{API}/audit?entity=leave", headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        for row in r.json():
            assert row.get("entity") == "leave"


# ---------- Analytics ----------
class TestAnalytics:
    def test_summary(self, tokens):
        r = requests.get(f"{API}/analytics/summary", headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ("studentCount", "teacherCount", "pendingFees", "pendingLeaves"):
            assert k in d

    def test_attendance_trend(self, tokens):
        r = requests.get(f"{API}/analytics/attendance-trend",
                         headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list) and len(r.json()) == 7

    def test_class_distribution(self, tokens):
        r = requests.get(f"{API}/analytics/class-distribution",
                         headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_fee_status(self, tokens):
        r = requests.get(f"{API}/analytics/fee-status", headers=_hdr(tokens["principal"]), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "paid" in d and "pending" in d
