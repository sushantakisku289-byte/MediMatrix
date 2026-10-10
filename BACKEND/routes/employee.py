from flask import Blueprint, request, jsonify

from extensions import db
from models.user import User
from models.notification import Notification


employee_bp = Blueprint(
    "employee",
    __name__,
    url_prefix="/api/employee"
)


# ============================================================
# EMPLOYEE REGISTRATION
# ============================================================

@employee_bp.route(
    "/register",
    methods=["POST"]
)
def register_employee():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        # ----------------------------------------------------
        # GET DATA
        # ----------------------------------------------------

        full_name = str(
            data.get("full_name", "")
        ).strip()

        email = str(
            data.get("email", "")
        ).strip().lower()

        mobile = str(
            data.get("mobile", "")
        ).strip()

        role = str(
            data.get("role", "")
        ).strip().upper()

        department = str(
            data.get("department", "")
        ).strip()

        password = str(
            data.get("password", "")
        )

        # ----------------------------------------------------
        # VALIDATION
        # ----------------------------------------------------

        if not full_name:

            return jsonify({
                "success": False,
                "message": "Full name is required."
            }), 400

        if not email:

            return jsonify({
                "success": False,
                "message": "Email is required."
            }), 400

        if not mobile:

            return jsonify({
                "success": False,
                "message": "Mobile number is required."
            }), 400

        if role not in [
            "DOCTOR",
            "NURSE"
        ]:

            return jsonify({
                "success": False,
                "message":
                    "Employee role must be DOCTOR or NURSE."
            }), 400

        if not department:

            return jsonify({
                "success": False,
                "message":
                    "Department is required."
            }), 400

        if not password:

            return jsonify({
                "success": False,
                "message":
                    "Password is required."
            }), 400

        # ----------------------------------------------------
        # CHECK EXISTING EMAIL
        # ----------------------------------------------------

        existing_user = User.query.filter_by(
            email=email
        ).first()

        if existing_user:

            return jsonify({
                "success": False,
                "message":
                    "An account with this email already exists."
            }), 409

        # ----------------------------------------------------
        # CREATE EMPLOYEE
        # ----------------------------------------------------

        user = User(
            username=full_name,
            email=email,
            role=role,
            department=department
        )

        # ----------------------------------------------------
        # PASSWORD
        #
        # Use your existing User password method if available.
        # ----------------------------------------------------

        if hasattr(user, "set_password"):

            user.set_password(password)

        else:

            user.password = password

        db.session.add(user)

        db.session.flush()

        # ----------------------------------------------------
        # CREATE ADMIN NOTIFICATION
        # ----------------------------------------------------

        notification = Notification(

            recipient_role="ADMIN",

            notification_type=
                "EMPLOYEE_REGISTRATION",

            title=
                "New Employee Registration",

            message=(
                f"{role.title()} "
                f"{full_name} has submitted "
                f"a registration request."
            ),

            employee_id=user.id,

            employee_name=full_name,

            is_read=False

        )

        db.session.add(notification)

        db.session.commit()

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "message":
                "Employee registration submitted successfully.",

            "employee": {

                "id":
                    user.id,

                "name":
                    full_name,

                "email":
                    email,

                "mobile":
                    mobile,

                "role":
                    role,

                "department":
                    department

            },

            "notification_created":
                True

        }), 201

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to register employee.",

            "error":
                str(error)

        }), 500