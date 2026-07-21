import React, { useState } from 'react'
import { API_BASE_URL } from '../config'

const ICON_MAP = {
    RED: { dot: '#e63946', emoji: '🔴' },
    ORANGE: { dot: '#f4a261', emoji: '🟠' },
    YELLOW: { dot: '#e9c46a', emoji: '🟡' },
    GREEN: { dot: '#40916c', emoji: '🟢' },
}

const SYMPTOMS_LIST = [
    'Bleeding', 'Severe headache', 'Blurred vision', 'Swollen face',
    'No fetal movement', 'Convulsion', 'Burning urine', 'Breathlessness',
]

const defaultForm = {
    age: '', weeks: '', hemoglobin: '', systolic: '', diastolic: '',
    weight: '', height: '', gravida: '1',
    prev_cs: false, diabetes_hist: false, symptoms: [],
}

function MaternalHealth() {
    const [form, setForm] = useState(defaultForm)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [tab, setTab] = useState('result') // 'result' | 'anc' | 'emergency' | 'nutrition' | 'birthplan'
    const [speaking, setSpeaking] = useState(false)
    const [birthPlan, setBirthPlan] = useState(() => JSON.parse(localStorage.getItem('janrakshak_birthplan') || '["", "", "", ""]'))

    const saveBirthPlan = () => {
        localStorage.setItem('janrakshak_birthplan', JSON.stringify(birthPlan))
        alert('Birth Preparedness Plan saved successfully!')
    }

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const toggleSymptom = (sym) => {
        setForm(f => ({
            ...f,
            symptoms: f.symptoms.includes(sym)
                ? f.symptoms.filter(s => s !== sym)
                : [...f.symptoms, sym],
        }))
    }

    const submit = async (e) => {
        e.preventDefault()
        setLoading(true); setError(''); setResult(null)
        try {
            const res = await fetch(`${API_BASE_URL}/api/maternal-risk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    age: Number(form.age) || 25,
                    weeks: Number(form.weeks) || 20,
                    hemoglobin: Number(form.hemoglobin) || 11,
                    systolic: Number(form.systolic) || 120,
                    diastolic: Number(form.diastolic) || 80,
                    weight: Number(form.weight) || 60,
                    height: Number(form.height) || 155,
                    gravida: Number(form.gravida) || 1,
                    prev_cs: form.prev_cs,
                    diabetes_hist: form.diabetes_hist,
                    symptoms: form.symptoms.map(s => s.toLowerCase()),
                }),
            })
            const data = await res.json()
            if (data.error) setError(data.error)
            else { setResult(data); setTab('result') }
        } catch {
            setError('Could not reach backend. Please check your internet connection or backend server.')
        } finally {
            setLoading(false)
        }
    }

    const reset = () => { setResult(null); setForm(defaultForm); setError('') }

    const shareWhatsApp = () => {
        if (!result) return
        const meds = result.medicines.map(m => `  • ${m.name} (${m.brand}) - ${m.dose}, ${m.frequency}, ${m.duration}`).join('\n')
        const recs = result.recommendations.map(r => `  - ${r}`).join('\n')
        const nutri = result.nutrition.map(n => `  - ${n.title}: ${n.foods.join(', ')}`).join('\n')
        const text = `🤱 *JanRakshak AI - Maternal Health Report*\n\n` +
            `*Risk Level:* ${result.risk_level}\n` +
            `*Action:* ${result.risk_action}\n\n` +
            `*Recommendations:*\n${recs}\n\n` +
            `*Nutrition Advice:*\n${nutri}\n\n` +
            `*Medicines (Govt ANC Protocol):*\n${meds}\n\n` +
            `*Emergency Signs - Go to hospital IMMEDIATELY if:*\n` +
            result.emergency_signs.filter(s => s.level === 'RED').map(s => `  🔴 ${s.text}`).join('\n') +
            `\n\n⚠️ Always consult a qualified doctor. JanRakshak AI - Rural Health Support.`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    }

    const speakReport = () => {
        if (!result || !window.speechSynthesis) return
        if (speaking) {
            window.speechSynthesis.cancel()
            setSpeaking(false)
            return
        }

        const text = `The patient is at ${result.risk_level} level. The major action needed is: ${result.risk_action}. ` +
            `The identified risk factors are: ${result.risk_factors.map(r => r.title).join(', ')}. ` +
            `Key recommendations are: ${result.recommendations.join('. ')}. ` +
            `Please follow the government prescribed medicine protocol which includes ${result.medicines.map(m => m.name).join(' and ')}. ` +
            `Go to the hospital immediately if you experience any of the following: ${result.emergency_signs.filter(s => s.level === 'RED').map(s => s.text).join('. ')}.`;

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.onend = () => setSpeaking(false)
        setSpeaking(true)
        window.speechSynthesis.speak(utterance)
    }

    const field = (label, key, type = 'number', placeholder = '') => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1b4332', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
            <input
                type={type} placeholder={placeholder}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                style={{ padding: '0.55rem 0.8rem', borderRadius: '10px', border: '1.5px solid #a7f3d0', fontSize: '0.9rem', outline: 'none', background: '#f8fffe', width: '100%', boxSizing: 'border-box' }}
            />
        </div>
    )

    return (
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>

            {/* Header */}
            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '1.2rem' }}>
                <div style={{ fontSize: '3rem' }}>🤱</div>
                <h2 style={{ margin: '0.3rem 0 0' }}>Maternal & Pregnancy Risk Screener</h2>
                <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.4rem auto 0', maxWidth: '580px' }}>
                    AI-assisted antenatal risk assessment for ASHA workers and rural healthcare providers.
                    Identifies high-risk pregnancies and recommends government ANC protocol.
                </p>
            </div>

            {!result ? (
                <form onSubmit={submit}>
                    <div className="glass-card" style={{ padding: '1.8rem 2rem', marginBottom: '1rem' }}>
                        <h3 style={{ margin: '0 0 1.2rem', color: '#1b4332' }}>📋 Patient Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                            {field('Age (years)', 'age', 'number', 'e.g. 24')}
                            {field('Gestational Age (weeks)', 'weeks', 'number', 'e.g. 28')}
                            {field('Hemoglobin (g/dL)', 'hemoglobin', 'number', 'e.g. 10.5')}
                            {field('Systolic BP (mmHg)', 'systolic', 'number', 'e.g. 130')}
                            {field('Diastolic BP (mmHg)', 'diastolic', 'number', 'e.g. 85')}
                            {field('Weight (kg)', 'weight', 'number', 'e.g. 58')}
                            {field('Height (cm)', 'height', 'number', 'e.g. 155')}
                            {field('Gravida (pregnancies incl. this)', 'gravida', 'number', 'e.g. 2')}
                        </div>

                        {/* Checkboxes */}
                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                            {[
                                ['prev_cs', 'Previous C-section'],
                                ['diabetes_hist', 'History of Diabetes'],
                            ].map(([k, label]) => (
                                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                                    <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }} />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Symptoms */}
                    <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
                        <h3 style={{ margin: '0 0 1rem', color: '#1b4332' }}>⚠️ Current Symptoms (select all that apply)</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {SYMPTOMS_LIST.map(sym => {
                                const active = form.symptoms.includes(sym)
                                return (
                                    <button key={sym} type="button"
                                        onClick={() => toggleSymptom(sym)}
                                        style={{
                                            padding: '0.45rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                                            border: active ? '2px solid #e63946' : '1.5px solid #ddd',
                                            background: active ? 'rgba(230,57,70,0.1)' : '#f9f9f9',
                                            color: active ? '#c1121f' : '#555',
                                            transition: 'all 0.2s',
                                        }}>
                                        {active ? '✓ ' : ''}{sym}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '0.8rem 1rem', background: 'rgba(230,57,70,0.08)', borderRadius: '10px', color: '#e63946', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1rem' }}>
                            ❌ {error}
                        </div>
                    )}

                    <button type="submit" className="btn" disabled={loading}
                        style={{ width: '100%', fontSize: '1.05rem', padding: '0.9rem', background: 'linear-gradient(135deg,#1b4332,#2d6a4f)', color: '#fff' }}>
                        {loading ? '⏳ Calculating Risk...' : '🤱 Calculate Maternal Risk'}
                    </button>
                </form>

            ) : (
                <div>
                    {/* Risk Banner */}
                    <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem', border: `2.5px solid ${result.risk_color}`, background: result.risk_color + '10' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Maternal Risk Assessment</p>
                                <h2 style={{ margin: '0.3rem 0 0.5rem', color: result.risk_color, fontSize: '1.8rem' }}>
                                    {ICON_MAP[result.risk_emoji]?.emoji || '🟡'} {result.risk_level}
                                </h2>
                                <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>
                                    👉 {result.risk_action}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button className="btn" onClick={speakReport}
                                    style={{ background: speaking ? '#e63946' : '#4361ee', color: '#fff', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                    {speaking ? '🛑 Stop Reading' : '🔊 Read Report to Patient'}
                                </button>
                                <button className="btn" onClick={shareWhatsApp}
                                    style={{ background: '#25D366', color: '#fff', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                    📲 Share on WhatsApp
                                </button>
                                <button className="btn" onClick={() => window.print()}
                                    style={{ background: 'var(--secondary)', color: 'var(--primary)', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                    🖨️ Print
                                </button>
                                <button className="btn" onClick={reset}
                                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                    🔄 New Screen
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {[
                            ['result', '🩺 Risk Factors & Medicines'],
                            ['nutrition', '🥗 AI Nutrition Advisor'],
                            ['anc', '📅 ANC Checklist'],
                            ['birthplan', '📋 Birth Plan'],
                            ['emergency', '🚨 Emergency Signs']
                        ].map(([id, label]) => (
                            <button key={id} onClick={() => setTab(id)}
                                style={{
                                    padding: '0.5rem 1.2rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                                    border: tab === id ? '2px solid var(--primary)' : '1.5px solid #ddd',
                                    background: tab === id ? 'rgba(45,106,79,0.1)' : '#fff',
                                    color: tab === id ? 'var(--primary)' : '#555',
                                }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Risk Factors Tab */}
                    {tab === 'result' && (
                        <div>
                            {/* Medicines (MOVED TO TOP FOR VISIBILITY) */}
                            <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem', borderLeft: '10px solid #2d6a4f' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.2rem' }}>
                                    <span style={{ fontSize: '1.8rem' }}>💊</span>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#1b4332' }}>Government ANC Protocol - Medicines</h3>
                                        <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>Standard medications mandated by WHO & NHM for pregnancy care</p>
                                    </div>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                                        <thead>
                                            <tr style={{ background: 'rgba(45,106,79,0.08)', textAlign: 'left' }}>
                                                {['💊 Medicine', '🏷️ Brand', 'Dose', 'Frequency', 'Duration', '⚠️ Warning'].map(h => (
                                                    <th key={h} style={{ padding: '0.7rem', borderBottom: '2px solid #ddd', whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.medicines.map((med, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.5)' }}>
                                                    <td style={{ padding: '0.8rem 0.7rem', fontWeight: 700, color: '#1b4332' }}>{med.name}</td>
                                                    <td style={{ padding: '0.8rem 0.7rem' }}>
                                                        <span style={{ background: 'rgba(255,159,28,0.15)', color: '#b5450b', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>{med.brand}</span>
                                                    </td>
                                                    <td style={{ padding: '0.8rem 0.7rem' }}>{med.dose}</td>
                                                    <td style={{ padding: '0.8rem 0.7rem', color: '#2d6a4f', fontWeight: 500 }}>{med.frequency}</td>
                                                    <td style={{ padding: '0.8rem 0.7rem' }}>
                                                        <span style={{ background: 'rgba(45,106,79,0.1)', color: '#1b4332', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>{med.duration}</span>
                                                    </td>
                                                    <td style={{ padding: '0.8rem 0.7rem', color: '#856404', fontSize: '0.8rem' }}>{med.warning}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '1rem', textAlign: 'center' }}>
                                    ⚠️ Note: All these supplements are available for **FREE** at your nearest Primary Health Centre (PHC) or Anganwadi.
                                </p>
                            </div>

                            {/* Risk Factors */}
                            <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
                                <h3 style={{ margin: '0 0 1rem', color: '#1b4332' }}>⚠️ Identified Risk Factors</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                    {result.risk_factors.map((rf, i) => {
                                        const ic = ICON_MAP[rf.icon] || ICON_MAP.YELLOW
                                        return (
                                            <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', padding: '0.8rem 1rem', borderRadius: '12px', background: ic.dot + '12', border: `1.5px solid ${ic.dot}40` }}>
                                                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{ic.emoji}</span>
                                                <div>
                                                    <strong style={{ color: '#1b4332', fontSize: '0.92rem' }}>{rf.title}</strong>
                                                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#555' }}>{rf.detail}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Recommendations */}
                            {result.recommendations.length > 0 && (
                                <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: '0 0 1rem', color: '#1b4332' }}>✅ Recommendations for ASHA Worker</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {result.recommendations.map((rec, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.7rem', fontSize: '0.88rem', color: '#374151', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                                                <span style={{ color: 'var(--primary)', fontWeight: 700, flexShrink: 0 }}>→</span>
                                                {rec}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ANC Checklist Tab */}
                    {tab === 'anc' && (
                        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
                            <h3 style={{ margin: '0 0 1.2rem', color: '#1b4332' }}>📅 Antenatal Care (ANC) Checklist</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {result.anc_checklist.map((phase, i) => (
                                    <div key={i} style={{ padding: '1rem 1.2rem', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: '14px', border: '1px solid #a7f3d0' }}>
                                        <div style={{ fontWeight: 800, color: '#065f46', marginBottom: '0.6rem', fontSize: '0.9rem' }}>
                                            📌 {phase.week}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                            {phase.tasks.map((task, j) => (
                                                <div key={j} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.84rem', color: '#374151' }}>
                                                    <span style={{ color: '#40916c', fontWeight: 700 }}>☑</span> {task}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Emergency Signs Tab */}
                    {tab === 'emergency' && (
                        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
                            <h3 style={{ margin: '0 0 0.5rem', color: '#c1121f' }}>🚨 Go to Hospital Immediately If...</h3>
                            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 1rem' }}>Tell every pregnant woman and her family to watch for these signs</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {result.emergency_signs.map((sign, i) => {
                                    const ic = ICON_MAP[sign.level] || ICON_MAP.YELLOW
                                    return (
                                        <div key={i} style={{ display: 'flex', gap: '0.8rem', padding: '0.7rem 1rem', borderRadius: '12px', background: ic.dot + '12', border: `1px solid ${ic.dot}50`, fontSize: '0.9rem', color: '#1b1b1b', fontWeight: 500 }}>
                                            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{ic.emoji}</span>
                                            {sign.text}
                                        </div>
                                    )
                                })}
                            </div>
                            <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', background: 'rgba(230,57,70,0.08)', border: '1.5px solid #e63946', borderRadius: '12px', fontWeight: 700, color: '#c1121f', textAlign: 'center', fontSize: '0.9rem' }}>
                                📞 National Emergency: <strong>108</strong> &nbsp;|&nbsp; ASHA Helpline: <strong>104</strong>
                            </div>
                        </div>
                    )}

                    {/* Nutrition Tab */}
                    {tab === 'nutrition' && (
                        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
                            <h3 style={{ margin: '0 0 1.2rem', color: '#1b4332' }}>🥗 Localized Nutrition Advisor</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                {result.nutrition.map((item, i) => (
                                    <div key={i} style={{ padding: '1.2rem', background: '#f0fdf4', borderRadius: '15px', border: '1px solid #a7f3d0' }}>
                                        <div style={{ fontWeight: 800, color: '#065f46', marginBottom: '0.5rem', fontSize: '1rem' }}>
                                            {item.title}
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
                                            {item.foods.map((food, f) => (
                                                <span key={f} style={{ background: '#fff', color: '#065f46', padding: '3px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid #dcfce7' }}>
                                                    {food}
                                                </span>
                                            ))}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#4b5563', fontStyle: 'italic' }}>
                                            💡 {item.why}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Birth Plan Tab */}
                    {tab === 'birthplan' && (
                        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
                            <h3 style={{ margin: '0 0 0.5rem', color: '#1b4332' }}>📋 Birth Preparedness Plan</h3>
                            <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: '1.2rem' }}>Help the family fill this out to ensure safety during delivery.</p>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {[
                                    { label: '🚑 Transport Plan', desc: 'Identify a reliable vehicle/ambulance driver name & number' },
                                    { label: '🩸 Blood Donor', desc: 'Identify 2 people with matching blood group ready for emergency' },
                                    { label: '🏥 Delivery Hospital', desc: 'Name of the nearest CHC/Hospital with surgical facilities' },
                                    { label: '💰 Emergency Funds', desc: 'Ensure Janani Suraksha Yojana (JSY) funds/savings are ready' }
                                ].map((item, i) => (
                                    <div key={i} style={{ padding: '1rem', background: '#fff9f9', borderRadius: '12px', border: '1.1px dashed #e63946' }}>
                                        <div style={{ fontWeight: 800, color: '#c1121f', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{item.label}</div>
                                        <input 
                                            type="text" 
                                            placeholder={item.desc} 
                                            value={birthPlan[i]}
                                            onChange={(e) => {
                                                const newPlan = [...birthPlan]
                                                newPlan[i] = e.target.value
                                                setBirthPlan(newPlan)
                                            }}
                                            style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.85rem' }} 
                                        />
                                    </div>
                                ))}
                            </div>
                            <button className="btn" onClick={saveBirthPlan} style={{ marginTop: '1.5rem', width: '100%', background: '#1b4332', color: '#fff', fontSize: '1rem', padding: '0.8rem' }}>
                                💾 Save Birth Plan Locally
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default MaternalHealth
