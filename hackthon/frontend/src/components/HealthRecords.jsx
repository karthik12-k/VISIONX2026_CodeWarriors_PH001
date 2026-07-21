import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

function HealthRecords({ t }) {
    const [records, setRecords] = useState([])

    useEffect(() => {
        const fetchLocalRecords = () => {
            const voiceRecords = JSON.parse(localStorage.getItem('janrakshak_records') || '[]').map(r => ({ ...r, type: 'Voice AI' }))
            const screenRecords = JSON.parse(localStorage.getItem('janrakshak_history') || '[]').map(r => ({ ...r, type: 'Health Screening' }))
            const all = [...voiceRecords, ...screenRecords].sort((a,b) => new Date(b.date) - new Date(a.date))
            setRecords(all)
        }

        fetchLocalRecords()
        const interval = setInterval(fetchLocalRecords, 5000) // Poll LocalStorage for UI updates
        return () => clearInterval(interval)
    }, [])

    const clearRecords = () => {
        if (window.confirm("Are you sure you want to clear all local health records?")) {
            localStorage.removeItem('janrakshak_records')
            localStorage.removeItem('janrakshak_history')
            setRecords([])
        }
    }

    const handleSync = async (record) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record.patient),
            })
            const data = await response.json()
            
            // Update local storage
            const history = JSON.parse(localStorage.getItem('janrakshak_history') || '[]')
            const updatedHistory = history.map(h => {
                if (h.date === record.date) {
                    return { ...data, date: h.date, patient: h.patient }
                }
                return h
            })
            localStorage.setItem('janrakshak_history', JSON.stringify(updatedHistory))
            
            // Refresh view
            const screenRecords = updatedHistory.map(r => ({ ...r, type: 'Health Screening' }))
            const voiceRecords = JSON.parse(localStorage.getItem('janrakshak_records') || '[]').map(r => ({ ...r, type: 'Voice AI' }))
            setRecords([...voiceRecords, ...screenRecords].sort((a,b) => new Date(b.date) - new Date(a.date)))
            
            alert('✅ Record Synced Successfully with AI Backend!')
        } catch (error) {
            alert('❌ Sync Failed: Backend still unreachable. Please check your connection.')
        }
    }

    return (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>📁 Offline Health Records</h2>
                <button onClick={clearRecords} className="btn" style={{ background: '#e63946', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>🗑️ Clear Records</button>
            </div>
            
            <p style={{ opacity: 0.8, marginBottom: '2rem' }}>All patient records are stored locally on this device for privacy and offline access.</p>

            {records.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <h3>No Records Found</h3>
                    <p>Start a health screening or voice check to generate local records.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {records.map((r, i) => (
                        <div key={i} style={{ background: 'white', padding: '1.2rem', borderRadius: '12px', border: '1px solid #d8f3dc', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '0.8rem', marginBottom: '0.8rem' }}>
                                <span style={{ fontWeight: 'bold', color: '#1b4332' }}>Date: {new Date(r.date).toLocaleString()}</span>
                                <span className="badge" style={{ background: r.type === 'Voice AI' ? '#4361ee' : '#2d6a4f', color: '#fff' }}>{r.type}</span>
                            </div>
                            
                            {r.type === 'Voice AI' ? (
                                <>
                                    <div style={{ marginBottom: '0.8rem' }}>
                                        <strong style={{ color: '#555', fontSize: '0.9rem' }}>Symptoms Checked:</strong>
                                        <p style={{ fontStyle: 'italic', background: '#f8f9fa', padding: '0.5rem', borderRadius: '6px', marginTop: '0.3rem', fontSize: '0.95rem' }}>"{r.symptoms}"</p>
                                    </div>
                                    <div>
                                        <strong style={{ color: '#555', fontSize: '0.9rem' }}>Diagnosis:</strong>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {r.diagnosis && r.diagnosis.map((d, idx) => (
                                                <div key={idx} style={{ background: d.triage === 'High' ? '#ffebee' : '#e8f5e9', border: `1px solid ${d.triage === 'High' ? '#ffcdd2' : '#c8e6c9'}`, padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem' }}>
                                                    <strong>{d.name}</strong> ({d.triage})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                                        {['heart', 'diabetes', 'anemia'].map(key => r[key] && (
                                            <div key={key} style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: r[key].color + '15', border: `1px solid ${r[key].color}40`, flex: 1, minWidth: '140px' }}>
                                                <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>{key}</strong>
                                                <div style={{ color: r[key].color, fontWeight: '800' }}>{r[key].level} ({r[key].percent}%)</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#555', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <strong>Overall:</strong> <span style={{ color: r.overall_color === 'red' ? '#e63946' : '#2d6a4f', fontWeight: 'bold' }}>{r.overall_status}</span>
                                            {r.status === 'pending' && <span style={{ marginLeft: '10px', color: '#f4a261', fontWeight: 'bold' }}>⏳ SYNC PENDING</span>}
                                        </div>
                                        {r.status === 'pending' && (
                                            <button 
                                                onClick={() => handleSync(r)}
                                                className="btn" 
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#2d6a4f' }}
                                            >
                                                🔄 Sync Now
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default HealthRecords
