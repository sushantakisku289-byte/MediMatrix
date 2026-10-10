
import os

from dotenv import load_dotenv
from flask import Blueprint, request, jsonify
from sarvamai import SarvamAI
from sarvamai.core.api_error import ApiError

# Load BACKEND/.env
BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))

translation_bp = Blueprint(
    "translation",
    __name__,
    url_prefix="/api"
)

LANGUAGE_MAP = {
    "hi-IN": "hi-IN",
    "or-IN": "od-IN",
    "bn-IN": "bn-IN",
    "en-IN": "en-IN",
    "te-IN": "te-IN",
    "ta-IN": "ta-IN",
    "mr-IN": "mr-IN",
    "gu-IN": "gu-IN",
    "kn-IN": "kn-IN",
    "ml-IN": "ml-IN",
    "pa-IN": "pa-IN",
    "ur-IN": "ur-IN"
}


@translation_bp.route("/translate", methods=["POST"])
def translate_text():
    data = request.get_json(silent=True) or {}

    text = str(data.get("text", "")).strip()
    source_language = str(
        data.get("source_language", "hi-IN")
    )

    if not text:
        return jsonify({
            "success": False,
            "message": "No speech text received."
        }), 400

    source_code = LANGUAGE_MAP.get(source_language)

    if not source_code:
        return jsonify({
            "success": False,
            "message": "Unsupported source language."
        }), 400

    if source_code == "en-IN":
        return jsonify({
            "success": True,
            "original_text": text,
            "translated_text": text,
            "language": source_code
        }), 200

    api_key = os.getenv("SARVAM_API_KEY")

    if not api_key:
        return jsonify({
            "success": False,
            "message": "SARVAM_API_KEY is missing from BACKEND/.env."
        }), 500

    try:
        client = SarvamAI(
            api_subscription_key=api_key
        )

        response = client.text.translate(
            input=text,
            source_language_code=source_code,
            target_language_code="en-IN",
            model="sarvam-translate:v1"
        )

        translated = (
            getattr(response, "translated_text", "") or ""
        ).strip()

        if not translated:
            return jsonify({
                "success": False,
                "message": "Translation service returned empty text."
            }), 502

        return jsonify({
            "success": True,
            "original_text": text,
            "translated_text": translated,
            "language": source_code
        }), 200

    except ApiError as error:
        status_code = getattr(error, "status_code", None)
        print("Sarvam API error:", status_code, str(error))

        if status_code == 429:
            return jsonify({
                "success": False,
                "message": "Translation limit reached. Please try later."
            }), 429

        return jsonify({
            "success": False,
            "message": "Sarvam translation request failed."
        }), 502

    except Exception as error:
        print("Sarvam translation error:", repr(error))

        return jsonify({
            "success": False,
            "message": "Translation service unavailable."
        }), 502
