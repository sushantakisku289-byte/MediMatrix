from flask import Blueprint, jsonify, request

from extensions import db

from models.notification import Notification
from models.user import User


# ============================================================
# BLUEPRINT
# ============================================================

notification_bp = Blueprint(
    "notification",
    __name__,
    url_prefix="/api/notifications"
)


# ============================================================
# ADMIN NOTIFICATIONS
# ============================================================

@notification_bp.route(
    "/admin",
    methods=["GET"]
)
def get_admin_notifications():

    try:

        notifications = (
            Notification.query
            .filter_by(
                recipient_role="ADMIN"
            )
            .order_by(
                Notification.created_at.desc()
            )
            .all()
        )

        unread_count = (
            Notification.query
            .filter_by(
                recipient_role="ADMIN",
                is_read=False
            )
            .count()
        )

        return jsonify({
            "success": True,
            "unread_count": unread_count,
            "total": len(notifications),
            "notifications": [
                notification.to_dict()
                for notification in notifications
            ]
        }), 200

    except Exception as error:

        return jsonify({
            "success": False,
            "message": "Unable to load admin notifications.",
            "error": str(error)
        }), 500


# ============================================================
# NURSE NOTIFICATIONS
# ============================================================

@notification_bp.route(
    "/nurse",
    methods=["GET"]
)
def nurse_notifications():

    try:

        user_id_value = (
            request.args.get(
                "user_id",
                ""
            )
            .strip()
        )

        # ----------------------------------------------------
        # USER ID REQUIRED
        # ----------------------------------------------------

        if not user_id_value:

            return jsonify({
                "success": False,
                "message": "Nurse user ID is required."
            }), 400

        # ----------------------------------------------------
        # FIND NURSE
        # Accept:
        # NUR001
        # 2
        # ----------------------------------------------------

        nurse = None

        if user_id_value.isdigit():

            nurse = User.query.filter_by(
                id=int(user_id_value)
            ).first()

        else:

            nurse = User.query.filter_by(
                user_id=user_id_value
            ).first()

        # ----------------------------------------------------
        # NURSE NOT FOUND
        # ----------------------------------------------------

        if not nurse:

            return jsonify({
                "success": False,
                "message": "Nurse account not found."
            }), 404

        # ----------------------------------------------------
        # CHECK ROLE
        # ----------------------------------------------------

        if nurse.role not in [
            "NURSE",
            "NURSE_HOD"
        ]:

            return jsonify({
                "success": False,
                "message": "User is not a nurse."
            }), 403

        # ----------------------------------------------------
        # DATABASE PRIMARY KEY
        # ----------------------------------------------------

        database_user_id = nurse.id

        # ----------------------------------------------------
        # ONLY THIS NURSE'S NOTIFICATIONS
        # ----------------------------------------------------

        notifications = (
            Notification.query
            .filter(
                Notification.recipient_role == "NURSE",
                Notification.recipient_user_id == database_user_id
            )
            .order_by(
                Notification.created_at.desc()
            )
            .all()
        )

        # ----------------------------------------------------
        # UNREAD COUNT
        # ----------------------------------------------------

        unread_count = (
            Notification.query
            .filter(
                Notification.recipient_role == "NURSE",
                Notification.recipient_user_id == database_user_id,
                Notification.is_read == False
            )
            .count()
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "user_id": nurse.user_id,

            "database_user_id": nurse.id,

            "nurse_name": nurse.full_name,

            "department_id": nurse.department_id,

            "unread_count": unread_count,

            "total": len(notifications),

            "notifications": [
                notification.to_dict()
                for notification in notifications
            ]

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message": "Unable to load nurse notifications.",

            "error": str(error)

        }), 500


# ============================================================
# DOCTOR NOTIFICATIONS
# ============================================================

