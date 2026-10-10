from flask import Blueprint, request, jsonify

from services.department_routing import route_department


routing_bp = Blueprint(
    "routing",
    __name__,
    url_prefix="/api/routing"
)


# ============================================================
# DEPARTMENT ROUTING
# ============================================================

@routing_bp.route(
    "/department",
    methods=["POST"]
)
def department_routing():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        symptoms = str(
            data.get(
                "symptoms",
                ""
            )
        ).strip()

        if not symptoms:

            return jsonify({

                "success": False,

                "message":
                    "Symptoms are required."

            }), 400

        result = route_department(
            symptoms
        )

        return jsonify({

            "success": True,

            "symptoms":
                symptoms,

            "routing":
                result

        }), 200

    except Exception as error:

        return jsonify({

            "success": False,

            "message":
                "Unable to route department.",

            "error":
                str(error)

        }), 500