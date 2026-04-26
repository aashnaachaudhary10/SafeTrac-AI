import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import './GuardianView.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const trackedIcon = new L.DivIcon({
  html: `<div class="tracked-marker">👩</div>`,
  className: '',
  iconSize: [35, 35],
  iconAnchor: [17, 17],
});

// Simulated demo data
const DEMO_PERSON = { name: 'Priya Sharma', phone: '+91 98765 43210', relation: 'Daughter' };
const DEMO_POSITION = [28.6139, 77.2090];

export default function GuardianView({ onBack }) {
  const [status, setStatus] = useState('safe');
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'INFO', message: 'Trip started from home', time: '10:32 AM' },
    { id: 2, type: 'INFO', message: 'AI voice detection active', time: '10:33 AM' },
  ]);
  const [position, setPosition] = useState(DEMO_POSITION);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [simulateMode, setSimulateMode] = useState(false);

  // Demo: simulate SOS
  const simulateSOS = () => {
    setStatus('sos');
    const newAlert = { id: Date.now(), type: '🚨 SOS', message: 'SOS triggered! Voice keyword "help" detected', time: new Date().toLocaleTimeString() };
    setAlerts(prev => [newAlert, ...prev]);
    setPosition([DEMO_POSITION[0] + 0.002, DEMO_POSITION[1] + 0.001]);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const simulateAlert = () => {
    setStatus('alert');
    const newAlert = { id: Date.now(), type: '⚠️ ALERT', message: 'Geofence breached — 350m from safe zone', time: new Date().toLocaleTimeString() };
    setAlerts(prev => [newAlert, ...prev]);
    setPosition([DEMO_POSITION[0] + 0.003, DEMO_POSITION[1] - 0.002]);
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const resetDemo = () => {
    setStatus('safe');
    setPosition(DEMO_POSITION);
    setLastUpdate(new Date().toLocaleTimeString());
    setAlerts(prev => [{ id: Date.now(), type: 'INFO', message: 'Status reset — all clear ✅', time: new Date().toLocaleTimeString() }, ...prev]);
  };

  // Poll backend for real SOS events
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:5000/api/status');
        const data = await res.json();
        if (data.sos_active) {
          setStatus('sos');
          setAlerts(prev => [{ id: Date.now(), type: '🚨 SOS', message: data.last_sos?.reason || 'SOS received from backend', time: new Date().toLocaleTimeString() }, ...prev]);
          if (data.last_sos?.location) setPosition(data.last_sos.location);
        }
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (e) { /* backend not running, demo mode */ }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const sc = {
    safe:  { color: '#10B981', label: '🟢 SAFE', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
    alert: { color: '#F59E0B', label: '🟡 GEOFENCE ALERT', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
    sos:   { color: '#EF4444', label: '🔴 SOS EMERGENCY', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.4)' },
  }[status];

  return (
    <div className="guardian">
      <header className="guard-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="logo">🛡️ SafeTrac AI — Guardian Dashboard</div>
        <div className="last-update">Updated: {lastUpdate}</div>
      </header>

      <div className="guard-body">
        {/* Person Info */}
        <aside className="guard-left">
          <div className="person-card">
            <div className="person-avatar">👩</div>
            <div className="person-info">
              <div className="person-name">{DEMO_PERSON.name}</div>
              <div className="person-rel">{DEMO_PERSON.relation}</div>
              <div className="person-phone">{DEMO_PERSON.phone}</div>
            </div>
          </div>

          {/* Status */}
          <div className="guard-status" style={{ background: sc.bg, borderColor: sc.border }}>
            <div className="guard-status-label" style={{ color: sc.color }}>{sc.label}</div>
            <div className="guard-status-sub">Last updated: {lastUpdate}</div>
          </div>

          {/* Location info */}
          <div className="location-card">
            <h4>📍 Current Location</h4>
            <div className="loc-coords">{position[0].toFixed(5)}, {position[1].toFixed(5)}</div>
            <div className="loc-area">New Delhi, India</div>
          </div>

          {/* Demo controls */}
          <div className="demo-controls">
            <h4>🎬 Demo Simulator</h4>
            <p>Simulate scenarios for demo:</p>
            <button className="demo-btn btn-sos-sim" onClick={simulateSOS}>🚨 Simulate SOS</button>
            <button className="demo-btn btn-alert-sim" onClick={simulateAlert}>⚠️ Simulate Alert</button>
            <button className="demo-btn btn-reset-sim" onClick={resetDemo}>✅ Reset to Safe</button>
          </div>

          {/* Contact */}
          <div className="contact-card">
            <h4>📞 Emergency Contacts</h4>
            <div className="contact-item">
              <span>🚔 Police</span><span>100</span>
            </div>
            <div className="contact-item">
              <span>🚑 Ambulance</span><span>108</span>
            </div>
            <div className="contact-item">
              <span>👩 Women Helpline</span><span>1091</span>
            </div>
          </div>
        </aside>

        {/* Map */}
        <main className="guard-map-section">
          <div className="map-header">
            <span>📍 Live Tracking Map</span>
            {status === 'sos' && <span className="sos-badge">🚨 SOS ACTIVE</span>}
          </div>
          <MapContainer center={position} zoom={15} className="map-container">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <Marker position={position} icon={trackedIcon}>
              <Popup>📍 {DEMO_PERSON.name}</Popup>
            </Marker>
            <Circle
              center={DEMO_POSITION}
              radius={300}
              pathOptions={{ color: status === 'sos' ? '#EF4444' : status === 'alert' ? '#F59E0B' : '#10B981', fillOpacity: 0.06, weight: 2, dashArray: '6 4' }}
            />
          </MapContainer>
        </main>

        {/* Alert Feed */}
        <aside className="guard-right">
          <h3>🔔 Live Alert Feed</h3>
          <div className="alert-feed">
            {alerts.map(a => (
              <div key={a.id} className={`alert-item alert-${a.type.includes('SOS') ? 'sos' : a.type.includes('ALERT') ? 'warn' : 'info'}`}>
                <div className="alert-type">{a.type}</div>
                <div className="alert-msg">{a.message}</div>
                <div className="alert-time">{a.time}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
