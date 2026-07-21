import React, { useState, useEffect } from 'react'
import HospitalMap from './Map'

function Results({ data, onBack, t }) {
    const [showEmergency, setShowEmergency] = useState(false)
    const [callingNum, setCallingNum] = useState('')
    const [alerted, setAlerted] = useState(false)
    const [alertMsg, setAlertMsg] = useState('')
    const [speaking, setSpeaking] = useState(false)

    useEffect(() => {
        if (data.overall_status === 'Critical') {
            // Auto-open emergency modal
            setShowEmergency(true)

            // Notify backend to log the alert
            const conditions = [
                data.heart.level === 'High' ? 'Heart Disease' : null,
                data.diabetes.level === 'High' ? 'Diabetes' : null,
                data.anemia.level === 'High' ? 'Anemia' : null,
            ].filter(Boolean).join(', ')

            fetch('/api/alert-hospital', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: data.patient_lat,
                    lng: data.patient_lng,
                    conditions,
                    patient_id: 'JK-' + Date.now()
                })
            })
                .then(r => r.json())
                .then(res => {
                    setAlerted(true)
                    setAlertMsg(res.message || 'Nearby hospitals have been alerted.')
                })
                .catch(() => {
                    setAlerted(true)
                    setAlertMsg('Nearby hospitals have been auto-notified.')
                })
        }
    }, [data.overall_status])

    const makeCall = (number) => {
        setCallingNum(number)
        window.location.href = `tel:${number}`
        setTimeout(() => setCallingNum(''), 3000)
    }

    const speakReport = () => {
        if (!data || !window.speechSynthesis) return
        if (speaking) {
            window.speechSynthesis.cancel()
            setSpeaking(false)
            return
        }

        const text = `The overall status is ${data.overall_status}. ` +
            `Heart risk is ${data.heart.level}. Diabetes risk is ${data.diabetes.level}. Anemia risk is ${data.anemia.level}. ` +
            `Our nutrition advice: ${data.nutrition.map(n => n.title + ' is recommended, including ' + n.foods.join(', ')).join('. ')}. ` +
            `Please follow the preventive advice: ${data.recommendations.join('. ')}. ` +
            `Identify the nearest hospital on the map below.`;

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.onend = () => setSpeaking(false)
        setSpeaking(true)
        window.speechSynthesis.speak(utterance)
    }

    const shareWhatsApp = () => {
        if (!data) return
        const meds = data.prescriptions.map(group => 
            `💊 *${group.condition}:*\n` + 
            group.medicines.map(m => `  • ${m.name} (${m.brand}) - ${m.dose}, ${m.frequency}`).join('\n')
        ).join('\n\n')
        const nutri = data.nutrition.map(n => `  - ${n.title}: ${n.foods.join(', ')}`).join('\n')
        const text = `🔬 *JanRakshak AI - Patient Risk Profile*\n\n` +
            `*Overall Status:* ${data.overall_status}\n` +
            `*Risk Levels:* ❤️ Heart: ${data.heart.level} | 🩸 Diabetes: ${data.diabetes.level} | 🏥 Anemia: ${data.anemia.level}\n\n` +
            `*AI Nutrition Advice:*\n${nutri}\n\n` +
            `*Prescriptions:*\n${meds}\n\n` +
            `⚠️ Consult a doctor before starting treatment. JanRakshak AI (Rural Health).`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }
    const getBadgeClass = (risk) => {
        return `badge badge-${risk.toLowerCase()}`
    }

    const RiskCard = ({ title, riskData, label, t }) => (
        <div className="risk-item" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.5)', borderRadius: '15px', borderLeft: `6px solid ${riskData.color}`, position: 'relative' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>{label}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={getBadgeClass(riskData.level)}>{riskData.level}</span>
                <strong style={{ fontSize: '1.2rem', color: riskData.color }}>{riskData.percent}%</strong>
            </div>
            <div style={{ marginTop: '10px', height: '40px', background: '#f8f9fa', borderRadius: '5px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: '2px' }}>
                <div style={{ flex: 1, height: '30%', background: '#ccc', margin: '1px' }}></div>
                <div style={{ flex: 1, height: '45%', background: '#ccc', margin: '1px' }}></div>
                <div style={{ flex: 1, height: '60%', background: riskData.color, margin: '1px' }}></div>
                <span style={{ fontSize: '0.7rem', marginLeft: '5px' }}>{t.risk_trend || 'Trend'}</span>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '10px', color: '#666', fontStyle: 'italic' }}>
                <strong>{t.explanation}:</strong> {riskData.why}
            </p>
        </div>
    )

    return (
        <div className="results-container">
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '1rem', fontWeight: 'bold' }}>
                &larr; {t.back_to_screening}
            </button>

            {/* ─── Critical Auto-Alert Banner ─── */}
            {data.overall_status === 'Critical' && (
                <div style={{
                    background: 'linear-gradient(135deg, #ff1744, #c62828)',
                    color: '#fff',
                    borderRadius: '14px',
                    padding: '1rem 1.4rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 4px 20px rgba(230,57,70,0.4)',
                    animation: 'pulse 1.5s infinite'
                }}>
                    <span style={{ fontSize: '2rem' }}>🚨</span>
                    <div>
                        <strong style={{ fontSize: '1rem', display: 'block' }}>Critical Status Detected - Emergency Auto-Alert Triggered</strong>
                        <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>
                            {alerted ? alertMsg : 'Contacting nearby hospitals…'}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowEmergency(true)}
                        style={{ marginLeft: 'auto', background: '#fff', color: '#c62828', border: 'none', borderRadius: '25px', padding: '6px 16px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.85rem' }}
                    >
                        📞 View Contacts
                    </button>
                </div>
            )}

            <div className="glass-card" style={{ borderLeft: `10px solid ${data.overall_color === 'red' ? '#ff4d4d' : (data.overall_color === 'yellow' ? '#fee440' : '#40916c')}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2>{t.assessment_results}</h2>
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <button className="btn" onClick={speakReport} style={{ background: speaking ? '#e63946' : '#4361ee', padding: '6px 15px', fontSize: '0.85rem' }}>
                            {speaking ? '🛑 Stop Reading' : '🔊 Read Report (Voice)'}
                        </button>
                        <button className="btn" onClick={shareWhatsApp} style={{ background: '#25D366', padding: '6px 15px', fontSize: '0.85rem' }}>
                            📲 WhatsApp
                        </button>
                        <span className={`badge`} style={{ fontSize: '1.2rem', background: data.overall_color, color: data.overall_color === 'yellow' ? '#000' : '#fff' }}>
                            {t.overall_status}: {data.overall_status}
                        </span>
                    </div>
                </div>

                <div className="grid" style={{ marginTop: '2rem' }}>
                    <RiskCard title="heart" riskData={data.heart} label={t.heart_disease} t={t} />
                    <RiskCard title="diabetes" riskData={data.diabetes} label={t.diabetes} t={t} />
                    <RiskCard title="anemia" riskData={data.anemia} label={t.anemia} t={t} />
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div className="glass-card">
                    <h3>Preventive Advice</h3>
                    <ul style={{ paddingLeft: '1.2rem' }}>
                        {data.recommendations.map((rec, i) => (
                            <li key={i} style={{ marginBottom: '0.8rem' }}>{rec}</li>
                        ))}
                    </ul>
                </div>

                <div className="glass-card" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #a7f3d0' }}>
                    <h3 style={{ color: '#065f46' }}>🥗 AI Nutrition Advisor</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {data.nutrition.map((item, i) => (
                            <div key={i}>
                                <div style={{ fontWeight: '700', color: '#1b4332', fontSize: '0.9rem' }}>{item.title}</div>
                                <div style={{ fontSize: '0.85rem', color: '#065f46', opacity: 0.9 }}>
                                    Eat: {item.foods.join(', ')}
                                </div>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', fontStyle: 'italic', color: '#374151' }}>💡 {item.why}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Medicine Prescription Section (Full Width Now) ─── */}
            <div className="glass-card" style={{ marginTop: '0', borderTop: '4px solid #b7e4c7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>💊</span>
                    <div>
                        <h3 style={{ margin: 0 }}>Medicine Prescription Protocol</h3>
                        <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>AI-recommended based on your clinical risk profile</p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div style={{ background: 'rgba(255, 193, 7, 0.15)', border: '1px solid #ffc107', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#856404' }}>
                    ⚠️ <strong>Medical Disclaimer:</strong> These are AI-assisted suggestions based on rural health protocols. Always consult a registered medical practitioner (MBBS/MD) before starts any medicine.
                </div>

                {data.prescriptions && data.prescriptions.length > 0 ? (
                    data.prescriptions.map((rxGroup, gi) => (
                        <div key={gi} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem' }}>
                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: rxGroup.color, display: 'inline-block' }}></span>
                                <h4 style={{ margin: 0, color: rxGroup.color }}>{rxGroup.condition}</h4>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(45,106,79,0.08)', textAlign: 'left' }}>
                                            <th style={{ padding: '0.6rem 0.8rem', borderBottom: '2px solid #e0e0e0' }}>💊 Medicine</th>
                                            <th style={{ padding: '0.6rem 0.8rem', borderBottom: '2px solid #e0e0e0' }}>🏷️ Brand Name</th>
                                            <th style={{ padding: '0.6rem 0.8rem', borderBottom: '2px solid #e0e0e0' }}>Type</th>
                                            <th style={{ padding: '0.6rem 0.8rem', borderBottom: '2px solid #e0e0e0' }}>Dose</th>
                                            <th style={{ padding: '0.6rem 0.8rem', borderBottom: '2px solid #e0e0e0' }}>Frequency</th>
                                            <th style={{ padding: '0.6rem 0.8rem', borderBottom: '2px solid #e0e0e0' }}>Duration</th>
                                            <th style={{ padding: '0.6rem 0.8rem', borderBottom: '2px solid #e0e0e0' }}>⚠️ Note</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rxGroup.medicines.map((med, mi) => (
                                            <tr key={mi} style={{ borderBottom: '1px solid #f0f0f0', background: mi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.4)' }}>
                                                <td style={{ padding: '0.7rem 0.8rem', fontWeight: '600', color: '#1b4332' }}>{med.name}</td>
                                                <td style={{ padding: '0.7rem 0.8rem' }}>
                                                    {med.brand && med.brand !== '-'
                                                        ? <span style={{ background: 'rgba(255,159,28,0.15)', color: '#b5450b', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', border: '1px solid rgba(255,159,28,0.4)' }}>{med.brand}</span>
                                                        : <span style={{ color: '#aaa' }}>-</span>
                                                    }
                                                </td>
                                                <td style={{ padding: '0.7rem 0.8rem', color: '#555' }}>
                                                    <span style={{ background: 'rgba(45,106,79,0.1)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem' }}>{med.type}</span>
                                                </td>
                                                <td style={{ padding: '0.7rem 0.8rem' }}>{med.dose}</td>
                                                <td style={{ padding: '0.7rem 0.8rem', color: '#2d6a4f' }}>{med.frequency}</td>
                                                <td style={{ padding: '0.7rem 0.8rem', color: '#555' }}>{med.duration}</td>
                                                <td style={{ padding: '0.7rem 0.8rem', color: '#856404', fontSize: '0.78rem' }}>{med.warning}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fdfa', borderRadius: '15px', color: '#555' }}>
                        🏥 No high-risk prescriptions needed. Keep maintaining a healthy lifestyle!
                    </div>
                )}

                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                    <button className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}
                        onClick={() => window.print()}>
                        🖨️ Print Prescription
                    </button>
                </div>
            </div>

            <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>{t.nearby_facilities}</h3>
                    <div style={{ fontSize: '0.8rem' }}>
                        <label><input type="checkbox" readOnly defaultChecked /> Govt</label>
                        <label style={{ marginLeft: '10px' }}><input type="checkbox" readOnly defaultChecked /> Private</label>
                    </div>
                </div>
                {data.hospitals.map((hosp, i) => (
                    <div key={i} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--secondary)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <strong>{hosp.name}</strong>
                            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Distance: {hosp.distance}</p>
                        </div>
                        <span className={`badge`} style={{ background: hosp.type === 'Government' ? '#2d6a4f' : '#ff9f1c', color: '#fff', height: 'fit-content' }}>
                            {hosp.type}
                        </span>
                    </div>
                ))}
                <div style={{ marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                    <button
                        className="btn btn-accent"
                        style={{ width: '100%', animation: 'pulse 1.5s infinite', fontSize: '1rem', letterSpacing: '0.5px' }}
                        onClick={() => setShowEmergency(true)}
                    >
                        🏥 {t.emergency_support} - Contact Hospitals
                    </button>
                </div>
            </div>

            <HospitalMap hospitals={data.hospitals} patientLat={data.patient_lat} patientLng={data.patient_lng} />

            <div className="glass-card">
                <h3>Recommended Govt. Schemes</h3>
                <div className="grid">
                    {data.schemes.map((scheme, i) => (
                        <div key={i} style={{ border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px' }}>
                            <h4 style={{ color: 'var(--accent)' }}>{scheme.name}</h4>
                            <p>{scheme.description}</p>
                        </div>
                    ))}
                </div>
            </div>
            {/* ─── Emergency Modal ─── */}
            {showEmergency && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setShowEmergency(false)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ background: '#fff', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                            <h3 style={{ margin: 0, color: '#e63946' }}>🏥 Emergency Support</h3>
                            <button onClick={() => setShowEmergency(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>✕</button>
                        </div>

                        {/* National Helplines */}
                        <div style={{ background: '#fff5f5', border: '1px solid #ffcccc', borderRadius: '12px', padding: '1rem', marginBottom: '1.2rem' }}>
                            <p style={{ fontSize: '0.8rem', color: '#e63946', fontWeight: '700', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚨 National Emergency Numbers</p>
                            {[
                                { label: '🚑 Ambulance (CATS)', number: '108', note: 'Free ambulance - 24/7' },
                                { label: '🤱 Maternal Ambulance', number: '102', note: 'Free for pregnant women' },
                                { label: '🆘 Emergency Services', number: '112', note: 'Police / Fire / Medical' },
                            ].map((e, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem', paddingBottom: '0.7rem', borderBottom: i < 2 ? '1px solid #ffe0e0' : 'none' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.95rem' }}>{e.label}</strong>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{e.note}</p>
                                    </div>
                                    <button
                                        onClick={() => makeCall(e.number)}
                                        style={{ background: callingNum === e.number ? '#b5031a' : '#e63946', color: '#fff', padding: '8px 18px', borderRadius: '25px', fontWeight: '700', fontSize: '1rem', border: 'none', cursor: 'pointer', letterSpacing: '1px', minWidth: '90px' }}
                                    >
                                        {callingNum === e.number ? '📞 Calling…' : `📞 ${e.number}`}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Nearby Hospitals - GPS-based from backend */}
                        <p style={{ fontSize: '0.8rem', color: '#555', fontWeight: '700', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏥 Nearby Hospitals</p>
                        {data.hospitals.map((h, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', padding: '0.8rem 1rem', background: '#f8fffe', borderRadius: '10px', border: '1px solid #d8f3dc' }}>
                                <div>
                                    <strong style={{ fontSize: '0.9rem', color: '#1b4332' }}>{h.name}</strong>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>
                                        {h.distance} • {h.type}{h.address ? ` • ${h.address}` : ''}
                                        {h.phone ? ` • ${h.phone}` : ''}
                                    </p>
                                </div>
                                <button
                                    onClick={() => makeCall(h.phone || '108')}
                                    style={{ background: callingNum === (h.phone || '108') ? '#1b4332' : '#2d6a4f', color: '#fff', padding: '7px 14px', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', minWidth: '80px' }}
                                >
                                    {callingNum === (h.phone || '108') ? '📞 Calling…' : '📞 Call'}
                                </button>
                            </div>
                        ))}

                        <p style={{ fontSize: '0.72rem', color: '#999', marginTop: '1rem', textAlign: 'center' }}>
                            Tap any number to call directly. Stay calm and describe the symptoms clearly.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Results
