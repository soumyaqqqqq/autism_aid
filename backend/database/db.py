"""
database/db.py
Handles MongoDB connection with automatic JSON file fallback.
If MongoDB is not available, all data is stored in data.json.
"""
import json
import os
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")

# ── Try MongoDB ──────────────────────────────────────────────────────────────
try:
    from pymongo import MongoClient
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    _client.server_info()          # triggers immediate connection check
    _db = _client["neurolearn"]
    USE_MONGO = True
    print("[DB] ✅  Connected to MongoDB")
except Exception:
    USE_MONGO = False
    print("[DB] ⚠️  MongoDB unavailable – using JSON fallback")


# ── JSON helpers ─────────────────────────────────────────────────────────────
def _load():
    if not os.path.exists(DATA_FILE):
        return {"moods": [], "activities": [], "users": []}
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def _save(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2, default=str)


# ── Public API ────────────────────────────────────────────────────────────────
def insert(collection: str, document: dict):
    document["_id"] = str(datetime.utcnow().timestamp()).replace(".", "")
    if USE_MONGO:
        _db[collection].insert_one(document)
    else:
        data = _load()
        data.setdefault(collection, []).append(document)
        _save(data)
    return document

def find_all(collection: str, query: dict = None):
    if USE_MONGO:
        docs = list(_db[collection].find(query or {}, {"_id": 0}))
    else:
        data = _load()
        docs = data.get(collection, [])
        if query:
            docs = [d for d in docs if all(d.get(k) == v for k, v in query.items())]
    return docs

def find_one(collection: str, query: dict):
    if USE_MONGO:
        doc = _db[collection].find_one(query, {"_id": 0})
    else:
        data = _load()
        doc = next(
            (d for d in data.get(collection, [])
             if all(d.get(k) == v for k, v in query.items())),
            None
        )
    return doc
