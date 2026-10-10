from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db


# ============================================================
# APPLICATION FACTORY
# ============================================================

def create_app():

    app = Flask(__name__)

    # --------------------------------------------------------
    # CONFIGURATION
    # --------------------------------------------------------

    app.config.from_object(Config)

    # --------------------------------------------------------
    # DATABASE
    # --------------------------------------------------------

    db.init_app(app)

    # --------------------------------------------------------
    # CORS
    # --------------------------------------------------------

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://127.0.0.1:5500",
                    "http://localhost:5500",
                    "http://127.0.0.1:5501",
                    "http://localhost:5501"
                ],
                "methods": [
                    "GET",
                    "POST",
                    "PUT",
                    "DELETE",
                    "OPTIONS"
                ],
                "allow_headers": [
                    "Content-Type",
                    "Authorization",
                    "Accept"
                ]
            }
        },
        supports_credentials=True
    )

    # --------------------------------------------------------
    # IMPORT MODELS
    # --------------------------------------------------------

    from models.user import User
    from models.doctor import Doctor

    # --------------------------------------------------------
    # AUTH ROUTES
    # --------------------------------------------------------

    from routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    from routes.translation import translation_bp
    app.register_blueprint(translation_bp)

    # --------------------------------------------------------
    # ADMIN ROUTES
    # --------------------------------------------------------

    from routes.admin import admin_bp
    app.register_blueprint(admin_bp)

    # --------------------------------------------------------
    # PATIENT ROUTES
    # --------------------------------------------------------

    from routes.patient import patient_bp
    app.register_blueprint(patient_bp)

    # --------------------------------------------------------
    # NURSE ROUTES
    # --------------------------------------------------------

    from routes.nurse import nurse_bp
    app.register_blueprint(nurse_bp)

    # --------------------------------------------------------
    # NOTIFICATION ROUTES
    # --------------------------------------------------------

    from routes.notification import notification_bp
    app.register_blueprint(notification_bp)

    # --------------------------------------------------------
    # ROUTING ROUTES
    # --------------------------------------------------------

    from routes.routing import routing_bp
    app.register_blueprint(routing_bp)

    # --------------------------------------------------------
    # ASSESSMENT ROUTES
    # --------------------------------------------------------

    from routes.assessment import assessment_bp
    app.register_blueprint(assessment_bp)

    # --------------------------------------------------------
    # DOCTOR ROUTES
    # --------------------------------------------------------

    from routes.doctor import doctor_bp
    app.register_blueprint(doctor_bp)

    # --------------------------------------------------------
    # PRESCRIPTION ROUTES
    # --------------------------------------------------------

    from routes.prescription import prescription_bp
    app.register_blueprint(prescription_bp)

    # --------------------------------------------------------
    # PHARMACY ROUTES
    # --------------------------------------------------------

    from routes.pharmacy import pharmacy_bp
    app.register_blueprint(pharmacy_bp)

    # --------------------------------------------------------
    # BILLING ROUTES
    # --------------------------------------------------------

    from routes.billing import billing_bp
    app.register_blueprint(billing_bp)

    # --------------------------------------------------------
    # IPD ROUTES
    # --------------------------------------------------------

    from routes.ipd import ipd_bp
    app.register_blueprint(ipd_bp)

    # --------------------------------------------------------
    # EMPLOYEE ROUTES
    # --------------------------------------------------------

    from routes.employee import employee_bp
    app.register_blueprint(employee_bp)

    # ========================================================
    # HOME
    # ========================================================

    @app.route("/")
    def home():

        return jsonify({
            "success": True,
            "application": "MediMatrix",
            "message": "MediMatrix backend is running",
            "version": "1.0.0"
        })

    # ========================================================
    # HEALTH CHECK
    # ========================================================

    @app.route("/api/health")
    def health():

        try:

            from sqlalchemy import text

            with db.engine.connect() as connection:

                connection.execute(
                    text("SELECT 1")
                )

            return jsonify({
                "success": True,
                "application": "MediMatrix",
                "status": "online",
                "database": "connected"
            })

        except Exception as error:

            return jsonify({
                "success": False,
                "application": "MediMatrix",
                "status": "online",
                "database": "connection_failed",
                "error": str(error)
            }), 500

    # ========================================================
    # API INFORMATION
    # ========================================================

    @app.route("/api")
    def api_info():

        return jsonify({

            "success": True,

            "application": "MediMatrix",

            "message": "MediMatrix API",

            "modules": {
                "authentication": "/api/auth",
                "health": "/api/health",
                "assessment": "/api/assessment",
                "doctor": "/api/doctor",
                "patient": "/api/patients",
                "prescription": "/api/prescription",
                "ipd": "/api/ipd"
            },

            "endpoints": {
                "login": "POST /api/auth/login"
            }

        })

    # ========================================================
    # RETURN APPLICATION
    # ========================================================

    return app


# ============================================================
# CREATE APP
# ============================================================

app = create_app()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )