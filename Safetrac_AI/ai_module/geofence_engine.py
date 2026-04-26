"""
SafeTrac AI — Geofence Engine
Standalone geofence checker — can be run independently to test logic
"""

import math
import json
from datetime import datetime


SAFE_RADIUS_METERS = 300


def haversine(lat1, lon1, lat2, lon2):
    """Returns distance in meters between two GPS points."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def check_geofence(current_lat, current_lon, home_lat, home_lon, radius=SAFE_RADIUS_METERS):
    """
    Returns:
        dict with status, distance, and breach info
    """
    dist = haversine(current_lat, current_lon, home_lat, home_lon)
    breached = dist > radius

    return {
        "status": "breach" if breached else "safe",
        "distance_m": round(dist, 2),
        "radius_m": radius,
        "breached": breached,
        "timestamp": datetime.now().isoformat(),
        "message": (
            f"⚠️ GEOFENCE BREACHED — {round(dist)}m from safe zone ({radius}m limit)"
            if breached
            else f"✅ Within safe zone — {round(dist)}m from home base"
        )
    }


def demo():
    """Demo: test geofence logic with sample coordinates."""
    home = (28.6139, 77.2090)  # New Delhi

    test_points = [
        (28.6139, 77.2090, "At home"),
        (28.6145, 77.2095, "100m away"),
        (28.6160, 77.2110, "~280m away"),
        (28.6175, 77.2130, "~450m away — BREACH"),
        (28.6200, 77.2160, "~800m away — BREACH"),
    ]

    print("\n🛡️  SafeTrac AI — Geofence Engine Demo")
    print(f"   Home Base: {home}")
    print(f"   Safe Radius: {SAFE_RADIUS_METERS}m\n")

    for lat, lon, label in test_points:
        result = check_geofence(lat, lon, home[0], home[1])
        icon = "🚨" if result["breached"] else "✅"
        print(f"  {icon} {label}")
        print(f"     Distance: {result['distance_m']}m | Status: {result['status'].upper()}")
        print(f"     {result['message']}\n")


if __name__ == "__main__":
    demo()
