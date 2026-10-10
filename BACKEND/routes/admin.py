from flask import (
    Blueprint,
    request,
    jsonify,
    send_from_directory
)

from extensions import db
from models.user import User

from werkzeug.utils import secure_filename

import os
import uuid


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

PROFILE_UPLOAD_FOLDER = os.path.join(
    BASE_DIR,
    "uploads",
    "profile_photos"
)

os.makedirs(
    PROFILE_UPLOAD_FOLDER,
    exist_ok=True
)


ALLOWED_IMAGE_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp"
}


# ============================================================
# ALLOWED STAFF ROLES
# ============================================================

ALLOWED_ROLES = {
    "HOSPITAL_EMPLOYEE": "EMP",
    "NURSE": "NUR",
    "DOCTOR": "DOC",
    "OPD": "OPD",
    "IPD": "IPD",
    "PHARMACY": "PHA",
    "BILLING": "BIL"
}


# ============================================================
# HELPER - GENERATE UNIQUE USER ID
# ============================================================

def generate_user_id(role):

    prefix = ALLOWED_ROLES[role]

    # Get all existing IDs using this prefix
    existing_users = User.query.filter(
        User.user_id.like(f"{prefix}%")
    ).all()

    used_numbers = []

    for user in existing_users:

        try:

            number_part = user.user_id[
                len(prefix):
            ]

            number = int(number_part)

            used_numbers.append(number)

        except (ValueError, TypeError):

            continue

    # Start from 1 if no ID exists
    next_number = 1

    if used_numbers:

        next_number = max(
            used_numbers
        ) + 1

    # Extra safety check
    while User.query.filter_by(
        user_id=f"{prefix}{next_number:03d}"
    ).first():

        next_number += 1

    return f"{prefix}{next_number:03d}"


# ============================================================
# HELPER - CHECK IMAGE
# ============================================================

def allowed_image(filename):

    if not filename:
        return False

    extension = (
        filename
        .rsplit(".", 1)[-1]
        .lower()
    )

    return extension in ALLOWED_IMAGE_EXTENSIONS


# ============================================================
# ADMIN DASHBOARD
# ============================================================
@admin_bp.route("/dashboard", methods=["GET"])
def dashboard():
    try:
        from models.patient import Patient

        users = User.query.all()
        total_patients = Patient.query.count()

        return jsonify({
            "success": True,
            "total_users": len(users),
            "total_patients": total_patients,
            "users": [
                user.to_dict()
                for user in users
            ]
        }), 200

    except Exception as error:
        print("ADMIN DASHBOARD ERROR:", repr(error))

        return jsonify({
            "success": False,
            "message": "Unable to load dashboard.",
            "error": str(error)
        }), 500


# ============================================================
# CREATE STAFF ACCOUNT
# ============================================================

# ============================================================
# CREATE STAFF ACCOUNT
# ============================================================

@admin_bp.route("/create-user", methods=["POST"])
def create_user():

    try:
        data = request.get_json(silent=True) or {}

        # ----------------------------------------------------
        # GET DATA FROM ADMIN DASHBOARD
        # ----------------------------------------------------

        admin_user_id = str(
            data.get("admin_user_id", "")
        ).strip()

        full_name = str(
            data.get("full_name", "")
        ).strip()

        username = str(
            data.get("username", "")
        ).strip()

        password = str(
            data.get("password", "")
        )

        role = str(
    data.get(
        "role",
        ""
    )
).strip().upper()

