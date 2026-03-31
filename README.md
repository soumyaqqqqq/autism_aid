# 🧠 NeuroLearn — Smart Learning Platform for Children

A full-stack web application built with Flask + MongoDB/JSON + Chart.js designed to help children with emotional intelligence, interactive learning, and communication.

---

## 📁 Folder Structure

```
neurolearn/
├── app.py                        # Main Flask entry point
├── requirements.txt              # Python dependencies
├── README.md
│
├── backend/
│   ├── __init__.py
│   ├── routes/
│   │   ├── mood_routes.py        # /api/upload, /api/history
│   │   ├── activity_routes.py    # /api/activities, /api/activities/save
│   │   └── auth_routes.py        # /api/auth/login, /api/auth/register
│   ├── models/
│   │   └── mood_model.py         # Mock emotion detection model
│   └── database/
│       ├── db.py                 # MongoDB + JSON fallback handler
│       └── data.json             # JSON fallback + seed data
│
└── frontend/
    ├── index.html                # Single-page app shell
    └── static/
        ├── css/style.css         # Main stylesheet
        └── js/app.js             # All frontend logic
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the App
```bash
python app.py
```

### 3. Open Browser
```
http://localhost:5000
```

---

## 🔐 Demo Login (Parent Panel)
- **Username:** `parent`
- **Password:** `demo123`

---

## 🗄️ Database

- **With MongoDB:** Install MongoDB locally and start it. The app auto-connects to `mongodb://localhost:27017/`
- **Without MongoDB:** The app automatically falls back to `backend/database/data.json` — no setup needed!

To use a remote MongoDB (Atlas):
```
Set environment variable: MONGO_URI=mongodb+srv://...
```

---

## 🌐 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload` | Detect mood from image |
| GET  | `/api/history` | Get mood history |
| GET  | `/api/activities` | Get activity records |
| POST | `/api/activities/save` | Save activity result |
| GET  | `/api/activities/stats` | Get aggregated stats |
| POST | `/api/auth/login` | Parent login |
| POST | `/api/auth/register` | Parent register |
| GET  | `/api/health` | Health check |

---

## 🚀 Deployment

### Local
```bash
python app.py
```

### Render (Free Cloud Hosting)
1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `python app.py`
   - **Environment:** Python 3
5. Add env variable: `MONGO_URI` (if using MongoDB Atlas)

### Railway
1. Install Railway CLI: `npm install -g @railway/cli`
2. `railway login`
3. `railway init`
4. `railway up`

---

## ✨ Features

| Feature | Status |
|---------|--------|
| Mood Detection (image/webcam) | ✅ |
| Emotion confidence bars | ✅ |
| Dashboard with 4 charts | ✅ |
| Color Matching Game | ✅ |
| Shape Recognition Game | ✅ |
| Knowledge Quiz | ✅ |
| Communication Helper (TTS) | ✅ |
| Parent Panel with login | ✅ |
| Mood alerts / recommendations | ✅ |
| MongoDB + JSON fallback | ✅ |
| Responsive design | ✅ |

---

## 🔧 Extending the Project

**Add a real ML model:**
In `backend/models/mood_model.py`, replace the `analyze_image()` function body with:
```python
from deepface import DeepFace
result = DeepFace.analyze(np.array(pil_image), actions=["emotion"], enforce_detection=False)
primary_emotion = result[0]["dominant_emotion"]
confidences = result[0]["emotion"]
```
Then `pip install deepface`.

---

Built with ❤️ for children's learning and emotional well-being.
