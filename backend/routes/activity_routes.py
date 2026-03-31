"""
routes/activity_routes.py
Handles /activities and /activities/save endpoints.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import insert, find_all

activity_bp = Blueprint("activity", __name__)


@activity_bp.route("/activities", methods=["GET"])
def get_activities():
    user = request.args.get("user", None)
    query = {"user": user} if user else {}
    records = find_all("activities", query)
    records.sort(key=lambda r: r.get("timestamp", ""), reverse=True)
    return jsonify(records)


@activity_bp.route("/activities/save", methods=["POST"])
def save_activity():
    data = request.get_json(silent=True) or {}
    required = ["activity_type", "score", "total"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    record = {
        "activity_type": data["activity_type"],  # "color_match" | "shape" | "quiz"
        "score": int(data["score"]),
        "total": int(data["total"]),
        "percentage": round(int(data["score"]) / int(data["total"]) * 100, 1),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user": data.get("user", "child"),
        "details": data.get("details", {})
    }
    insert("activities", record)
    return jsonify({"message": "Activity saved", "record": record})


@activity_bp.route("/activities/stats", methods=["GET"])
def get_stats():
    """Returns aggregated stats per activity type."""
    user = request.args.get("user", None)
    query = {"user": user} if user else {}
    records = find_all("activities", query)

    stats = {}
    for r in records:
        t = r.get("activity_type", "unknown")
        if t not in stats:
            stats[t] = {"attempts": 0, "total_score": 0, "total_possible": 0, "best": 0}
        stats[t]["attempts"] += 1
        stats[t]["total_score"] += r.get("score", 0)
        stats[t]["total_possible"] += r.get("total", 1)
        pct = r.get("percentage", 0)
        if pct > stats[t]["best"]:
            stats[t]["best"] = pct

    for t in stats:
        tp = stats[t]["total_possible"]
        stats[t]["avg_pct"] = round(stats[t]["total_score"] / tp * 100, 1) if tp else 0

    return jsonify(stats)
