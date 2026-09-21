"""
Run once after first install to create default login accounts:

    python -m app.seed

Creates:
  admin@packcheck.ai     / Admin@123    (role: admin)
  inspector@packcheck.ai / Inspect@123  (role: inspector)

CHANGE THESE PASSWORDS before any real deployment.
"""
from app.database import SessionLocal, engine, Base
from app import models
from app.security import hash_password

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        defaults = [
            ("System Admin", "admin@packcheck.ai", "Admin@123", models.UserRole.ADMIN),
            ("Field Inspector", "inspector@packcheck.ai", "Inspect@123", models.UserRole.INSPECTOR),
        ]
        for name, email, password, role in defaults:
            existing = db.query(models.User).filter(models.User.email == email).first()
            if existing:
                print(f"[skip] {email} already exists")
                continue
            user = models.User(
                full_name=name,
                email=email,
                hashed_password=hash_password(password),
                role=role,
            )
            db.add(user)
            print(f"[created] {email} / {password} ({role.value})")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("\nSeeding complete. You can now log in at the frontend with the accounts above.")
