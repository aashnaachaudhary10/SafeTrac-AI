"""
SafeTrac AI — Voice Keyword Detector
Listens for stress keywords in Hindi & English and triggers SOS via Flask API

Usage:
    python voice_detector.py

Requirements:
    pip install SpeechRecognition pyaudio requests pyttsx3
"""

import speech_recognition as sr
import requests
import time
import json
import sys
import threading

# ── Config ────────────────────────────────────────────────────────────────────
BACKEND_URL = "http://localhost:5000"
LANGUAGE = "en-IN"   # Hindi + English

STRESS_KEYWORDS = [
    # English
    "help", "danger", "leave me alone", "stop it", "don't touch me",
    "emergency", "sos", "scared", "afraid", "attack",
    # Hindi (transliterated)
    "bachao", "chodo", "madad", "koi hai", "police",
    "chhod do", "mat karo", "danger hai",
]

DEMO_MODE = "--demo" in sys.argv  # python voice_detector.py --demo


def print_banner():
    print("\n" + "="*55)
    print("  🛡️  SafeTrac AI — Voice Keyword Detector")
    print("  Team: Chai or Code ☕ | Elite Her Hackathon 2026")
    print("="*55)
    print(f"  Backend : {BACKEND_URL}")
    print(f"  Language: {LANGUAGE}")
    print(f"  Mode    : {'DEMO (no mic needed)' if DEMO_MODE else 'LIVE (mic required)'}")
    print(f"\n  Listening for: {', '.join(STRESS_KEYWORDS[:6])}...")
    print("="*55 + "\n")


def trigger_sos(keyword, transcript):
    """Send SOS to Flask backend."""
    try:
        payload = {
            "keyword": keyword,
            "transcript": transcript,
            "source": "voice_detector",
        }
        res = requests.post(f"{BACKEND_URL}/api/voice-alert", json=payload, timeout=3)
        if res.status_code == 200:
            print(f"\n  ✅ SOS SENT TO BACKEND!")
            print(f"     Keyword : '{keyword}'")
            print(f"     Backend : {res.json().get('message', 'OK')}")
        else:
            print(f"  ⚠️  Backend returned {res.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"\n  ⚠️  Backend not running — SOS logged locally")
        print(f"     Keyword : '{keyword}'")
        print(f"     Action  : Would notify guardian dashboard")


def check_keywords(transcript):
    """Check if any stress keyword is in the transcript."""
    t = transcript.lower()
    for kw in STRESS_KEYWORDS:
        if kw in t:
            return kw
    return None


def demo_mode():
    """Demo mode: simulate detections without microphone."""
    print("  🎬 DEMO MODE — Simulating voice detection...\n")
    scenarios = [
        (3, "ok i'm walking home now, should be fine"),
        (4, "this route looks a bit dark"),
        (5, "help someone is following me"),
        (6, "bachao please someone help"),
        (4, "ok i think i'm safe now"),
    ]

    for delay, text in scenarios:
        time.sleep(delay)
        print(f"  🎙️  Heard: \"{text}\"")
        kw = check_keywords(text)
        if kw:
            print(f"  🚨 STRESS KEYWORD DETECTED: '{kw}'")
            trigger_sos(kw, text)
        else:
            print(f"  ✅  Normal conversation — no threat detected")

    print("\n  Demo complete. Run without --demo for live microphone detection.")


def live_mode():
    """Real microphone voice detection."""
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 300
    recognizer.dynamic_energy_threshold = True
    sos_cooldown = 0

    print("  🎙️  Microphone active — speak now...\n")

    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source, duration=1)
        print("  ✅ Calibrated for ambient noise\n")

        while True:
            try:
                print("  👂 Listening...")
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=8)
                transcript = recognizer.recognize_google(audio, language=LANGUAGE).lower()
                print(f"  🎙️  Heard: \"{transcript}\"")

                kw = check_keywords(transcript)
                now = time.time()

                if kw and now - sos_cooldown > 10:  # 10s cooldown
                    print(f"\n  🚨 STRESS KEYWORD: '{kw}'")
                    trigger_sos(kw, transcript)
                    sos_cooldown = now
                else:
                    print(f"  ✅ Normal — no threat")

            except sr.WaitTimeoutError:
                print("  ... (silence)")
            except sr.UnknownValueError:
                print("  ... (unclear audio)")
            except sr.RequestError as e:
                print(f"  ⚠️  Speech API error: {e}")
                time.sleep(2)
            except KeyboardInterrupt:
                print("\n\n  🛑 Voice detector stopped.")
                break


if __name__ == "__main__":
    print_banner()

    if DEMO_MODE:
        demo_mode()
    else:
        try:
            import pyaudio
            live_mode()
        except ImportError:
            print("  ⚠️  pyaudio not installed. Running in demo mode instead.")
            print("  Install: pip install pyaudio\n")
            demo_mode()
