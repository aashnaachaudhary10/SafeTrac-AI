# 🛡️ SafeTrac AI
### AI-Powered Women's Safety Navigation Platform
> Built for **Elite Her Hackathon 2026** | Team: **Chai or Code** ☕💻

---

## 🚀 Features
- 📍 **Dynamic Geofencing** — Real-time safety corridor with instant deviation alerts
- 🎙️ **AI Voice Keyword Detection** — Detects stress keywords and triggers silent SOS
- 📊 **Live Guardian Dashboard** — Real-time map with safety status (Green/Yellow/Red)
- 🔔 **Smart Alert Engine** — Instant SOS with location sharing

---

## 🗂️ Project Structure
```
safetrac/
├── frontend/          # React.js dashboard
├── backend/           # Python Flask API
├── ai_module/         # Python voice & gesture detection
└── README.md
```

---

## ⚙️ Setup & Run

### 1. Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

### 2. Backend (Flask API)
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

### 3. AI Voice Detection
```bash
cd ai_module
pip install -r requirements.txt
python voice_detector.py
```

---

## 🛠️ Tech Stack
| Layer | Tech |
|-------|------|
| Frontend | React.js, Leaflet Maps, Socket.io, CSS3 |
| Backend | Python, Flask, Flask-CORS, Flask-SocketIO |
| AI/ML | SpeechRecognition, NLP keyword matching, OpenCV |
| Database | JSON-based (easily upgradeable to MongoDB) |
| Alerts | Console + Browser Notifications |

---

## 🎯 How It Works
1. User opens the SafeTrac dashboard and starts a trip
2. A **safety geofence** is set around their route
3. **AI voice module** listens for stress keywords in background
4. If user says "help", "danger", "leave me alone" etc → **SOS triggered**
5. Guardian dashboard shows **live location** + **RED alert status**
6. Alert sent via browser notification + logged in backend

---

## 👩‍💻 Team
**Chai or Code** ☕ | Solo Participant | Elite Her Hackathon 2026

---

*Because every woman deserves to come home safe. 🛡️*
