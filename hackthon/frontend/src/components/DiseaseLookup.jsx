import React, { useState } from 'react'
import { API_BASE_URL } from '../config'

const QUICK_SEARCHES = [
    'Fever', 'Diabetes', 'Typhoid', 'Malaria', 'Cold', 'Cough',
    'Hypertension', 'Anemia', 'Asthma', 'Dengue', 'Acidity',
    'Diarrhea', 'Headache', 'Allergy', 'UTI', 'Tuberculosis',
    'Joint Pain', 'Skin Infection', 'Vitamin D Deficiency', 'Heart'
]

function DiseaseLookup({ t }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const search = async (searchQuery) => {
        const q = searchQuery || query
        if (!q.trim()) return
        setLoading(true)
        setResults([])
        setSuggestions([])
        setError('')
        try {
            const res = await fetch(`${API_BASE_URL}/api/disease-lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disease: q })
            })
            const data = await res.json()
            if (data.found && data.results) {
                setResults(data.results)
            } else {
                setSuggestions(data.suggestions || [])
                setError(`No results found for "${q}". Try one of these:`)
            }
        } catch {
            setError('Could not reach server. Please make sure the backend is running.')
        } finally {
            setLoading(false)
        }
    }

    const handleQuick = (name) => {
        setQuery(name)
        search(name.toLowerCase())
    }

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            {/* Header omitted for brevity in replacement, but I must keep it correctly */}
            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 2rem 1.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💊</div>
                <h2 style={{ margin: 0 }}>Disease → Medicine Lookup</h2>
                <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                    Enter any disease or symptom to get tablet names, brand names, dosage &amp; home remedies
                </p>

                {/* Search bar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', maxWidth: '600px', margin: '1.5rem auto 0' }}>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && search()}
                        placeholder="e.g. fever, typhoid, diabetes, high BP..."
                        style={{ flex: 1, padding: '0.9rem 1.2rem', borderRadius: '12px', border: '2px solid var(--primary)', fontSize: '1rem', outline: 'none' }}
                    />
                    <button
                        className="btn"
                        onClick={() => search()}
                        disabled={loading}
                        style={{ padding: '0.9rem 1.5rem', fontSize: '1rem', minWidth: '100px' }}
                    >
                        {loading ? '⏳' : '🔍 Search'}
                    </button>
                </div>

                {/* Quick search chips */}
                <div style={{ marginTop: '1.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                    {QUICK_SEARCHES.map(name => (
                        <button
                            key={name}
                            onClick={() => handleQuick(name)}
                            style={{
                                background: query.toLowerCase() === name.toLowerCase() ? 'var(--primary)' : 'rgba(45,106,79,0.08)',
                                color: query.toLowerCase() === name.toLowerCase() ? '#fff' : 'var(--primary)',
                                border: '1px solid rgba(45,106,79,0.3)',
                                borderRadius: '20px',
                                padding: '4px 14px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <div style={{ background: 'rgba(255,193,7,0.12)', border: '1px solid #ffc107', borderRadius: '12px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#856404' }}>
                ⚠️ <strong>Disclaimer:</strong> This is for informational purposes only. Always consult a registered medical practitioner before taking any medicine.
            </div>

            {/* Error / not found */}
            {error && (
                <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <p style={{ color: '#e63946', marginBottom: '1rem' }}>❌ {error}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                        {suggestions.map(s => (
                            <button key={s} onClick={() => handleQuick(s)} className="btn" style={{ fontSize: '0.8rem', padding: '4px 14px', background: 'var(--secondary)', color: 'var(--primary)' }}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && results.map((result, idx) => (
                <div key={idx} className="glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                        <div>
                            <h3 style={{ margin: 0 }}>🏥 {result.display}</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>{result.medicines.length} medicine(s) found</p>
                        </div>
                        <button className="btn" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }} onClick={() => window.print()}>
                            🖨️ Print
                        </button>
                    </div>

                    {/* ── Medicines Table ── */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(45,106,79,0.08)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.7rem', borderBottom: '2px solid #ddd' }}>💊 Medicine (Generic)</th>
                                    <th style={{ padding: '0.7rem', borderBottom: '2px solid #ddd' }}>🏷️ Brand Name</th>
                                    <th style={{ padding: '0.7rem', borderBottom: '2px solid #ddd' }}>Dose</th>
                                    <th style={{ padding: '0.7rem', borderBottom: '2px solid #ddd' }}>Frequency</th>
                                    <th style={{ padding: '0.7rem', borderBottom: '2px solid #ddd' }}>⏱️ Duration</th>
                                    <th style={{ padding: '0.7rem', borderBottom: '2px solid #ddd' }}>⚠️ Warning</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.medicines.map((med, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.5)' }}>
                                        <td style={{ padding: '0.8rem 0.7rem', fontWeight: '700', color: '#1b4332' }}>{med.name}</td>
                                        <td style={{ padding: '0.8rem 0.7rem' }}>
                                            {med.brand && med.brand !== '-'
                                                ? <span style={{ background: 'rgba(255,159,28,0.15)', color: '#b5450b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', border: '1px solid rgba(255,159,28,0.35)', whiteSpace: 'nowrap' }}>
                                                    {med.brand}
                                                </span>
                                                : <span style={{ color: '#aaa' }}>-</span>
                                            }
                                        </td>
                                        <td style={{ padding: '0.8rem 0.7rem', fontWeight: '500' }}>{med.dose}</td>
                                        <td style={{ padding: '0.8rem 0.7rem', color: '#2d6a4f', fontWeight: '500' }}>{med.frequency}</td>
                                        <td style={{ padding: '0.8rem 0.7rem' }}>
                                            <span style={{ background: 'rgba(45,106,79,0.1)', color: '#1b4332', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
                                                {med.duration}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.8rem 0.7rem', color: '#856404', fontSize: '0.8rem' }}>{med.warning}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Home Remedies Section ── */}
                    {result.remedies && result.remedies.length > 0 && (
                        <div style={{ marginTop: '1.8rem', borderTop: '2px dashed #a7f3d0', paddingTop: '1.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.4rem' }}>🌿</span>
                                <h4 style={{ margin: 0, color: '#2d6a4f', fontSize: '1rem' }}>Home Remedies &amp; Natural Treatments</h4>
                                <span style={{ fontSize: '0.72rem', background: 'rgba(45,106,79,0.1)', color: '#2d6a4f', padding: '2px 10px', borderRadius: '20px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                    Traditional Indian Medicine
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.75rem' }}>
                                {result.remedies.map((rem, i) => (
                                    <div key={i} style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '0.9rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                            <span style={{ fontSize: '1.4rem' }}>{rem.emoji}</span>
                                            <strong style={{ fontSize: '0.87rem', color: '#065f46' }}>{rem.name}</strong>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#374151', lineHeight: '1.5' }}>{rem.how}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Empty state */}
            {results.length === 0 && !error && !loading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
                    <p>Search for a disease above or click a quick-search button to get started.</p>
                </div>
            )}
        </div>
    )
}

export default DiseaseLookup
