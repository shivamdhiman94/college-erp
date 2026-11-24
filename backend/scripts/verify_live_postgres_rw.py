import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings
from app.db.session import engine, SessionLocal
from app.models.academic import Department

def test_live_rw():
    print("=" * 60)
    print("TESTING LIVE READ/WRITE OPERATIONS ON POSTGRESQL")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # 1. READ: Query existing department
        depts = db.query(Department).all()
        print(f"[1/4] Live Read: Successfully queried {len(depts)} departments from PostgreSQL.")
        for d in depts[:3]:
            print(f"   -> Dept ID {d.id}: {d.name} ({d.code})")

        # 2. WRITE: Insert a test department
        test_code = "TEST_CLOUD_DEPT"
        existing = db.query(Department).filter(Department.code == test_code).first()
        if existing:
            db.delete(existing)
            db.commit()

        new_dept = Department(
            name="Cloud Systems Engineering",
            code=test_code,
            description="Temporary department to verify live cloud write capability"
        )
        db.add(new_dept)
        db.commit()
        db.refresh(new_dept)
        print(f"\n[2/4] Live Write: Created new department ID {new_dept.id} ({new_dept.code}) on PostgreSQL.")

        # 3. UPDATE: Modify test department
        new_dept.description = "Updated description to verify live update capability"
        db.commit()
        db.refresh(new_dept)
        print(f"\n[3/4] Live Update: Updated department ID {new_dept.id} description.")

        # 4. CLEANUP: Delete test department
        db.delete(new_dept)
        db.commit()
        print(f"\n[4/4] Live Delete & Cleanup: Deleted test department. Clean state preserved.")

        print("\n" + "=" * 60)
        print("[SUCCESS] LIVE POSTGRESQL READ, WRITE, UPDATE & DELETE VERIFIED!")
        print("=" * 60)
        return True
    except Exception as e:
        print(f"Live PostgreSQL R/W test FAILED: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_live_rw()
