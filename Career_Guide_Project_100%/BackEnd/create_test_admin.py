from app.auth import hash_password
from app.database import SessionLocal
from app.models import User


EMAIL = "admin@example.com"
PASSWORD = "AdminTest123"


db = SessionLocal()


try:
    existing_user = (
        db.query(User)
        .filter(User.email == EMAIL)
        .first()
    )

    if existing_user is None:
        admin_user = User(
            name="System Administrator",
            email=EMAIL,
            password_hash=hash_password(PASSWORD),
            role="admin",
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print("Test admin created successfully.")
        print(f"Admin ID: {admin_user.id}")

    elif existing_user.role != "admin":
        print(
            f"Cannot reset admin password: {EMAIL} belongs to "
            f"a {existing_user.role} account."
        )

    else:
        existing_user.name = "System Administrator"
        existing_user.password_hash = hash_password(PASSWORD)

        db.commit()

        print("Existing admin password was reset successfully.")
        print(f"Admin ID: {existing_user.id}")

    print(f"Email: {EMAIL}")
    print(f"Password: {PASSWORD}")

finally:
    db.close()