@notification_bp.route(
    "/doctor",
    methods=["GET"]
)
def doctor_notifications():

    try:

        user_id_value = (
            request.args.get(
                "user_id",
                ""
            )
            .strip()
        )

        # ----------------------------------------------------
        # USER ID REQUIRED
        # ----------------------------------------------------

        if not user_id_value:

            return jsonify({
                "success": False,
                "message": "Doctor user ID is required."
            }), 400

        # ----------------------------------------------------
        # FIND DOCTOR
        # Accept:
        # DOC001
        # DOC002
        # 4
        # 5
        # ----------------------------------------------------

        doctor = None

        if user_id_value.isdigit():

            doctor = User.query.filter_by(
                id=int(user_id_value)
            ).first()

        else:

            doctor = User.query.filter_by(
                user_id=user_id_value
            ).first()

        # ----------------------------------------------------
        # DOCTOR NOT FOUND
        # ----------------------------------------------------

        if not doctor:

            return jsonify({
                "success": False,
                "message": "Doctor account not found."
            }), 404

        # ----------------------------------------------------
        # CHECK ROLE
        # ----------------------------------------------------

        if doctor.role not in [
            "DOCTOR",
            "DOCTOR_HOD"
        ]:

            return jsonify({
                "success": False,
                "message": "User is not a doctor."
            }), 403

        # ----------------------------------------------------
        # DATABASE PRIMARY KEY
        # ----------------------------------------------------

        database_user_id = doctor.id

        # ----------------------------------------------------
        # ONLY THIS DOCTOR'S NOTIFICATIONS
        # ----------------------------------------------------

        notifications = (
            Notification.query
            .filter(
                Notification.recipient_role == "DOCTOR",
                Notification.recipient_user_id == database_user_id
            )
            .order_by(
                Notification.created_at.desc()
            )
            .all()
        )

        # ----------------------------------------------------
        # UNREAD COUNT
        # ----------------------------------------------------

        unread_count = (
            Notification.query
            .filter(
                Notification.recipient_role == "DOCTOR",
                Notification.recipient_user_id == database_user_id,
                Notification.is_read == False
            )
            .count()
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "user_id": doctor.user_id,

            "database_user_id": doctor.id,

            "doctor_name": doctor.full_name,

            "department_id": doctor.department_id,

            "unread_count": unread_count,

            "total": len(notifications),

            "notifications": [
                notification.to_dict()
                for notification in notifications
            ]

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message": "Unable to load doctor notifications.",

            "error": str(error)

        }), 500
# ============================================================
# BILLING NOTIFICATIONS
# ============================================================

@notification_bp.route(
    "/billing",
    methods=["GET"]
)
def billing_notifications():

    try:

        user_id_value = (
            request.args.get(
                "user_id",
                ""
            )
            .strip()
        )

        if not user_id_value:

            return jsonify({
                "success": False,
                "message": "Billing user ID is required."
            }), 400

        billing_user = None

        if user_id_value.isdigit():

            billing_user = User.query.filter_by(
                id=int(user_id_value)
            ).first()

        else:

            billing_user = User.query.filter_by(
                user_id=user_id_value
            ).first()

        if not billing_user:

            return jsonify({
                "success": False,
                "message": "Billing account not found."
            }), 404

        if billing_user.role != "BILLING":

            return jsonify({
                "success": False,
                "message": "User is not a billing staff member."
            }), 403

        notifications = (
            Notification.query
            .filter(
                Notification.recipient_role == "BILLING",
                Notification.recipient_user_id == billing_user.id
            )
            .order_by(
                Notification.created_at.desc()
            )
            .all()
        )

        unread_count = (
            Notification.query
            .filter(
                Notification.recipient_role == "BILLING",
                Notification.recipient_user_id == billing_user.id,
                Notification.is_read == False
            )
            .count()
        )

        return jsonify({

            "success": True,

            "user_id":
                billing_user.user_id,

            "database_user_id":
                billing_user.id,

            "billing_name":
                billing_user.full_name,

            "unread_count":
                unread_count,

            "total":
                len(notifications),

            "notifications": [
                notification.to_dict()
                for notification in notifications
            ]

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to load billing notifications.",

            "error":
                str(error)

        }), 500

