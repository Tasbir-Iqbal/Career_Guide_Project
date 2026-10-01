from app.auth import hash_password
from app.database import SessionLocal
from app.models import Counselor, User

EMAIL = "counselor@example.com"

db = SessionLocal()

try:
    existing_user = (
        db.query(User)
        .filter(User.email == EMAIL)
        .first()
    )

    if existing_user:
        print("Counselor already exists.")
    else:
        counselor_user = User(
            name="Dr. Sarah Ahmed",
            email=EMAIL,
            password_hash=hash_password("CounselorTest123"),
            role="counselor"
        )

        db.add(counselor_user)
        db.flush()

        counselor_profile = Counselor(
            user_id=counselor_user.id,
            specialization="engineering, programming, artificial intelligence",
            bio="Career counselor focused on engineering and technology careers.",
            availability="Monday-Friday, 10:00 AM-4:00 PM"
        )

        db.add(counselor_profile)
        db.commit()

        print("Test counselor created successfully.")
        print(f"Counselor ID: {counselor_profile.id}")
        print(f"Email: {EMAIL}")

finally:
    db.close()