# Convert old frontend value to the database role
        if role == "EMPLOYEE":
            role = "HOSPITAL_EMPLOYEE"

        phone = str(
            data.get("phone", "")
        ).strip()

        email = str(
            data.get("email", "")
        ).strip()

        employee_id = str(
            data.get("employee_id", "")
        ).strip()

        department_name = str(
            data.get("department", "")
        ).strip()

        # ----------------------------------------------------
        # ADMIN VALIDATION
        # ----------------------------------------------------

        if not admin_user_id:

            return jsonify({
                "success": False,
                "message": "Admin ID is required."
            }), 400

        admin = User.query.filter_by(
            user_id=admin_user_id
        ).first()

        if not admin:

            return jsonify({
                "success": False,
                "message": "Admin account not found."
            }), 403

        if admin.role != "ADMIN":

            return jsonify({
                "success": False,
                "message": "Only an ADMIN can create accounts."
            }), 403

        # ----------------------------------------------------
        # BASIC VALIDATION
        # ----------------------------------------------------

        if not full_name:

            return jsonify({
                "success": False,
                "message": "Full name is required."
            }), 400

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

        if not role:

            return jsonify({
                "success": False,
                "message": "Role is required."
            }), 400

        if role not in ALLOWED_ROLES:

            return jsonify({
                "success": False,
                "message": "Invalid staff role: " + role
            }), 400

        # ----------------------------------------------------
        # DUPLICATE USERNAME
        # ----------------------------------------------------

        existing_user = User.query.filter_by(
            username=username
        ).first()

        if existing_user:

            return jsonify({
                "success": False,
                "message": "Username already exists."
            }), 409

        # ----------------------------------------------------
        # DEPARTMENT NAME → DEPARTMENT ID
        # ----------------------------------------------------

        department_map = {
            "General Medicine": 1,
            "Cardiology": 2,
            "Ophthalmology": 3,
            "ENT": 4,
            "Orthopedics": 5,
            "Dermatology": 6,
            "Neurology": 7,
            "Pediatrics": 8,
            "Gynecology": 9,
            "General Surgery": 10,
            "Pulmonology": 11,
            "Emergency": 12
        }

        department_id = None

        if department_name:

            department_id = department_map.get(
                department_name
            )

            if department_id is None:

                return jsonify({
                    "success": False,
                    "message":
                        "Invalid department: "
                        + department_name
                }), 400

                # ----------------------------------------------------
        # GENERATE / USE USER ID
        # ----------------------------------------------------

        # Use the Employee ID entered by Admin.
        # If Admin leaves it empty, generate one automatically.

        if employee_id:
            new_user_id = employee_id.upper()
        else:
            new_user_id = generate_user_id(role)

        # Prevent duplicate Employee/User ID
        existing_id = User.query.filter_by(
            user_id=new_user_id
        ).first()

        if existing_id:
            return jsonify({
                "success": False,
                "message": f"User ID {new_user_id} already exists."
            }), 409

        # ----------------------------------------------------
        # CREATE USER
        # ----------------------------------------------------

        new_user = User(
            user_id=new_user_id,
            username=username,
            full_name=full_name,
            role=role,
            department_id=department_id,
            phone=phone,
            email=email,
            is_active=True
        )

        # ----------------------------------------------------
        # PASSWORD HASH
        # ----------------------------------------------------

        new_user.set_password(password)

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        db.session.add(new_user)

        db.session.commit()

        # ----------------------------------------------------
        # SUCCESS RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "message":
                "Staff account created successfully.",

            "user": new_user.to_dict(),

            "login_credentials": {

                "user_id":
                    new_user_id,

                "username":
                    username,

                "password":
                    password,

                "role":
                    role,

                "department_id":
                    department_id

            }

        }), 201

    except Exception as error:

        db.session.rollback()

        print(
            "CREATE USER ERROR:",
            repr(error)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to create staff account.",

            "error":
                str(error)

        }), 500


# ============================================================
# GET USER PROFILE
# ============================================================

@admin_bp.route(
    "/profile/<user_id>",
    methods=["GET"]
)
def get_profile(user_id):

    try:

        user = User.query.filter_by(
            user_id=user_id
        ).first()

        if not user:

            return jsonify({

                "success": False,

                "message":
                    "User not found."

            }), 404

        return jsonify({

            "success": True,

            "user":
                user.to_dict()

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to load profile.",

            "error":
                str(error)

        }), 500


# ============================================================
# UPDATE USER PROFILE
#
# Supports:
# Full Name
# Phone
# Email
# ============================================================

