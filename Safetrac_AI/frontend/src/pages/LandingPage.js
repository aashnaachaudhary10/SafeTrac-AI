import React, { useEffect, useState } from 'react';
import './LandingPage.css';

export default function LandingPage({ onSelectView }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <div className={`landing ${visible ? 'visible' : ''}`}>
      {/* Orbs */}
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      <div className="landing-content">
        {/* Badge */}
        <div className="badge">Elite Her Hackathon 2026 · Chai or Code ☕</div>

        {/* Shield Icon */}
        <div className="shield-wrap">
          <div className="shield-ring ring1" />
          <div className="shield-ring ring2" />
          <div className="shield-icon">🛡️</div>
        </div>

        {/* Title */}
        <h1 className="landing-title">
          Safe<span className="grad">Trac</span> AI
        </h1>
        <p className="landing-sub">
          AI-Powered Women's Safety Navigation Platform
        </p>
        <p className="landing-desc">
          Real-time geofencing · AI voice threat detection · Live guardian dashboard
        </p>

        {/* CTA Buttons */}
        <div className="cta-row">
          <button className="btn-primary" onClick={() => onSelectView('user')}>
            <span>🛡️</span> Open Safety Dashboard
          </button>
          <button className="btn-secondary" onClick={() => onSelectView('guardian')}>
            <span>👁️</span> Guardian View
          </button>
        </div>

        {/* Stats */}
        <div className="stat-row">
          <div className="stat"><div className="stat-val">4M+</div><div className="stat-label">Crimes against women/yr</div></div>
          <div className="stat-divider" />
          <div className="stat"><div className="stat-val">&lt;2s</div><div className="stat-label">Alert response time</div></div>
          <div className="stat-divider" />
          <div className="stat"><div className="stat-val">3</div><div className="stat-label">AI safety layers</div></div>
        </div>
      </div>

      <div className="landing-footer">
        Because every woman deserves to come home safe. 🛡️
      </div>
    </div>
  );
}
