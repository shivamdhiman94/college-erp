import sys
import os

# Add parent directory to sys.path when script is executed directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User, UserRole, Admin


def init_db() -> None:
    db = SessionLocal()
    try:
        # Check if any admin exists
        admin_user = db.query(User).filter(
            (User.email == settings.FIRST_SUPERADMIN_EMAIL) |
            (User.username == settings.FIRST_SUPERADMIN_USERNAME)
        ).first()

        if not admin_user:
            admin_user = User(
                email=settings.FIRST_SUPERADMIN_EMAIL,
                username=settings.FIRST_SUPERADMIN_USERNAME,
                hashed_password=get_password_hash(settings.FIRST_SUPERADMIN_PASSWORD),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

            admin_profile = Admin(
                user_id=admin_user.id,
                first_name="Shivam",
                last_name="Kumar",
                phone="9876543210",
                designation="Director of IT & Academic Operations"
            )
            db.add(admin_profile)
            db.commit()
            print(f"Superadmin user created successfully: {admin_user.email} (Username: {admin_user.username})")
        else:
            print(f"Superadmin user already exists: {admin_user.email}")
    finally:
        db.close()


if __name__ == "__main__":
    from app.db.base import Base
    from app.db.session import engine
    print("Creating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("Initializing seed superadmin...")
    init_db()
    print("Database initialization complete.")
