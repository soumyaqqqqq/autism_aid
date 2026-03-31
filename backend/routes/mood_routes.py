"""
routes/mood_routes.py
Handles /upload and /history endpoints.
"""
from flask import Blueprint, request, jsonify
from PIL import Image
import io, base64
from datetime import datetime, timezone
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from models.mood_model import analyze_image, get_suggestion
from database.db import insert, find_all

mood_bp = Blueprint("mood", __name__)


@mood_bp.route("/upload", methods=["POST"])
def upload_mood():
    """
    Accepts either:
      - multipart/form-data with key 'image'
      - JSON body with key 'image' (base64 data-URL)
    Returns detected emotion + suggestion.
    """
    pil_image = None

    # ── Parse image ───────────────────────────────────────────────────────────
    if request.content_type and "multipart" in request.content_type:
        file = request.files.get("image")
        if not file:
            return jsonify({"error": "No image file provided"}), 400
        pil_image = Image.open(file.stream).convert("RGB")
    else:
        data = request.get_json(silent=True) or {}
        b64 = data.get("image", "")
        if not b64:
            return jsonify({"error": "No image data provided"}), 400
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        try:
            img_bytes = base64.b64decode(b64)
            pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        except Exception as e:
            return jsonify({"error": f"Invalid image data: {str(e)}"}), 400

    # ── Analyze ───────────────────────────────────────────────────────────────
    emotion, confidences, suggestion = analyze_image(pil_image)

    # ── Persist ───────────────────────────────────────────────────────────────
    record = {
        "emotion": emotion,
        "confidences": confidences,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user": data.get("user", "child") if not (request.content_type and "multipart" in request.content_type) else request.form.get("user", "child")
    }
    insert("moods", record)

    return jsonify({
        "emotion": emotion,
        "confidences": confidences,
        "suggestion": suggestion,
        "timestamp": record["timestamp"]
    })


@mood_bp.route("/history", methods=["GET"])
def get_history():
    """Returns all mood records, most recent first."""
    user = request.args.get("user", None)
    query = {"user": user} if user else {}
    records = find_all("moods", query)
    records.sort(key=lambda r: r.get("timestamp", ""), reverse=True)
    return jsonify(records)
