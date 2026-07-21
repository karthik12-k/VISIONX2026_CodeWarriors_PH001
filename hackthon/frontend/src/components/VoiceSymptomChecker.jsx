import React, { useState, useEffect, useRef } from 'react'

const SYMPTOM_DB = {
    fever: { 
        id: 'D01', name: 'Viral Fever / Heat Exhaustion', 
        precautions: ['Rest', 'Stay hydrated', 'Keep cool'], 
        medicines: [
            { name: 'Paracetamol 650mg', brand: 'Dolo 650', dose: '1 tab', freq: '6-8 hrs' },
            { name: 'Ibuprofen 400mg', brand: 'Brufen', dose: '1 tab', freq: '8 hrs' }
        ],
        triage: 'Moderate' 
    },
    cough: { 
        id: 'D02', name: 'Upper Respiratory Infection', 
        precautions: ['Warm fluids', 'Steam inhalation'], 
        medicines: [
            { name: 'Dextromethorphan', brand: 'Benadryl', dose: '10ml', freq: '8 hrs' },
            { name: 'Ambroxol', brand: 'Ambrodil', dose: '1 tab', freq: '8 hrs' }
        ],
        triage: 'Moderate' 
    },
    skin: { 
        id: 'D03', name: 'Dermatitis / Fungal', 
        precautions: ['Keep area dry', 'Avoid scratching'], 
        medicines: [
            { name: 'Clotrimazole Cream', brand: 'Candid', dose: 'Apply', freq: 'Twice daily' },
            { name: 'Cetirizine 10mg', brand: 'Alerid', dose: '1 tab', freq: 'Night' }
        ],
        triage: 'Low' 
    },
    stomach: { 
        id: 'D04', name: 'Gastritis / Diarrhea', 
        precautions: ['ORS fluids', 'Bland food'], 
        medicines: [
            { name: 'ORS Sachet', brand: 'Electral', dose: '1 pack', freq: 'Every stool' },
            { name: 'Pantoprazole', brand: 'Pan 40', dose: '1 tab', freq: 'Morning' }
        ],
        triage: 'Low' 
    },
    breathing: { 
        id: 'D05', name: 'Asthma / Acute Distress', 
        precautions: ['Sit upright', 'Use inhaler'], 
        medicines: [
            { name: 'Salbutamol Inhaler', brand: 'Asthalin', dose: '2 puffs', freq: 'SOS' },
            { name: 'Budesonide', brand: 'Budecort', dose: '1 puff', freq: 'Twice daily' }
        ],
        triage: 'High' 
    },
    headache: { 
        id: 'D06', name: 'Tension Headache', 
        precautions: ['Rest', 'Hydration'], 
        medicines: [
            { name: 'Paracetamol 500mg', brand: 'Crocin', dose: '1-2 tab', freq: '6 hrs' },
            { name: 'Naproxen', brand: 'Naprosyn', dose: '1 tab', freq: '12 hrs' }
        ],
        triage: 'Low' 
    }
}

// Simple multi-lingual offline keyword matcher (fallback AI)
const offlineDiagnose = (text) => {
    const t = text.toLowerCase()
    const matches = []
    
    // Fever / Jvaram / Bukhari / Bukhar / Tapu / Garm
    if (/(fever|jvaram|bukhari|bukhar|tap|taap|garm|temperature|ताप|તાવ|बुखार|జ్వరం|ಜ್ವರ|പനി|ಜ್ವರಂ)/i.test(t)) matches.push(SYMPTOM_DB.fever)
    
    // Cough / Dagg / Khansi / Khasi / کھانسی
    if (/(cough|dagg|khansi|khasi|phlegm|throat|खोकला|ખાંસી|खाँसी|దగ్గు|ಕೆಮ್ಮು|കാസി|ಕೆಮ್ಮು)/i.test(t)) matches.push(SYMPTOM_DB.cough)
    
    // Skin / Rash / Chalu / Khujli / Itch / Gandha
    if (/(skin|rash|chalu|khujli|itch|khaj|daag|ખંજવાળ|खाज|ಚರ್ಮ|தோல்|చర్మం|ത്വക്ക്)/i.test(t)) matches.push(SYMPTOM_DB.skin)
    
    // Stomach / Kadupu / Pet / Dard / Pot / Potu
    if (/(stomach|pain|kadupu|pet|dard|ache|cramp|vomit|loose|diarrhea|pota|पोट|પેટ|కడుపు|ಹೊಟ್ಟೆ|വയറ്|வயிறு)/i.test(t)) matches.push(SYMPTOM_DB.stomach)
    
    // Breathing / Urpasa / Saans / Swas / Dam
    if (/(breath|urpasa|saans|pant|gasp|air|asthma|ಶಬ್ದ|శ్వాస|மூச்சு|ശ്വാസം|दम|श्वास)/i.test(t)) matches.push(SYMPTOM_DB.breathing)
    
    // Headache / Tala noppi / Sir dard / Dokhudu
    if (/(headache|tala|noppi|sir|dard|head|migraine|डोकं|માથું|ತಲೆ|தலை|തല|నొప్పు)/i.test(t)) matches.push(SYMPTOM_DB.headache)
    
    if (matches.length === 0) {
        return [{ id: 'D00', name: 'General Illness / सामान्य स्वास्थ्य', precautions: ['Rest', 'Consult a doctor if symptoms persist'], triage: 'Low' }]
    }
    return matches
}

