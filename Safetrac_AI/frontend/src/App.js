import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import GuardianView from './pages/GuardianView';
import LandingPage from './pages/LandingPage';
import './App.css';

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'user' | 'guardian'

  return (
    <div className="app">
      {view === 'landing' && <LandingPage onSelectView={setView} />}
      {view === 'user' && <Dashboard onBack={() => setView('landing')} />}
      {view === 'guardian' && <GuardianView onBack={() => setView('landing')} />}
    </div>
  );
}

export default App;
