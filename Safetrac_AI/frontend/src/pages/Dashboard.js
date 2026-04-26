import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import './Dashboard.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom user icon
const userIcon = new L.DivIcon({
  html: `<div class="user-marker"><div class="user-marker-inner">👩</div><div class="user-marker-pulse"></div></div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Custom SOS icon
const sosIcon = new L.DivIcon({
  html: `<div class="sos-marker">🚨</div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Recenter map on location change
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 15); }, [position, map]);
  return null;
}

const STRESS_KEYWORDS = ['help', 'danger', 'leave me alone', 'stop', 'bachao', 'chodo', 'madad', 'emergency', 'sos', 'scared'];
const SAFE_RADIUS = 300; // meters

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function Dashboard({ onBack }) {
  const [position, setPosition] = useState(null);
  const [homeBase, setHomeBase] = useState(null);
  const [status, setStatus] = useState('safe'); // 'safe' | 'alert' | 'sos'
  const [alerts, setAlerts] = useState([]);
  const [tripActive, setTripActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [distance, setDistance] = useState(0);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [notifPermission, setNotifPermission] = useState(false);
  const recognitionRef = useRef(null);
  const watchRef = useRef(null);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(p => setNotifPermission(p === 'granted'));
    }
  }, []);

  // Get location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setPosition(loc);
        setHomeBase(loc);
      },
      () => {
        // Fallback: Delhi coords for demo
        const demo = [28.6139, 77.2090];
        setPosition(demo);
        setHomeBase(demo);
      }
    );
  }, []);

  const addAlert = useCallback((type, message) => {
    const alert = { id: Date.now(), type, message, time: new Date().toLocaleTimeString() };
    setAlerts(prev => [alert, ...prev].slice(0, 10));
    // Browser notification
    if (notifPermission) new Notification(`SafeTrac AI — ${type}`, { body: message, icon: '🛡️' });
  }, [notifPermission]);

  // Start trip
  const startTrip = () => {
    setTripActive(true);
    setStatus('safe');
    setSosTriggered(false);
    addAlert('INFO', 'Trip started. Geofence active — radius 300m');

    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const loc = [pos.coords.latitude, pos.coords.longitude];
        setPosition(loc);
        if (homeBase) {
          const dist = getDistance(loc[0], loc[1], homeBase[0], homeBase[1]);
          setDistance(Math.round(dist));
          if (dist > SAFE_RADIUS && status !== 'sos') {
            setStatus('alert');
            addAlert('⚠️ ALERT', `Geofence breached! ${Math.round(dist)}m from safe zone`);
          }
        }
      },
      () => {
        // Simulate movement for demo
        if (homeBase) {
          const jitter = (Math.random() - 0.5) * 0.005;
          setPosition([homeBase[0] + jitter, homeBase[1] + jitter]);
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  const endTrip = () => {
    setTripActive(false);
    setStatus('safe');
    setListening(false);
    setSosTriggered(false);
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    if (recognitionRef.current) recognitionRef.current.stop();
    addAlert('INFO', 'Trip ended safely ✅');
  };

  // Voice detection
  const startVoiceDetection = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addAlert('INFO', 'Voice detection: use Chrome browser for best support');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ').toLowerCase();
      setTranscript(text);
      const found = STRESS_KEYWORDS.find(kw => text.includes(kw));
      if (found) triggerSOS(`Voice keyword detected: "${found}"`);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => { if (listening) recognition.start(); };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    addAlert('INFO', 'AI voice detection active 🎙️');
  };

  const stopVoice = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
    setTranscript('');
  };

  // SOS trigger
  const triggerSOS = useCallback((reason = 'Manual SOS activated') => {
    if (sosTriggered) return;
    setSosTriggered(true);
    setStatus('sos');
    addAlert('🚨 SOS', reason);

    // Send to backend
    fetch('http://localhost:5000/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, location: position, time: new Date().toISOString() }),
    }).catch(() => {}); // Silently fail if backend not running
  }, [sosTriggered, position, addAlert]);

  const statusConfig = {
    safe:  { color: '#10B981', label: '🟢 SAFE', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)' },
    alert: { color: '#F59E0B', label: '🟡 ALERT', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)' },
    sos:   { color: '#EF4444', label: '🔴 SOS ACTIVE', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)' },
  };
  const sc = statusConfig[status];

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="logo">🛡️ SafeTrac AI</div>
        <div className="header-badge">User Dashboard</div>
      </header>

      <div className="dash-body">
        {/* Left Panel */}
        <aside className="left-panel">
          {/* Status Card */}
          <div className="status-card" style={{ background: sc.bg, borderColor: sc.border }}>
            <div className="status-label" style={{ color: sc.color }}>{sc.label}</div>
            {tripActive && <div className="status-dist">{distance}m from safe zone</div>}
            {!tripActive && <div className="status-dist">Start a trip to activate tracking</div>}
          </div>

          {/* Trip Control */}
          <div className="panel-card">
            <h3>🗺️ Trip Control</h3>
            {!tripActive ? (
              <button className="big-btn btn-start" onClick={startTrip} disabled={!position}>
                ▶ Start Trip
              </button>
            ) : (
              <button className="big-btn btn-end" onClick={endTrip}>
                ■ End Trip
              </button>
            )}
          </div>

          {/* Voice Detection */}
          <div className="panel-card">
            <h3>🎙️ AI Voice Detection</h3>
            <p className="panel-desc">Detects stress keywords in Hindi & English</p>
            {!listening ? (
              <button className="big-btn btn-voice" onClick={startVoiceDetection} disabled={!tripActive}>
                🎙️ Start Listening
              </button>
            ) : (
              <button className="big-btn btn-voice-stop" onClick={stopVoice}>
                ⏹ Stop Listening
              </button>
            )}
            {listening && (
              <div className="transcript-box">
                <div className="listening-dot" />
                <span>{transcript || 'Listening...'}</span>
              </div>
            )}
            <div className="keywords-list">
              Keywords: {STRESS_KEYWORDS.slice(0,5).join(', ')}...
            </div>
          </div>

          {/* SOS Button */}
          <button
            className={`sos-btn ${sosTriggered ? 'sos-active' : ''}`}
            onClick={() => triggerSOS('Manual SOS — user pressed emergency button')}
            disabled={sosTriggered}
          >
            {sosTriggered ? '🚨 SOS SENT' : '🆘 SOS EMERGENCY'}
          </button>
        </aside>

        {/* Map */}
        <main className="map-section">
          <div className="map-header">
            <span>📍 Live Location</span>
            {position && <span className="coords">{position[0].toFixed(4)}, {position[1].toFixed(4)}</span>}
          </div>
          {position ? (
            <MapContainer center={position} zoom={15} className="map-container">
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              <RecenterMap position={position} />
              <Marker position={position} icon={userIcon}>
                <Popup>📍 Your current location</Popup>
              </Marker>
              {homeBase && tripActive && (
                <Circle
                  center={homeBase}
                  radius={SAFE_RADIUS}
                  pathOptions={{ color: status === 'sos' ? '#EF4444' : status === 'alert' ? '#F59E0B' : '#10B981', fillOpacity: 0.08, weight: 2 }}
                />
              )}
              {sosTriggered && position && (
                <Marker position={position} icon={sosIcon}>
                  <Popup>🚨 SOS triggered here</Popup>
                </Marker>
              )}
            </MapContainer>
          ) : (
            <div className="map-loading">
              <div className="spinner" />
              <span>Getting your location...</span>
            </div>
          )}
        </main>

        {/* Alert Feed */}
        <aside className="right-panel">
          <h3>🔔 Alert Feed</h3>
          <div className="alert-feed">
            {alerts.length === 0 && <div className="no-alerts">No alerts yet. Start a trip!</div>}
            {alerts.map(a => (
              <div key={a.id} className={`alert-item alert-${a.type.includes('SOS') ? 'sos' : a.type.includes('ALERT') ? 'warn' : 'info'}`}>
                <div className="alert-type">{a.type}</div>
                <div className="alert-msg">{a.message}</div>
                <div className="alert-time">{a.time}</div>
              </div>
            ))}
          </div>

          {/* Geofence Info */}
          <div className="info-card">
            <h4>📍 Geofence</h4>
            <div className="info-row"><span>Radius</span><span>{SAFE_RADIUS}m</span></div>
            <div className="info-row"><span>Status</span><span style={{color: sc.color}}>{tripActive ? 'Active' : 'Inactive'}</span></div>
            <div className="info-row"><span>Distance</span><span>{distance}m</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
