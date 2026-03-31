"""
app.py  –  NeuroLearn Backend Entry Point
Run: python app.py
"""
import os, sys
from flask import Flask, send_from_directory
from flask_cors import CORS

# ── Path setup so sub-packages resolve correctly ─────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from backend.routes.mood_routes     import mood_bp
from backend.routes.activity_routes import activity_bp
from backend.routes.auth_routes     import auth_bp

# ── App factory ───────────────────────────────────────────────────────────────
app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, "frontend", "static"),
    template_folder=os.path.join(BASE_DIR, "frontend", "templates")
)
app.secret_key = os.getenv("SECRET_KEY", "neurolearn-secret-2024")
CORS(app, supports_credentials=True)

# ── Register blueprints ───────────────────────────────────────────────────────
app.register_blueprint(mood_bp,      url_prefix="/api")
app.register_blueprint(activity_bp,  url_prefix="/api")
app.register_blueprint(auth_bp,      url_prefix="/api")

# ── Serve frontend ────────────────────────────────────────────────────────────
FRONTEND = os.path.join(BASE_DIR, "frontend")

@app.route("/")
def index():
    return send_from_directory(FRONTEND, "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(FRONTEND, filename)

# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return {"status": "ok", "app": "NeuroLearn"}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"\n🌟  NeuroLearn running at  http://localhost:{port}\n")
    app.run(debug=True, port=port)