# ============================================================
# IPD NOTIFICATIONS
# ============================================================

@notification_bp.route(
    "/ipd",
    methods=["GET"]
)
def ipd_notifications():

    try:

        user_id_value = (
            request.args.get(
                "user_id",
                ""
            )
            .strip()
        )

        # ----------------------------------------------------
        # USER ID REQUIRED
        # ----------------------------------------------------

        if not user_id_value:

            return jsonify({
                "success": False,
                "message": "IPD user ID is required."
            }), 400


        # ----------------------------------------------------
        # FIND IPD USER
        # ----------------------------------------------------

        ipd_user = None

        if user_id_value.isdigit():

            ipd_user = User.query.filter_by(
                id=int(user_id_value)
            ).first()

        else:

            ipd_user = User.query.filter_by(
                user_id=user_id_value
            ).first()


        # ----------------------------------------------------
        # IPD USER NOT FOUND
        # ----------------------------------------------------

        if not ipd_user:

            return jsonify({
                "success": False,
                "message": "IPD account not found."
            }), 404


        # ----------------------------------------------------
        # CHECK IPD ROLE
        # ----------------------------------------------------

        if ipd_user.role not in [
            "IPD",
            "IPD_STAFF",
            "IPD_HOD"
        ]:

            return jsonify({
                "success": False,
                "message": "User is not an IPD staff member."
            }), 403


        # ----------------------------------------------------
        # GET THIS IPD USER'S NOTIFICATIONS
        #
        # Existing notifications may have recipient_role
        # stored as "IPD".
        # ----------------------------------------------------

        notifications = (
            Notification.query
            .filter(
                Notification.recipient_user_id ==
                ipd_user.id,

                Notification.recipient_role.in_([
                    "IPD",
                    "IPD_STAFF",
                    "IPD_HOD"
                ])
            )
            .order_by(
                Notification.created_at.desc()
            )
            .all()
        )


        # ----------------------------------------------------
        # UNREAD COUNT
        # ----------------------------------------------------

        unread_count = (
            Notification.query
            .filter(
                Notification.recipient_user_id ==
                ipd_user.id,

                Notification.recipient_role.in_([
                    "IPD",
                    "IPD_STAFF",
                    "IPD_HOD"
                ]),

                Notification.is_read == False
            )
            .count()
        )


        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return jsonify({

            "success": True,

            "user_id":
                ipd_user.user_id,

            "database_user_id":
                ipd_user.id,

            "ipd_name":
                ipd_user.full_name,

            "unread_count":
                unread_count,

            "total":
                len(notifications),

            "notifications": [
                notification.to_dict()
                for notification in notifications
            ]

        }), 200


    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to load IPD notifications.",

            "error":
                str(error)

        }), 500
# ============================================================
# MARK ALL IPD NOTIFICATIONS AS READ
# ============================================================

@notification_bp.route(
    "/ipd/read-all",
    methods=["PUT"]
)
def mark_all_ipd_notifications_read():

    try:

        user_id_value = (
            request.args.get(
                "user_id",
                ""
            )
            .strip()
        )


        if not user_id_value:

            return jsonify({
                "success": False,
                "message": "IPD user ID is required."
            }), 400


        ipd_user = None


        if user_id_value.isdigit():

            ipd_user = User.query.filter_by(
                id=int(user_id_value)
            ).first()

        else:

            ipd_user = User.query.filter_by(
                user_id=user_id_value
            ).first()


        if not ipd_user:

            return jsonify({
                "success": False,
                "message": "IPD account not found."
            }), 404


        notifications = (
            Notification.query
            .filter(
                Notification.recipient_user_id ==
                ipd_user.id,

                Notification.recipient_role ==
                "IPD",

                Notification.is_read == False
            )
            .all()
        )


        for notification in notifications:

            notification.is_read = True


        db.session.commit()


        return jsonify({

            "success": True,

            "message":
                "All IPD notifications marked as read.",

            "updated":
                len(notifications)

        }), 200


    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message":
                "Unable to update IPD notifications.",

            "error":
                str(error)

        }), 500

