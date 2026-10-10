from datetime import datetime

from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.String(50),
        unique=True,
        nullable=False
    )

    username = db.Column(
        db.String(100),
        unique=True,
        nullable=False
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    full_name = db.Column(
        db.String(150),
        nullable=False
    )

    role = db.Column(
        db.String(50),
        nullable=False
    )

    department_id = db.Column(
        db.Integer,
        nullable=True
    )

    phone = db.Column(
        db.String(20),
        nullable=True
    )

    email = db.Column(
        db.String(150),
        nullable=True
    )

    # NEW: Admin/User profile photo
    profile_photo = db.Column(
        db.String(255),
        nullable=True
    )

    is_active = db.Column(
        db.Boolean,
        default=True,
        nullable=False
    )

    last_login = db.Column(
        db.DateTime,
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def set_password(self, password):

        self.password_hash = generate_password_hash(
            password
        )

    def check_password(self, password):

        return check_password_hash(
            self.password_hash,
            password
        )

    def to_dict(self):

        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.username,
            "full_name": self.full_name,
            "role": self.role,
            "department_id": self.department_id,
            "phone": self.phone,
            "email": self.email,
            "profile_photo": self.profile_photo,
            "is_active": self.is_active,
            "last_login": (
                self.last_login.isoformat()
                if self.last_login
                else None
            ),
            "created_at": (
                self.created_at.isoformat()
                if self.created_at
                else None
            ),
            "updated_at": (
                self.updated_at.isoformat()
                if self.updated_at
                else None
            )
        }