function VoiceSymptomChecker({ t }) {
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [lang, setLang] = useState('hi-IN') // Default Hindi
    const [isOffline, setIsOffline] = useState(true) // Demo offline mode flag
    const [analyzing, setAnalyzing] = useState(false)
    const [diagnosis, setDiagnosis] = useState(null)
    const [lat, setLat] = useState('28.6139')
    const [lng, setLng] = useState('77.2090')
    const recognitionRef = useRef(null)

    useEffect(() => {
        // Init Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let current = ''
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    current += event.results[i][0].transcript;
                }
                setTranscript(current)
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false)
            }
        }
    }, [])

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop()
            setIsRecording(false)
        } else {
            setTranscript('')
            setDiagnosis(null)
            if (recognitionRef.current) {
                recognitionRef.current.lang = lang;
                recognitionRef.current.start();
                setIsRecording(true)
            } else {
                alert("Speech recognition is not supported in this browser.")
            }
        }
    }

    const runAI = () => {
        setAnalyzing(true)
        // Simulate Offline Model Loading & Inference
        setTimeout(() => {
            const results = offlineDiagnose(transcript)
            setDiagnosis(results)
            setAnalyzing(false)
            
            // Save to health records
            const record = {
                date: new Date().toLocaleString(),
                symptoms: transcript,
                diagnosis: results,
                mode: isOffline ? 'Offline AI' : 'Cloud AI'
            }
            const existing = JSON.parse(localStorage.getItem('janrakshak_records') || '[]')
            existing.unshift(record)
            localStorage.setItem('janrakshak_records', JSON.stringify(existing))

        }, 1500)
    }

    return (
        <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
            <h2>🎙️ AI Voice Symptom Checker (Offline Mode)</h2>
            <p style={{ opacity: 0.8, marginBottom: '2rem' }}>Speak in local languages. Works seamlessly without the internet.</p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <select 
                    value={lang} 
                    onChange={(e) => setLang(e.target.value)}
                    style={{ padding: '0.6rem', borderRadius: '10px', maxWidth: '300px', border: '1px solid #40916c', fontWeight: 'bold' }}
                    disabled={isRecording}
                >
                    <option value="hi-IN">हिन्दी (Hindi)</option>
                    <option value="te-IN">తెలుగు (Telugu)</option>
                    <option value="mr-IN">मराठी (Marathi)</option>
                    <option value="bn-IN">বাংলা (Bengali)</option>
                    <option value="ta-IN">தமிழ் (Tamil)</option>
                    <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
                    <option value="or-IN">ଓଡ଼ିଆ (Odia)</option>
                    <option value="gu-IN">ગુજરાતી (Gujarati)</option>
                    <option value="pa-IN">ਪੰਜਾਬੀ (Punjabi)</option>
                    <option value="en-IN">English (India)</option>
                </select>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', padding: '0.5rem 1rem', borderRadius: '50px', border: '1px solid #a7f3d0' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOffline ? '#40916c' : '#ff9f1c' }}></div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{isOffline ? 'Offline Model Active' : 'Cloud Mode'}</span>
                    <input type="checkbox" checked={isOffline} onChange={() => setIsOffline(!isOffline)} style={{ marginLeft: '10px' }} title="Toggle offline sync" />
                </div>
            </div>

            <button 
                onClick={toggleRecording}
                style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isRecording ? '#e63946' : 'linear-gradient(135deg, #2d6a4f, #40916c)',
                    color: 'white',
                    fontSize: '2.5rem',
                    cursor: 'pointer',
                    boxShadow: isRecording ? '0 0 0 10px rgba(230, 57, 70, 0.3)' : '0 10px 20px rgba(45, 106, 79, 0.3)',
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                    transition: 'all 0.3s ease',
                    marginBottom: '1.5rem'
                }}
            >
                {isRecording ? '⏹' : '🎤'}
            </button>
            
            <p style={{ color: isRecording ? '#e63946' : '#555', fontWeight: 'bold' }}>
                {isRecording ? "Listening to patient symptoms..." : "Tap to start speaking"}
            </p>

            {transcript && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid #d8f3dc', textAlign: 'left' }}>
                    <h4 style={{ color: '#2d6a4f', marginBottom: '0.5rem' }}>Text Captured:</h4>
                    <p style={{ fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '1rem' }}>"{transcript}"</p>
                    
                    {!isRecording && !analyzing && !diagnosis && (
                        <button onClick={runAI} className="btn" style={{ width: '100%' }}>
                            🤖 Run Diagnosis locally
                        </button>
                    )}
                </div>
            )}

            {analyzing && (
                <div style={{ marginTop: '2rem' }}>
                    <p style={{ fontWeight: 'bold', color: '#2d6a4f' }}>Analyzing symptoms locally...</p>
                    <div style={{ height: '6px', width: '100%', background: '#d8f3dc', borderRadius: '3px', overflow: 'hidden', marginTop: '10px' }}>
                        <div style={{ height: '100%', width: '50%', background: '#40916c', animation: 'slideBar 1.5s ease infinite alternate' }} />
                    </div>
                </div>
            )}

            {diagnosis && (
                <div style={{ marginTop: '2rem', textAlign: 'left', animation: 'fadeIn 0.5s ease' }}>
                    <h3 style={{ borderBottom: '2px solid #a7f3d0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>📋 Diagnostic Report</h3>
                    
                    {diagnosis.map((d, i) => (
                        <div key={i} style={{ background: d.triage === 'High' ? '#fff0f0' : '#f0fdf4', border: `1px solid ${d.triage === 'High' ? '#ffcdd2' : '#a7f3d0'}`, borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                <h4 style={{ margin: 0, fontSize: '1.2rem', color: d.triage === 'High' ? '#c62828' : '#1b4332' }}>{d.name}</h4>
                                <span className={`badge ${d.triage === 'High' ? 'badge-high' : d.triage === 'Moderate' ? 'badge-moderate' : 'badge-low'}`}>{d.triage} Risk</span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '10px' }}>
                                <div>
                                    <strong style={{ fontSize: '0.85rem' }}>🌿 Precautions:</strong>
                                    <ul style={{ marginLeft: '1.2rem', marginTop: '5px', fontSize: '0.85rem', color: '#444' }}>
                                        {d.precautions.map((p, idx) => <li key={idx}>{p}</li>)}
                                    </ul>
                                </div>
                                {d.medicines && (
                                    <div>
                                        <strong style={{ fontSize: '0.85rem' }}>💊 Potential Medicines:</strong>
                                        <div style={{ marginTop: '5px' }}>
                                            {d.medicines.map((m, idx) => (
                                                <div key={idx} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.7)', padding: '4px 8px', borderRadius: '6px', marginBottom: '4px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <strong>{m.name}</strong> ({m.brand}) <br/>
                                                    <span style={{ opacity: 0.8 }}>{m.dose} • {m.freq}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div style={{ background: '#e3f2fd', border: '1px solid #bbdefb', borderRadius: '12px', padding: '1rem', marginTop: '1rem' }}>
                        <h4 style={{ margin: 0, color: '#1565c0', marginBottom: '0.5rem' }}>🏥 Nearby Hospitals Suggested</h4>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                            <li>District Hospital, Main Road (2.4 km)</li>
                            <li>Sanjeevani Rural Clinic (0.8 km)</li>
                        </ul>
                        <button className="btn" style={{ background: '#1976d2', marginTop: '10px', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>📍 View on GPS Map</button>
                    </div>
                    
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem', textAlign: 'center' }}>
                        ✅ Diagnosis saved securely to Local Health Records.
                    </p>
                </div>
            )}
            
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.7); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(230, 57, 70, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(230, 57, 70, 0); }
                }
                @keyframes slideBar {
                    0% { transform: translateX(-100%); width: 50%;}
                    100% { transform: translateX(200%); width: 50%;}
                }
            `}</style>
        </div>
    )
}

export default VoiceSymptomChecker
