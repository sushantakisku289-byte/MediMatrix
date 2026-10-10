from datetime import datetime

from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash

from models.user import User
from extensions import db


# ============================================================
# AUTH BLUEPRINT
# ============================================================

auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


# ============================================================
# LOGIN
# ============================================================

@auth_bp.route("/login", methods=["POST"])
def login():

    try:

        # ----------------------------------------------------
        # GET REQUEST DATA
        # ----------------------------------------------------

        data = request.get_json(silent=True) or {}

        username = str(
            data.get("username", "")
        ).strip()

        password = str(
            data.get("password", "")
        )

        selected_role = str(
            data.get("role", "")
        ).strip().upper()


        # ----------------------------------------------------
        # VALIDATION
        # ----------------------------------------------------

        if not username:

            return jsonify({
                "success": False,
                "message": "Username is required."
            }), 400


        if not password:

            return jsonify({
                "success": False,
                "message": "Password is required."
            }), 400


        if not selected_role:

            return jsonify({
                "success": False,
                "message": "Please select your role."
            }), 400


        # ----------------------------------------------------
        # FIND USER
        # ----------------------------------------------------

        user = User.query.filter_by(
            username=username
        ).first()


        if user is None:

            return jsonify({
                "success": False,
                "message": "Invalid username or password."
            }), 401


        # ----------------------------------------------------
        # CHECK ACTIVE ACCOUNT
        # ----------------------------------------------------

        if not user.is_active:

            return jsonify({
                "success": False,
                "message": (
                    "This account is inactive. "
                    "Contact administrator."
                )
            }), 403


        # ----------------------------------------------------
        # CHECK PASSWORD
        # ----------------------------------------------------

        if not check_password_hash(
            user.password_hash,
            password
        ):

            return jsonify({
                "success": False,
                "message": "Invalid username or password."
            }), 401


                # ----------------------------------------------------
        # CHECK ROLE
        # ----------------------------------------------------

        actual_role = str(
            user.role or ""
        ).strip().upper()


        # ----------------------------------------------------
        # ROLE COMPATIBILITY
        # ----------------------------------------------------
        # Existing IPD accounts may be stored as:
        #     IPD
        #
        # Login screen uses:
        #     IPD_STAFF
        #     IPD_HOD
        #
        # Allow these IPD roles to authenticate with
        # the same IPD account.
        # ----------------------------------------------------

        role_matches = (
            actual_role == selected_role
            or
            (
                actual_role == "IPD"
                and selected_role in [
                    "IPD",
                    "IPD_STAFF",
                    "IPD_HOD"
                ]
            )
        )


        if not role_matches:

            return jsonify({
                "success": False,
                "message": (
                    f"Selected role does not match "
                    f"your account role. "
                    f"Your account is registered as {actual_role}."
                )
            }), 403

        # ----------------------------------------------------
        # UPDATE LAST LOGIN
        # ----------------------------------------------------

        user.last_login = datetime.utcnow()

        db.session.commit()


        # ----------------------------------------------------
        # USER DATA
        # ----------------------------------------------------

        user_data = user.to_dict()


        # Make absolutely sure these values are present.
        user_data["user_id"] = user.user_id
        user_data["username"] = user.username
        user_data["full_name"] = user.full_name
        user_data["role"] = actual_role
        user_data["department_id"] = user.department_id
        user_data["phone"] = user.phone
        user_data["email"] = user.email


        # ----------------------------------------------------
        # SUCCESS RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "message": "Login successful.",

            "user": user_data,

            # Top-level values also returned for compatibility
            # with existing frontend code.

            "user_id": user.user_id,

            "username": user.username,

            "full_name": user.full_name,

            "role": actual_role,

            "department_id": user.department_id,

            "phone": user.phone,

            "email": user.email

        }), 200


    # ========================================================
    # ERROR
    # ========================================================

    except Exception as error:

        db.session.rollback()

        print(
            "LOGIN ERROR:",
            str(error)
        )

        return jsonify({

            "success": False,

            "message": "Login failed.",

            "error": str(error)

        }), 500