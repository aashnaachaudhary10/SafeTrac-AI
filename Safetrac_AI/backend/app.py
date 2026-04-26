"""
SafeTrac AI — Flask Backend
Handles geofence logic, SOS alerts, and status API
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import math
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ── In-memory state (upgrade to MongoDB in production) ──────────────────────
state = {
    "sos_active": False,
    "last_sos": None,
    "status": "safe",  # safe | alert | sos
    "last_location": None,
    "trip_active": False,
    "alerts": [],
    "home_base": None,
}

SAFE_RADIUS = 300  # meters
STRESS_KEYWORDS = ["help", "danger", "leave me alone", "stop", "bachao",
                   "chodo", "madad", "emergency", "sos", "scared"]


def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance in meters between two GPS coordinates."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def add_alert(alert_type, message, location=None):
    alert = {
        "id": datetime.now().timestamp(),
        "type": alert_type,
        "message": message,
        "time": datetime.now().strftime("%I:%M:%S %p"),
        "location": location,
    }
    state["alerts"].insert(0, alert)
    state["alerts"] = state["alerts"][:50]  # keep last 50
    print(f"[{alert['time']}] {alert_type}: {message}")
    return alert


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return jsonify({
        "name": "SafeTrac AI Backend",
        "version": "1.0.0",
        "team": "Chai or Code ☕",
        "hackathon": "Elite Her 2026",
        "status": "running",
    })


@app.route("/api/status")
def get_status():
    """Guardian dashboard polls this every 3 seconds."""
    return jsonify({
        "status": state["status"],
        "sos_active": state["sos_active"],
        "last_sos": state["last_sos"],
        "last_location": state["last_location"],
        "trip_active": state["trip_active"],
        "alerts": state["alerts"][:10],
    })


@app.route("/api/start-trip", methods=["POST"])
def start_trip():
    data = request.json or {}
    state["trip_active"] = True
    state["sos_active"] = False
    state["status"] = "safe"
    state["home_base"] = data.get("location")
    add_alert("INFO", "Trip started. Geofence active.")
    return jsonify({"success": True, "message": "Trip started", "home_base": state["home_base"]})


@app.route("/api/end-trip", methods=["POST"])
def end_trip():
    state["trip_active"] = False
    state["sos_active"] = False
    state["status"] = "safe"
    add_alert("INFO", "Trip ended safely ✅")
    return jsonify({"success": True, "message": "Trip ended"})


@app.route("/api/location", methods=["POST"])
def update_location():
    """Receives live GPS coordinates from mobile app."""
    data = request.json or {}
    loc = data.get("location")
    if not loc or len(loc) < 2:
        return jsonify({"error": "Invalid location"}), 400

    state["last_location"] = loc

    # Geofence check
    if state["trip_active"] and state["home_base"]:
        dist = haversine(loc[0], loc[1], state["home_base"][0], state["home_base"][1])
        if dist > SAFE_RADIUS and state["status"] != "sos":
            state["status"] = "alert"
            add_alert("⚠️ ALERT", f"Geofence breached! {round(dist)}m from safe zone", loc)

    return jsonify({
        "success": True,
        "status": state["status"],
        "location": loc,
    })


@app.route("/api/sos", methods=["POST"])
def trigger_sos():
    """SOS trigger from user app or AI voice module."""
    data = request.json or {}
    reason = data.get("reason", "SOS triggered")
    location = data.get("location") or state["last_location"]
    time = data.get("time", datetime.now().isoformat())

    state["sos_active"] = True
    state["status"] = "sos"
    state["last_sos"] = {
        "reason": reason,
        "location": location,
        "time": time,
    }

    alert = add_alert("🚨 SOS", reason, location)

    print(f"\n{'='*50}")
    print(f"🚨 SOS TRIGGERED!")
    print(f"   Reason  : {reason}")
    print(f"   Location: {location}")
    print(f"   Time    : {time}")
    print(f"{'='*50}\n")

    return jsonify({
        "success": True,
        "message": "SOS received. Alerting guardians.",
        "sos_id": alert["id"],
    })


@app.route("/api/voice-alert", methods=["POST"])
def voice_alert():
    """Receives AI voice detection results from Python AI module."""
    data = request.json or {}
    keyword = data.get("keyword", "unknown")
    transcript = data.get("transcript", "")

    reason = f"Voice keyword detected: '{keyword}' | Transcript: '{transcript[:80]}'"
    return trigger_sos_internal(reason, state["last_location"])


def trigger_sos_internal(reason, location):
    state["sos_active"] = True
    state["status"] = "sos"
    state["last_sos"] = {"reason": reason, "location": location, "time": datetime.now().isoformat()}
    add_alert("🚨 SOS", reason, location)
    return jsonify({"success": True, "message": "SOS triggered by AI module"})


@app.route("/api/reset", methods=["POST"])
def reset():
    state["sos_active"] = False
    state["status"] = "safe"
    state["last_sos"] = None
    add_alert("INFO", "Status reset by guardian ✅")
    return jsonify({"success": True})


@app.route("/api/alerts")
def get_alerts():
    return jsonify({"alerts": state["alerts"]})


if __name__ == "__main__":
    print("\n🛡️  SafeTrac AI Backend Starting...")
    print("   Team     : Chai or Code ☕")
    print("   Hackathon: Elite Her 2026")
    print("   API      : http://localhost:5000\n")
    app.run(debug=True, port=5000, host="0.0.0.0")
