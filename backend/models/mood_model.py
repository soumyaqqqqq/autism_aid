"""
models/mood_model.py
Mock emotion detection model.
Replace analyze_image() with a real TensorFlow/DeepFace call if desired.
The function accepts a PIL Image and returns (emotion_label, confidence_dict).
"""
import random
import hashlib

EMOTIONS = ["happy", "sad", "angry", "neutral", "excited", "calm"]

SUGGESTIONS = {
    "happy": {
        "message": "You're feeling great! Keep the energy going! 🌟",
        "activities": ["Try the Color Matching game!", "Teach a friend something new", "Do a creative drawing"],
        "color": "#FFD93D",
        "icon": "😊"
    },
    "sad": {
        "message": "It's okay to feel sad. Let's do something calming 💙",
        "activities": ["Listen to soft music", "Try deep breathing", "Play the Shape game slowly"],
        "color": "#6FAEDF",
        "icon": "😢"
    },
    "angry": {
        "message": "Let's take a deep breath and calm down 🌬️",
        "activities": ["Count to 10 slowly", "Squeeze a stress ball", "Try the calming quiz"],
        "color": "#FF6B6B",
        "icon": "😠"
    },
    "neutral": {
        "message": "You seem balanced today. Ready to learn? 📚",
        "activities": ["Try the quiz challenge", "Play Color Matching", "Explore new activities"],
        "color": "#A8D8A8",
        "icon": "😐"
    },
    "excited": {
        "message": "Wow, you have lots of energy! Let's channel it! ⚡",
        "activities": ["Try all the games!", "Challenge yourself with hard quiz", "Set a new score record"],
        "color": "#FF9F43",
        "icon": "🤩"
    },
    "calm": {
        "message": "You're in a great mindful state. Perfect for learning! 🧘",
        "activities": ["Try the shape recognition activity", "Read something new", "Practice focus games"],
        "color": "#A29BFE",
        "icon": "😌"
    }
}

def analyze_image(pil_image):
    """
    Accepts a PIL Image, returns (primary_emotion, confidence_scores, suggestion).
    Currently uses pixel-hash seeding for deterministic mock results.
    Swap with real model (e.g. DeepFace.analyze) for production.
    """
    try:
        # Create a deterministic but varied result based on image content
        img_bytes = pil_image.tobytes()[:1000]
        hash_val = int(hashlib.md5(img_bytes).hexdigest(), 16)
        random.seed(hash_val)
    except Exception:
        random.seed(42)

    # Generate confidence scores that sum to ~1
    weights = [random.uniform(0.05, 1.0) for _ in EMOTIONS]
    total = sum(weights)
    confidences = {e: round(w / total, 3) for e, w in zip(EMOTIONS, weights)}

    primary_emotion = max(confidences, key=confidences.get)
    suggestion = SUGGESTIONS[primary_emotion]

    return primary_emotion, confidences, suggestion

def get_suggestion(emotion: str) -> dict:
    return SUGGESTIONS.get(emotion, SUGGESTIONS["neutral"])
