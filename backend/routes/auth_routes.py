"""
routes/auth_routes.py
Simple session-less authentication for the parent panel.
Passwords stored as plain text for demo; hash with bcrypt in production.
"""
from flask import Blueprint, request, jsonify, session
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from database.db import find_one, insert

auth_bp = Blueprint("auth", __name__)

# Pre-seeded demo parent account
DEMO_PARENT = {"username": "parent", "password": "demo123", "child": "child"}


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    # Check demo account first
    if username == DEMO_PARENT["username"] and password == DEMO_PARENT["password"]:
        return jsonify({"success": True, "username": username, "child": DEMO_PARENT["child"]})

    # Check DB
    user = find_one("users", {"username": username})
    if user and user.get("password") == password:
        return jsonify({"success": True, "username": username, "child": user.get("child", "child")})

    return jsonify({"success": False, "message": "Invalid credentials"}), 401


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    child = data.get("child", "child").strip()

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
    if find_one("users", {"username": username}):
        return jsonify({"error": "Username already exists"}), 409

    insert("users", {"username": username, "password": password, "child": child})
    return jsonify({"success": True, "message": "Account created"})
