import React, { useState } from 'react'
import ScreeningTool from './components/ScreeningTool'
import Dashboard from './components/Dashboard'
import Results from './components/Results'
import DiseaseLookup from './components/DiseaseLookup'
import WoundAnalyzer from './components/WoundAnalyzer'
import MaternalHealth from './components/MaternalHealth'
import VoiceSymptomChecker from './components/VoiceSymptomChecker'
import HealthRecords from './components/HealthRecords'
import EmergencyAlert from './components/EmergencyAlert'
import { translations } from './translations'

function App() {
  const [lang, setLang] = React.useState('en')
  const t = translations[lang]
  const [view, setView] = React.useState('home')
  const [predictionData, setPredictionData] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  // --- Background Auto-Sync ---
  React.useEffect(() => {
    const syncProcess = async () => {
      const history = JSON.parse(localStorage.getItem('janrakshak_history') || '[]')
      const pending = history.filter(r => r.status === 'pending')
      
      if (pending.length > 0) {
        console.log(`📡 JanRakshak Sync: Attempting to sync ${pending.length} pending records...`)
        for (const record of pending) {
          await attemptAutoSync(record)
        }
      }
    }

    const interval = setInterval(syncProcess, 10000) // Check every 10s
    return () => clearInterval(interval)
  }, [])

  const attemptAutoSync = async (record) => {
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record.patient),
      })
      
      if (response.ok) {
        const data = await response.json()
        const history = JSON.parse(localStorage.getItem('janrakshak_history') || '[]')
        const updatedHistory = history.map(h => {
          if (h.date === record.date) {
            // Merge AI results & remove pending status
            return { ...data, date: h.date, patient: h.patient, status: 'synced' }
          }
          return h
        })
        localStorage.setItem('janrakshak_history', JSON.stringify(updatedHistory))
        console.log(`✅ JanRakshak Sync: Record from ${new Date(record.date).toLocaleTimeString()} synced.`)
      }
    } catch (e) {
      // Background fail is silent - it will retry next interval
    }
  }

    const calculateOfflineRisk = (data) => {
      const age = parseFloat(data.age || 0)
      const weight = parseFloat(data.weight || 0)
      const systolic = parseFloat(data.systolic || 0)
      const diastolic = parseFloat(data.diastolic || 0)
      const glucose = parseFloat(data.glucose || 0)
      const hemoglobin = parseFloat(data.hemoglobin || 0)

      // Heart Risk Logic
      let heartScore = 10
      if (systolic > 140) heartScore += 30
      if (diastolic > 90) heartScore += 20
      if (age > 50) heartScore += 15
      heartScore = Math.min(heartScore, 95)
      const heartLevel = heartScore > 70 ? "High" : (heartScore > 40 ? "Moderate" : "Low")
      const heartColor = heartScore > 70 ? "red" : (heartScore > 40 ? "yellow" : "green")

      // Diabetes Logic
      let diabetesScore = 15
      if (glucose > 140) diabetesScore += 40
      if (glucose > 180) diabetesScore += 30
      if (weight > 80) diabetesScore += 10
      if (weight > 100) diabetesScore += 10
      diabetesScore = Math.min(diabetesScore, 95)
      const diabetesLevel = diabetesScore > 70 ? "High" : (diabetesScore > 40 ? "Moderate" : "Low")
      const diabetesColor = diabetesScore > 70 ? "red" : (diabetesScore > 40 ? "yellow" : "green")

      // Anemia Logic
      let anemiaScore = 10
      if (hemoglobin < 12) anemiaScore += 40
      if (hemoglobin < 10) anemiaScore += 40
      anemiaScore = Math.min(anemiaScore, 95)
      const anemiaLevel = anemiaScore > 70 ? "High" : (anemiaScore > 40 ? "Moderate" : "Low")
      const anemiaColor = anemiaScore > 70 ? "red" : (anemiaScore > 40 ? "yellow" : "green")

      return {
        heart: { level: heartLevel, percent: heartScore, color: heartColor, why: `Offline: Based on BP ${systolic}/${diastolic} and age ${age}.` },
        diabetes: { level: diabetesLevel, percent: diabetesScore, color: diabetesColor, why: `Offline: Based on Glucose ${glucose}mg/dL.` },
        anemia: { level: anemiaLevel, percent: anemiaScore, color: anemiaColor, why: `Offline: Based on Hb ${hemoglobin}g/dL.` },
        overall_status: (heartLevel === "High" || diabetesLevel === "High" || anemiaLevel === "High") ? "Critical" : "Stable",
        overall_color: (heartLevel === "High" || diabetesLevel === "High" || anemiaLevel === "High") ? "red" : "green",
        recommendations: ["OFFLINE MODE: AI Prediction based on local clinical rules.", "Connect to internet for full Gemini Vision analysis."],
        prescriptions: [],
        hospitals: [],
        nutrition: [],
        schemes: [],
        isOffline: true
      }
    }

    const handlePredict = async (formData) => {
      setLoading(true)
      try {
        const response = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await response.json()
        setPredictionData(data)
        setView('results')

        const history = JSON.parse(localStorage.getItem('janrakshak_history') || '[]')
        history.unshift({ ...data, date: new Date().toISOString(), patient: formData, status: 'synced' })
        localStorage.setItem('janrakshak_history', JSON.stringify(history.slice(0, 50)))

      } catch (error) {
        console.error('Error fetching prediction:', error)
        // Advanced Local CDSS Fallback
        const offlineResult = calculateOfflineRisk(formData)
        
        const history = JSON.parse(localStorage.getItem('janrakshak_history') || '[]')
        history.unshift({ ...offlineResult, date: new Date().toISOString(), patient: formData, status: 'pending' })
        localStorage.setItem('janrakshak_history', JSON.stringify(history.slice(0, 50)))
        
        setPredictionData(offlineResult)
        setView('results')
        alert('Offline Mode: Using local clinical scoring. Data will sync when online.')
      } finally {
        setLoading(false)
      }
    }

  return (
    <div className="App" style={{
      minHeight: '100vh',
      background: '#041c12', /* Deep medical theme base */
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <style>{`
        /* Multi-Color Mesh Animation */
        .App-Background {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 0;
          background: 
            radial-gradient(circle at 10% 10%, rgba(45, 106, 79, 0.45) 0%, transparent 50%),
            radial-gradient(circle at 90% 10%, rgba(13, 148, 136, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.3) 0%, transparent 60%),
            radial-gradient(circle at 10% 90%, rgba(99, 102, 241, 0.35) 0%, transparent 50%),
            radial-gradient(circle at 90% 90%, rgba(168, 85, 247, 0.3) 0%, transparent 50%);
          background-color: #f0fdf4;
          animation: bgShift 20s linear infinite alternate;
        }
        @keyframes bgShift {
          0% { filter: hue-rotate(0deg) contrast(1.1); }
          100% { filter: hue-rotate(30deg) contrast(1.2); }
        }
        
        /* Floating Geometric Design Elements */
        .design-blob {
          position: absolute;
          filter: blur(80px);
          opacity: 0.6;
          border-radius: 50%;
          animation: blobFloat 25s ease-in-out infinite alternate;
        }
        .blob1 { width: 500px; height: 500px; background: #6ee7b7; top: -10%; left: -5%; }
        .blob2 { width: 400px; height: 400px; background: #38bdf8; bottom: 5%; right: -5%; animation-delay: -5s; }
        .blob3 { width: 350px; height: 350px; background: #c084fc; top: 40%; left: 60%; animation-delay: -10s; }
        
        /* Animated Geometric Tech Pulse Line */
        .tech-line {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-linear-gradient(45deg, rgba(45,106,79,0.03) 0px, rgba(45,106,79,0.03) 1px, transparent 1px, transparent 40px);
          pointer-events: none;
          z-index: 1;
        }

        @keyframes blobFloat {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          50% { transform: translate(100px, 50px) scale(1.1) rotate(90deg); }
          100% { transform: translate(-50px, -80px) scale(0.9) rotate(-45deg); }
        }
      `}</style>

      {/* Background & Designs Layer */}
      <div className="App-Background"></div>
      <div className="tech-line"></div>
      <div className="design-blob blob1"></div>
      <div className="design-blob blob2"></div>
      <div className="design-blob blob3"></div>

      <nav style={{ position: 'relative', zIndex: 10 }}>
        <div className="logo">🌱 {t.title}</div>
        <div className="nav-links">
          <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--primary)', background: 'white', fontWeight: 'bold' }}>
            <option value="en">English (Global)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="mr">मराठी (Marathi)</option>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="or">ଓଡ଼ିଆ (Odia)</option>
            <option value="gu">ગુજરાતી (Gujarati)</option>
            <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
          </select>
          <button onClick={() => setView('home')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>{t.home}</button>
          <button onClick={() => setView('dashboard')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>{t.dashboard}</button>
          <button onClick={() => setView('voiceCheck')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>{t.voice_ai}</button>
          <button onClick={() => setView('records')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>{t.records}</button>
          <button onClick={() => setView('lookup')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>{t.medicine}</button>
          <button onClick={() => setView('woundScan')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>{t.wound}</button>
          <button onClick={() => setView('maternal')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>{t.maternal}</button>
        </div>
      </nav>

      <main className="container">
        {view === 'home' && (
          <div className="hero">
            <h1 style={{ fontSize: '3.5rem', marginBottom: '1.2rem', color: '#1b4332' }}>{t.title} — {t.tagline}</h1>
            <p style={{ fontSize: '1.2rem', color: '#555', marginBottom: '2rem' }}>{t.description}</p>
            <button className="btn" onClick={() => setView('screening')}>{t.start_screening}</button>
          </div>
        )}

        {view === 'screening' && (
          <ScreeningTool onPredict={handlePredict} loading={loading} t={t} onCancel={() => setView('home')} />
        )}

        {view === 'results' && predictionData && (
          <Results data={predictionData} t={t} onBack={() => setView('screening')} />
        )}

        {view === 'dashboard' && (
          <Dashboard t={t} />
        )}

        {view === 'lookup' && (
          <DiseaseLookup t={t} />
        )}

        {view === 'woundScan' && (
          <WoundAnalyzer t={t} />
        )}

        {view === 'maternal' && (
          <MaternalHealth t={t} />
        )}

        {view === 'voiceCheck' && (
          <VoiceSymptomChecker t={t} />
        )}

        {view === 'records' && (
          <HealthRecords t={t} />
        )}
      </main>

      {/* Floating Emergency SOS */}
      <EmergencyAlert />

      <footer style={{ textAlign: 'center', padding: '2rem', color: '#777', marginTop: 'auto' }}>
        &copy; 2026 JanRakshak AI. Designed for Rural Empowerment.
      </footer>
    </div>
  )
}

export default App
