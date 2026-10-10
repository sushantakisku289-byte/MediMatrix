from app import app
from extensions import db
from models.user import User


ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Admin@123"
ADMIN_NAME = "MediMatrix Administrator"


with app.app_context():

    existing_admin = User.query.filter_by(
        username=ADMIN_USERNAME
    ).first()

    if existing_admin:

        print("========================================")
        print("ADMIN ALREADY EXISTS")
        print("Username :", ADMIN_USERNAME)
        print("========================================")

    else:

        admin = User(
            user_id="ADM001",
            username=ADMIN_USERNAME,
            full_name=ADMIN_NAME,
            role="ADMIN",
            phone="",
            email="admin@medimatrix.local",
            is_active=True
        )

        admin.set_password(ADMIN_PASSWORD)

        db.session.add(admin)
        db.session.commit()

        print("========================================")
        print("MEDIMATRIX ADMIN CREATED")
        print("========================================")
        print("User ID  :", "ADM001")
        print("Username :", ADMIN_USERNAME)
        print("Password :", ADMIN_PASSWORD)
        print("Role     :", "ADMIN")
        print("========================================")