@admin_bp.route(
    "/profile/<user_id>",
    methods=["PUT"]
)
def update_profile(user_id):

    try:

        user = User.query.filter_by(
            user_id=user_id
        ).first()

        if not user:

            return jsonify({

                "success": False,

                "message":
                    "User not found."

            }), 404

        # ----------------------------------------------------
        # JSON REQUEST
        # ----------------------------------------------------

        if request.is_json:

            data = request.get_json(
                silent=True
            ) or {}

            if "full_name" in data:

                full_name = str(
                    data.get(
                        "full_name",
                        ""
                    )
                ).strip()

                if not full_name:

                    return jsonify({

                        "success": False,

                        "message":
                            "Full name cannot be empty."

                    }), 400

                user.full_name = full_name

            if "phone" in data:

                user.phone = str(
                    data.get(
                        "phone",
                        ""
                    )
                ).strip()

            if "email" in data:

                user.email = str(
                    data.get(
                        "email",
                        ""
                    )
                ).strip()

        # ----------------------------------------------------
        # FORM DATA REQUEST
        # ----------------------------------------------------

        else:

            if "full_name" in request.form:

                full_name = str(
                    request.form.get(
                        "full_name",
                        ""
                    )
                ).strip()

                if not full_name:

                    return jsonify({

                        "success": False,

                        "message":
                            "Full name cannot be empty."

                    }), 400

                user.full_name = full_name

            if "phone" in request.form:

                user.phone = str(
                    request.form.get(
                        "phone",
                        ""
                    )
                ).strip()

            if "email" in request.form:

                user.email = str(
                    request.form.get(
                        "email",
                        ""
                    )
                ).strip()

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Profile updated successfully.",

            "user":
                user.to_dict()

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to update profile.",

            "error":
                str(error)

        }), 500

# ============================================================
# DELETE USER ACCOUNT
# ============================================================

@admin_bp.route(
    "/user/<int:user_id>",
    methods=["DELETE"]
)
def delete_user(user_id):

    try:

        # ----------------------------------------------------
        # READ REQUEST DATA
        # ----------------------------------------------------

        data = request.get_json(
            silent=True
        ) or {}

        admin_user_id = str(
            data.get("admin_user_id", "")
        ).strip()

        print(
            "DELETE USER REQUEST:",
            {
                "database_id": user_id,
                "admin_user_id": admin_user_id
            }
        )

        # ----------------------------------------------------
        # CHECK ADMIN USER ID
        # ----------------------------------------------------

        if not admin_user_id:

            return jsonify({
                "success": False,
                "message": "Admin user ID is required."
            }), 403

        # ----------------------------------------------------
        # FIND ADMIN
        # ----------------------------------------------------

        admin = User.query.filter_by(
            user_id=admin_user_id
        ).first()

        if not admin:

            return jsonify({
                "success": False,
                "message": "Administrator account not found."
            }), 403

        # ----------------------------------------------------
        # VERIFY ADMIN ROLE
        # ----------------------------------------------------

        if str(admin.role).upper() != "ADMIN":

            return jsonify({
                "success": False,
                "message": "Only an administrator can delete accounts."
            }), 403

        # ----------------------------------------------------
        # FIND TARGET USER
        # ----------------------------------------------------

        user = db.session.get(
            User,
            user_id
        )

        if not user:

            return jsonify({
                "success": False,
                "message": "User account not found."
            }), 404

        # ----------------------------------------------------
        # PROTECT ADMIN ACCOUNT
        # ----------------------------------------------------

        if str(user.role).upper() == "ADMIN":

            return jsonify({
                "success": False,
                "message": "Administrator accounts cannot be deleted."
            }), 400

        # ----------------------------------------------------
        # PREVENT SELF DELETE
        # ----------------------------------------------------

        if user.id == admin.id:

            return jsonify({
                "success": False,
                "message": "You cannot delete your own account."
            }), 400

        # ----------------------------------------------------
        # SAVE INFORMATION BEFORE DELETE
        # ----------------------------------------------------

        deleted_user_id = user.user_id
        deleted_name = user.full_name
        deleted_database_id = user.id

        # ----------------------------------------------------
        # DELETE USER
        # ----------------------------------------------------

        db.session.delete(user)

        db.session.commit()

        print(
            "USER DELETED SUCCESSFULLY:",
            {
                "database_id": deleted_database_id,
                "user_id": deleted_user_id,
                "name": deleted_name
            }
        )

        return jsonify({
            "success": True,
            "message": "User account deleted successfully.",
            "deleted_user_id": deleted_user_id,
            "deleted_name": deleted_name
        }), 200

    except Exception as error:

        db.session.rollback()

        print(
            "DELETE USER ERROR:",
            repr(error)
        )

        return jsonify({
            "success": False,
            "message": "Unable to delete user account.",
            "error": str(error)
        }), 500