# ============================================================
# MARK ONE NOTIFICATION AS READ
# ============================================================

@notification_bp.route(
    "/<int:notification_id>/read",
    methods=["PUT"]
)
def mark_notification_read(notification_id):

    try:

        notification = (
            Notification.query
            .get(notification_id)
        )

        if not notification:

            return jsonify({

                "success": False,

                "message": "Notification not found."

            }), 404

        notification.is_read = True

        db.session.commit()

        return jsonify({

            "success": True,

            "message": "Notification marked as read.",

            "notification": notification.to_dict()

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message": "Unable to update notification.",

            "error": str(error)

        }), 500


# ============================================================
# MARK ALL ADMIN NOTIFICATIONS AS READ
# ============================================================

@notification_bp.route(
    "/admin/read-all",
    methods=["PUT"]
)
def mark_all_admin_notifications_read():

    try:

        notifications = (
            Notification.query
            .filter_by(
                recipient_role="ADMIN",
                is_read=False
            )
            .all()
        )

        for notification in notifications:

            notification.is_read = True

        db.session.commit()

        return jsonify({

            "success": True,

            "message": "All admin notifications marked as read.",

            "updated": len(notifications)

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message": "Unable to update admin notifications.",

            "error": str(error)

        }), 500


# ============================================================
# MARK ALL NURSE NOTIFICATIONS AS READ
# ============================================================

@notification_bp.route(
    "/nurse/read-all",
    methods=["PUT"]
)
def mark_all_nurse_notifications_read():

    try:

        user_id_value = (
            request.args.get(
                "user_id",
                ""
            )
            .strip()
        )

        if not user_id_value:

            return jsonify({
                "success": False,
                "message": "Nurse user ID is required."
            }), 400

        nurse = None

        if user_id_value.isdigit():

            nurse = User.query.filter_by(
                id=int(user_id_value)
            ).first()

        else:

            nurse = User.query.filter_by(
                user_id=user_id_value
            ).first()

        if not nurse:

            return jsonify({
                "success": False,
                "message": "Nurse account not found."
            }), 404

        notifications = (
            Notification.query
            .filter(
                Notification.recipient_role == "NURSE",
                Notification.recipient_user_id == nurse.id,
                Notification.is_read == False
            )
            .all()
        )

        for notification in notifications:

            notification.is_read = True

        db.session.commit()

        return jsonify({

            "success": True,

            "message": "All nurse notifications marked as read.",

            "updated": len(notifications)

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message": "Unable to update nurse notifications.",

            "error": str(error)

        }), 500


# ============================================================
# MARK ALL DOCTOR NOTIFICATIONS AS READ
# ============================================================

@notification_bp.route(
    "/doctor/read-all",
    methods=["PUT"]
)
def mark_all_doctor_notifications_read():

    try:

        user_id_value = (
            request.args.get(
                "user_id",
                ""
            )
            .strip()
        )

        if not user_id_value:

            return jsonify({
                "success": False,
                "message": "Doctor user ID is required."
            }), 400

        doctor = None

        if user_id_value.isdigit():

            doctor = User.query.filter_by(
                id=int(user_id_value)
            ).first()

        else:

            doctor = User.query.filter_by(
                user_id=user_id_value
            ).first()

        if not doctor:

            return jsonify({
                "success": False,
                "message": "Doctor account not found."
            }), 404

        notifications = (
            Notification.query
            .filter(
                Notification.recipient_role == "DOCTOR",
                Notification.recipient_user_id == doctor.id,
                Notification.is_read == False
            )
            .all()
        )

        for notification in notifications:

            notification.is_read = True

        db.session.commit()

        return jsonify({

            "success": True,

            "message": "All doctor notifications marked as read.",

            "updated": len(notifications)

        }), 200

    except Exception as error:

        db.session.rollback()

        return jsonify({

            "success": False,

            "message": "Unable to update doctor notifications.",

            "error": str(error)

        }), 500