import React, { useState, useRef, useCallback, useEffect } from 'react'
import { API_BASE_URL } from '../config'

const SCAN_MODES = [
    {
        id: 'wound',
        label: '🩹 Wound / Skin',
        description: 'Analyse cuts, burns, rashes, fungal infections, skin diseases',
        icon: '🩹',
    },
    {
        id: 'bone',
        label: '🦴 Bone / X-Ray',
        description: 'Detect fractures & cracks from X-ray images',
        icon: '🦴',
    },
]

function WoundAnalyzer({ t }) {
    const [scanMode, setScanMode] = useState('wound')
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [dragging, setDragging] = useState(false)

    // Camera states
    const [cameraOpen, setCameraOpen] = useState(false)
    const [cameraError, setCameraError] = useState('')
    const [cameraFacing, setCameraFacing] = useState('environment') // 'user' or 'environment'

    const fileInputRef = useRef(null)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    // ── Start camera ──────────────────────────────────────────────────────────
    const startCamera = async (facing = cameraFacing) => {
        setCameraError('')
        try {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop())
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            })
            streamRef.current = stream
            setCameraOpen(true)
            // Wait for video element to mount
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.play()
                }
            }, 100)
        } catch (err) {
            setCameraError('Camera access denied or not available. Please allow camera permission in your browser.')
            console.error('Camera error:', err)
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        setCameraOpen(false)
    }

    // Stop camera on unmount
    useEffect(() => () => stopCamera(), [])

    const switchCamera = () => {
        const next = cameraFacing === 'environment' ? 'user' : 'environment'
        setCameraFacing(next)
        startCamera(next)
    }

    // ── Capture frame from live video ─────────────────────────────────────────
    const captureFrame = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
            setImageFile(file)
            setImagePreview(canvas.toDataURL('image/jpeg'))
            setResult(null)
            setError('')
            stopCamera()
        }, 'image/jpeg', 0.92)
    }

    // ── File upload handler ───────────────────────────────────────────────────
    const handleFile = (file) => {
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file (JPG, PNG, WEBP, etc.)')
            return
        }
        setError('')
        setResult(null)
        setImageFile(file)
        const reader = new FileReader()
        reader.onload = (e) => setImagePreview(e.target.result)
        reader.readAsDataURL(file)
    }

    const onFileChange = (e) => handleFile(e.target.files[0])
    const onDrop = useCallback((e) => {
        e.preventDefault()
        setDragging(false)
        handleFile(e.dataTransfer.files[0])
    }, [])
    const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
    const onDragLeave = () => setDragging(false)

    // ── Analyse ───────────────────────────────────────────────────────────────
    const analyseImage = async () => {
        if (!imageFile) { setError('Please capture or upload an image first.'); return }
        setLoading(true)
        setError('')
        setResult(null)
        const formData = new FormData()
        formData.append('image', imageFile)
        formData.append('scan_mode', scanMode)
        try {
            const res = await fetch(`${API_BASE_URL}/api/image-diagnosis`, {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (data.error) setError(data.error)
            else setResult(data)
        } catch {
            setError('Could not reach the AI server. Please check your internet connection or backend server.')
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        stopCamera()
        setImageFile(null)
        setImagePreview(null)
        setResult(null)
        setError('')
        setCameraError('')
    }

    const changeModeAndReset = (mode) => { setScanMode(mode); reset() }
    const severityIcon = { Low: '🟢', Moderate: '🟡', High: '🔴' }

    return (
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>

            {/* ── Header ── */}
            <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 2rem 1.5rem', marginBottom: '1.2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.3rem' }}>🩺</div>
                <h2 style={{ margin: 0 }}>AI Medical Image Scanner</h2>
                <p style={{ color: '#666', marginTop: '0.4rem', fontSize: '0.93rem', maxWidth: '600px', margin: '0.4rem auto 0' }}>
                    Use your camera or upload a photo - our AI analyses wounds, skin conditions, and X-rays &amp; provides a prescription instantly.
                </p>
            </div>

            {/* ── Scan Mode Selector ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
                {SCAN_MODES.map(mode => (
                    <div key={mode.id} onClick={() => changeModeAndReset(mode.id)}
                        style={{
                            padding: '1.2rem 1.5rem', borderRadius: '16px', cursor: 'pointer',
                            border: scanMode === mode.id ? '2.5px solid var(--primary)' : '2px solid rgba(45,106,79,0.2)',
                            background: scanMode === mode.id
                                ? 'linear-gradient(135deg, rgba(45,106,79,0.12), rgba(45,106,79,0.05))'
                                : 'rgba(255,255,255,0.7)',
                            transition: 'all 0.25s ease',
                            boxShadow: scanMode === mode.id ? '0 4px 16px rgba(45,106,79,0.2)' : 'none',
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <span style={{ fontSize: '2rem' }}>{mode.icon}</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1b4332' }}>{mode.label}</div>
                                <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '0.15rem' }}>{mode.description}</div>
                            </div>
                            {scanMode === mode.id && (
                                <span style={{ marginLeft: 'auto', background: 'var(--primary)', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '0.7rem', fontWeight: 700 }}>ACTIVE</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Disclaimer ── */}
            <div style={{ background: 'rgba(255,193,7,0.12)', border: '1px solid #ffc107', borderRadius: '12px', padding: '0.6rem 1rem', marginBottom: '1.2rem', fontSize: '0.8rem', color: '#856404' }}>
                {scanMode === 'bone'
                    ? <span>⚠️ <strong>X-Ray Disclaimer:</strong> This AI bone scan is for preliminary screening only. A qualified radiologist and orthopaedic surgeon MUST review the actual film. In emergency call 108.</span>
                    : <span>⚠️ <strong>Medical Disclaimer:</strong> This AI analysis is for informational support only and does not replace a professional medical consultation.</span>}
            </div>

            {/* ── Upload / Camera Section ── */}
            {!result && (
                <div className="glass-card" style={{ padding: '2rem' }}>

                    {/* ── LIVE CAMERA VIEW ── */}
                    {cameraOpen ? (
                        <div style={{ marginBottom: '1.2rem' }}>
                            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', aspectRatio: '16/9', maxHeight: '400px' }}>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                                {/* Camera overlay label */}
                                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    📹 LIVE - {scanMode === 'bone' ? 'X-Ray Capture' : 'Wound / Skin Capture'}
                                </div>
                                {/* Switch cam button */}
                                <button onClick={switchCamera}
                                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer' }}>
                                    🔄
                                </button>
                            </div>
                            {/* Hidden canvas for capture */}
                            <canvas ref={canvasRef} style={{ display: 'none' }} />

                            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', justifyContent: 'center' }}>
                                <button className="btn" onClick={captureFrame}
                                    style={{ flex: 2, maxWidth: '260px', fontSize: '1.05rem', padding: '0.8rem 1.5rem', background: 'var(--primary)', color: '#fff' }}>
                                    📸 Capture Photo
                                </button>
                                <button className="btn" onClick={stopCamera}
                                    style={{ flex: 1, maxWidth: '140px', background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '1.5px solid #e63946' }}>
                                    ✖ Close
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* ── Drag-and-drop Zone ── */}
                            <div
                                onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    border: `2.5px dashed ${dragging ? 'var(--primary)' : '#a7f3d0'}`,
                                    borderRadius: '16px', padding: '2.5rem 2rem',
                                    textAlign: 'center', cursor: 'pointer',
                                    background: dragging ? 'rgba(45,106,79,0.07)' : 'rgba(167,243,208,0.08)',
                                    transition: 'all 0.25s ease', marginBottom: '1.2rem',
                                }}>
                                {imagePreview ? (
                                    <div>
                                        <img src={imagePreview} alt="Preview"
                                            style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }} />
                                        <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#555' }}>
                                            📎 <strong>{imageFile?.name}</strong> &nbsp;·&nbsp; {(imageFile?.size / 1024).toFixed(1)} KB
                                            &nbsp;·&nbsp; <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Click to change</span>
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '3.2rem', marginBottom: '0.7rem' }}>{dragging ? '📂' : (scanMode === 'bone' ? '🦴' : '🖼️')}</div>
                                        <p style={{ fontWeight: 700, fontSize: '1rem', color: '#1b4332', marginBottom: '0.3rem' }}>
                                            {dragging ? 'Drop the image here' : (scanMode === 'bone' ? 'Drag & Drop X-Ray image here' : 'Drag & Drop wound / skin photo here')}
                                        </p>
                                        <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: 0 }}>or click to browse - JPG, PNG, WEBP up to 10 MB</p>
                                    </>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
                            </div>

                            {/* ── Action Buttons ── */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', justifyContent: 'center' }}>
                                {/* Live Camera button - uses getUserMedia */}
                                <button className="btn"
                                    style={{ flex: '1', minWidth: '160px', maxWidth: '230px', background: 'linear-gradient(135deg,#1b4332,#2d6a4f)', color: '#fff', fontSize: '0.95rem' }}
                                    onClick={() => startCamera()}>
                                    📹 Open Live Camera
                                </button>

                                {/* Analyse button */}
                                <button className="btn"
                                    style={{ flex: '2', minWidth: '180px', maxWidth: '320px', opacity: imageFile ? 1 : 0.6, fontSize: '0.95rem' }}
                                    onClick={analyseImage} disabled={loading || !imageFile}>
                                    {loading
                                        ? <span>⏳ AI Analysing…</span>
                                        : <span>{scanMode === 'bone' ? '🦴 Detect Fracture' : '🔍 Analyse Wound'}</span>}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Camera error */}
                    {cameraError && (
                        <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', background: 'rgba(230,57,70,0.08)', borderRadius: '10px', color: '#e63946', fontSize: '0.88rem', textAlign: 'center' }}>
                            📷 {cameraError}
                        </div>
                    )}

                    {/* Loading indicator */}
                    {loading && (
                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <div style={{ display: 'inline-block', padding: '0.8rem 2rem', background: 'rgba(45,106,79,0.07)', borderRadius: '12px', color: '#2d6a4f', fontWeight: 600, fontSize: '0.95rem', animation: 'pulse 1.4s ease-in-out infinite' }}>
                                {scanMode === 'bone' ? '🧠 AI is scanning the X-ray for fractures & cracks…' : '🧠 AI is analysing the image for medical conditions…'}
                            </div>
                            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
                        </div>
                    )}

                    {/* General error */}
                    {error && (
                        <div style={{ marginTop: '1rem', padding: '0.8rem 1rem', background: 'rgba(230,57,70,0.08)', borderRadius: '10px', color: '#e63946', fontSize: '0.9rem', textAlign: 'center' }}>
                            ❌ {error}
                        </div>
                    )}
                </div>
            )}

            {/* ── Results Panel ── */}
            {result && (
                <div>
                    {/* Diagnosis / Fracture Card */}
                    <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {imagePreview && (
                                    <img src={imagePreview} alt="Scanned" style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #a7f3d0' }} />
                                )}
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {result.scan_type === 'bone' ? '🦴 Bone / X-Ray Analysis' : '🩹 Wound / Skin Analysis'}
                                    </p>

                                    {/* Fracture detected banner */}
                                    {result.scan_type === 'bone' && (
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                            marginTop: '0.4rem', marginBottom: '0.5rem',
                                            padding: '0.5rem 1.2rem', borderRadius: '12px', fontWeight: 800, fontSize: '1.05rem',
                                            background: result.fracture_detected
                                                ? (result.urgent ? 'rgba(230,57,70,0.12)' : 'rgba(244,162,97,0.15)')
                                                : 'rgba(64,145,108,0.12)',
                                            border: `2px solid ${result.fracture_detected ? (result.urgent ? '#e63946' : '#f4a261') : '#40916c'}`,
                                            color: result.fracture_detected ? (result.urgent ? '#c1121f' : '#b5450b') : '#1b4332',
                                        }}>
                                            {result.fracture_detected
                                                ? (result.urgent ? '🚨 FRACTURE DETECTED - URGENT' : '⚠️ FRACTURE DETECTED')
                                                : '✅ NO FRACTURE - BONE APPEARS INTACT'}
                                        </div>
                                    )}

                                    <h2 style={{ margin: '0.1rem 0', fontSize: '1.2rem', color: '#1b4332' }}>
                                        {result.scan_type !== 'bone' && (severityIcon[result.severity] || '🟡') + ' '}
                                        {result.diagnosis}
                                    </h2>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                                        <span style={{ background: result.severity_color + '22', color: result.severity_color, border: `1.5px solid ${result.severity_color}`, padding: '2px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.75rem' }}>
                                            {result.severity?.toUpperCase()} SEVERITY
                                        </span>
                                        {result.scan_type === 'bone' && result.fracture_type && result.fracture_type !== 'None' && (
                                            <span style={{ background: 'rgba(230,57,70,0.1)', color: '#c1121f', border: '1.5px solid #e63946', padding: '2px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.75rem' }}>{result.fracture_type}</span>
                                        )}
                                        {result.scan_type === 'bone' && result.affected_bone && result.affected_bone !== 'Unknown' && (
                                            <span style={{ background: 'rgba(45,106,79,0.08)', color: '#1b4332', border: '1.5px solid #a7f3d0', padding: '2px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}>📍 {result.affected_bone}</span>
                                        )}
                                        {result.scan_type === 'bone' && result.confidence && (
                                            <span style={{ background: 'rgba(59,130,246,0.1)', color: '#1e40af', border: '1.5px solid #93c5fd', padding: '2px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem' }}>AI Confidence: {result.confidence}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button className="btn" onClick={() => window.print()} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', background: 'var(--secondary)', color: 'var(--primary)' }}>🖨️ Print</button>
                                <button className="btn" onClick={reset} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>📹 New Scan</button>
                            </div>
                        </div>

                        {result.ai_description && (
                            <div style={{ marginTop: '1.2rem', padding: '1rem 1.2rem', background: 'rgba(45,106,79,0.06)', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', lineHeight: '1.7' }}>
                                    🤖 <strong>AI Analysis:</strong> {result.ai_description}
                                </p>
                            </div>
                        )}

                        {result.scan_type === 'bone' && result.urgent && (
                            <div style={{ marginTop: '1rem', padding: '0.8rem 1.2rem', background: 'rgba(230,57,70,0.1)', border: '1.5px solid #e63946', borderRadius: '12px' }}>
                                <p style={{ margin: 0, fontWeight: 700, color: '#c1121f', fontSize: '0.92rem' }}>
                                    🚨 <strong>URGENT:</strong> This appears to be a complex or displaced fracture. Immobilise the limb, do NOT apply weight, and go to the nearest hospital or call 108 immediately.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Medicines Table */}
                    {result.medicines && result.medicines.length > 0 && (
                        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
                            <h3 style={{ margin: '0 0 1rem', color: '#1b4332' }}>
                                {result.scan_type === 'bone' && result.fracture_detected ? '💊 Fracture Treatment - Medications & Protocol'
                                    : result.scan_type === 'bone' ? '💊 Bone Health - Recommended Medications'
                                        : '💊 Recommended Medicines & Prescription'}
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(45,106,79,0.08)', textAlign: 'left' }}>
                                            {['💊 Medicine', '🏷️ Brand', 'Type', 'Dose', 'Frequency', '⏱️ Duration', '⚠️ Warning'].map(h => (
                                                <th key={h} style={{ padding: '0.7rem', borderBottom: '2px solid #ddd', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.medicines.map((med, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.5)' }}>
                                                <td style={{ padding: '0.8rem 0.7rem', fontWeight: 700, color: '#1b4332', whiteSpace: 'nowrap' }}>{med.name}</td>
                                                <td style={{ padding: '0.8rem 0.7rem' }}>
                                                    {med.brand && med.brand !== '-'
                                                        ? <span style={{ background: 'rgba(255,159,28,0.15)', color: '#b5450b', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, border: '1px solid rgba(255,159,28,0.35)', whiteSpace: 'nowrap' }}>{med.brand}</span>
                                                        : <span style={{ color: '#aaa' }}>-</span>}
                                                </td>
                                                <td style={{ padding: '0.8rem 0.7rem', color: '#555', fontSize: '0.8rem' }}>{med.type || '-'}</td>
                                                <td style={{ padding: '0.8rem 0.7rem', fontWeight: 500 }}>{med.dose}</td>
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
                        </div>
                    )}

                    {/* Home Remedies */}
                    {result.remedies && result.remedies.length > 0 && (
                        <div className="glass-card" style={{ padding: '1.5rem 2rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '1.4rem' }}>{result.scan_type === 'bone' ? '🦴' : '🌿'}</span>
                                <h3 style={{ margin: 0, color: '#2d6a4f' }}>
                                    {result.scan_type === 'bone' ? 'Bone Care & Natural Recovery Tips' : 'Home Remedies & Natural Treatments'}
                                </h3>
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

                    {/* Disclaimer */}
                    {result.disclaimer && (
                        <div style={{ padding: '0.8rem 1rem', background: 'rgba(255,193,7,0.12)', border: '1px solid #ffc107', borderRadius: '12px', fontSize: '0.82rem', color: '#856404', textAlign: 'center', marginBottom: '1rem' }}>
                            {result.disclaimer}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default WoundAnalyzer