# ============================================================
# UPLOAD / CHANGE PROFILE PHOTO
# ============================================================

@admin_bp.route(
    "/profile/<user_id>/photo",
    methods=["POST"]
)
def upload_profile_photo(user_id):

    try:

        user = User.query.filter_by(
            user_id=user_id
        ).first()

        if not user:

            return jsonify({

                "success": False,

                "message":
                    "User not found."

            }), 404

        # ----------------------------------------------------
        # CHECK FILE
        # ----------------------------------------------------

        if "profile_photo" not in request.files:

            return jsonify({

                "success": False,

                "message":
                    "Profile photo is required."

            }), 400

        file = request.files[
            "profile_photo"
        ]

        if not file or not file.filename:

            return jsonify({

                "success": False,

                "message":
                    "No profile photo selected."

            }), 400

        # ----------------------------------------------------
        # CHECK EXTENSION
        # ----------------------------------------------------

        if not allowed_image(
            file.filename
        ):

            return jsonify({

                "success": False,

                "message":
                    "Only JPG, JPEG, PNG and WEBP images are allowed."

            }), 400

        # ----------------------------------------------------
        # DELETE OLD PHOTO
        # ----------------------------------------------------

        if user.profile_photo:

            old_photo = os.path.join(

                PROFILE_UPLOAD_FOLDER,

                os.path.basename(
                    user.profile_photo
                )

            )

            if os.path.exists(
                old_photo
            ):

                try:

                    os.remove(
                        old_photo
                    )

                except OSError:

                    pass

        # ----------------------------------------------------
        # CREATE UNIQUE FILE NAME
        # ----------------------------------------------------

        extension = (
            file.filename
            .rsplit(".", 1)[-1]
            .lower()
        )

        new_filename = (
            f"{uuid.uuid4().hex}"
            f".{extension}"
        )

        save_path = os.path.join(

            PROFILE_UPLOAD_FOLDER,

            secure_filename(
                new_filename
            )

        )

        file.save(
            save_path
        )

        # ----------------------------------------------------
        # SAVE PATH IN DATABASE
        # ----------------------------------------------------

        user.profile_photo = new_filename

        db.session.commit()

        return jsonify({

            "success": True,

            "message":
                "Profile photo updated successfully.",

            "profile_photo":
                new_filename,

            "photo_url":
                f"/api/admin/profile-photo/{new_filename}",

            "user":
                user.to_dict()

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to upload profile photo.",

            "error":
                str(error)

        }), 500


# ============================================================
# SERVE PROFILE PHOTO
# ============================================================

@admin_bp.route(
    "/profile-photo/<filename>",
    methods=["GET"]
)
def get_profile_photo(filename):

    try:

        safe_filename = secure_filename(
            filename
        )

        if not safe_filename:

            return jsonify({

                "success": False,

                "message":
                    "Invalid file name."

            }), 400

        return send_from_directory(

            PROFILE_UPLOAD_FOLDER,

            safe_filename

        )

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to load profile photo.",

            "error":
                str(error)

        }), 404


# ============================================================
# ACTIVATE / DEACTIVATE USER
# ============================================================

@admin_bp.route(
    "/user/<int:user_id>/status",
    methods=["PUT"]
)
def change_user_status(user_id):

    try:

        data = request.get_json(
            silent=True
        ) or {}

        admin_user_id = str(
            data.get(
                "admin_user_id",
                ""
            )
        ).strip()

        admin = User.query.filter_by(
            user_id=admin_user_id
        ).first()

        if not admin or admin.role != "ADMIN":

            return jsonify({

                "success": False,

                "message":
                    "Admin authorization required."

            }), 403

        user = db.session.get(
            User,
            user_id
        )

        if not user:

            return jsonify({

                "success": False,

                "message":
                    "User not found."

            }), 404

        user.is_active = not user.is_active

        db.session.commit()

        return jsonify({

            "success": True,

            "message": (

                "User activated."

                if user.is_active

                else
                "User deactivated."

            ),

            "user":
                user.to_dict()

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500

