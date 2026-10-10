from datetime import datetime

from extensions import db


class Notification(db.Model):

    __tablename__ = "notifications"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True
    )

    # ---------------------------------------------------------
    # WHO RECEIVES THE NOTIFICATION
    # ---------------------------------------------------------

    recipient_user_id = db.Column(
        db.Integer,
        nullable=True,
        index=True
    )

    recipient_role = db.Column(
        db.String(50),
        nullable=False
    )

    # ---------------------------------------------------------
    # NOTIFICATION INFORMATION
    # ---------------------------------------------------------

    notification_type = db.Column(
        db.String(100),
        nullable=False
    )

    title = db.Column(
        db.String(255),
        nullable=False
    )

    message = db.Column(
        db.Text,
        nullable=False
    )

    # ---------------------------------------------------------
    # PATIENT INFORMATION
    # ---------------------------------------------------------

    patient_id = db.Column(
        db.String(50),
        nullable=True
    )

    patient_name = db.Column(
        db.String(150),
        nullable=True
    )

    # ---------------------------------------------------------
    # EMPLOYEE INFORMATION
    # ---------------------------------------------------------

    employee_id = db.Column(
        db.Integer,
        nullable=True
    )

    employee_name = db.Column(
        db.String(150),
        nullable=True
    )

    # ---------------------------------------------------------
    # STATUS
    # ---------------------------------------------------------

    is_read = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # ---------------------------------------------------------
    # TO DICT
    # ---------------------------------------------------------

    def to_dict(self):

        return {
            "id": self.id,

            "recipient_user_id":
                self.recipient_user_id,

            "recipient_role":
                self.recipient_role,

            "notification_type":
                self.notification_type,

            "title":
                self.title,

            "message":
                self.message,

            "employee_id":
                self.employee_id,

            "employee_name":
                self.employee_name,

            "patient_id":
                self.patient_id,

            "patient_name":
                self.patient_name,

            "is_read":
                bool(self.is_read),

            "created_at":
                self.created_at.isoformat()
                if self.created_at
                else None
        }