import { useState } from 'react'
import { useStore } from '../store'

interface Props { onComplete: () => void }

const STEPS = ['Bienvenida', 'Perfil', 'Insulina', 'Entrenamiento', 'Conectar datos']

export default function OnboardingPage({ onComplete }: Props) {
    const [step, setStep] = useState(0)
    const [accepted, setAccepted] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const { setUser, user } = useStore()

    const [perfil, setPerfil] = useState({
        nombre: '', peso: '', talla: '', sexo: 'M',
        basalNombre: 'Tresiba', basalDosis: '18', basalHora: '22:00',
        boluNombre: 'Novorapid', ratioCHO: '1', sensibilidad: '50',
        fcMax: '185', fcReposo: '48', horaTrain: '05:00',
    })

    const update = (k: keyof typeof perfil, v: string) => setPerfil(prev => ({ ...prev, [k]: v }))

    const saveAndComplete = () => {
        setUser({
            uid: 'user-1',
            email: '',
            nombre: perfil.nombre || 'Usuario',
            peso_kg: +perfil.peso || 82,
            talla_cm: +perfil.talla || 175,
            sexo: perfil.sexo as 'M' | 'F',
            fcMax: +perfil.fcMax || 185,
            fcReposo_basal: +perfil.fcReposo || 48,
            insulinas: {
                basal: { nombre: perfil.basalNombre, dosis_u: +perfil.basalDosis, hora: perfil.basalHora },
                bolus: { nombre: perfil.boluNombre, ratio_cho: +perfil.ratioCHO, sensibilidad_mgdl_por_u: +perfil.sensibilidad },
            },
            horarioEntrenamiento: perfil.horaTrain,
            deportes: ['running', 'ciclismo'],
            termsAcceptedAt: new Date(),
        })
        onComplete()
    }

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '24px 20px calc(40px + env(safe-area-inset-bottom))' }}>
            <div style={{ width: '100%', maxWidth: 460 }}>

                {/* Dots */}
                <div className="step-dots" style={{ justifyContent: 'flex-start', marginBottom: 28 }}>
                    {STEPS.map((_, i) => (
                        <div key={i} className={`step-dot ${i <= step ? 'active' : ''}`} style={i < step ? { background: 'var(--success)', width: 8 } : {}} />
                    ))}
                </div>

                <div className="onboard-step">{`Paso ${step + 1} de ${STEPS.length}`}</div>

                {/* PASO 0 — Disclaimer */}
                {step === 0 && (
                    <div className="animate-up">
                        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>⚡</div>
                        <h1 style={{ marginBottom: 8 }}>Bienvenido a Antigravity</h1>
                        <p style={{ marginBottom: 20, fontSize: '1rem' }}>Tu Performance OS para DM1 — glucosa, entrenamiento, nutrición en un solo lugar.</p>

                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, maxHeight: 240, overflowY: 'auto', marginBottom: 16, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}
                            onScroll={e => { const el = e.currentTarget; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setScrolled(true) }}>
                            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>DISCLAIMER Y CONSENTIMIENTO INFORMADO</strong>
                            <p>Antigravity es una herramienta de apoyo y visualización de datos de salud para uso personal. <strong>No es un dispositivo médico certificado</strong> bajo la regulación chilena (Ley 19.300, normas ISP) ni bajo FDA/CE.</p>
                            <br />
                            <p>Esta aplicación <strong>NO</strong>:<br />
                                • Reemplaza la evaluación ni la indicación de tu endocrinólogo u otro médico<br />
                                • Constituye diagnóstico médico<br />
                                • Prescribe tratamientos ni modificaciones de insulina<br />
                                • Garantiza la exactitud de los datos de terceros (Abbott LibreLinkUp, Apple Health)</p>
                            <br />
                            <p>Al continuar, declaras que:<br />
                                1. Eres mayor de 18 años y actúas de manera autónoma.<br />
                                2. Usarás esta herramienta como apoyo personal, no como guía clínica vinculante.<br />
                                3. Reconoces que el manejo de la DM1 durante ejercicio implica riesgos inherentes que debes gestionar con tu equipo de salud.<br />
                                4. Has leído y comprendido este disclaimer.</p>
                            <br />
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Versión del disclaimer: 1.0 · {new Date().toLocaleDateString('es-CL')}</p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
                            <input type="checkbox" id="accept" checked={accepted} onChange={e => setAccepted(e.target.checked)}
                                style={{ width: 20, height: 20, marginTop: 2, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                            <label htmlFor="accept" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.5 }}>
                                He leído el disclaimer completo y acepto los términos de uso de Antigravity.
                            </label>
                        </div>
                        <button className="btn btn--primary btn--full btn--lg"
                            disabled={!accepted || !scrolled}
                            onClick={() => setStep(1)}
                            title={!scrolled ? 'Lee el disclaimer completo primero' : ''}>
                            {!scrolled ? 'Lee el disclaimer completo ↑' : 'Acepto y continuar →'}
                        </button>
                    </div>
                )}

                {/* PASO 1 — Perfil */}
                {step === 1 && (
                    <div className="animate-up">
                        <h2 style={{ marginBottom: 6 }}>Tu perfil</h2>
                        <p style={{ marginBottom: 24 }}>Información básica para contextualizar tu plan.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="input-group">
                                <label className="input-label">Nombre</label>
                                <input className="input" placeholder="Dr. Nombre Apellido" value={perfil.nombre} onChange={e => update('nombre', e.target.value)} />
                            </div>
                            <div className="grid-2" style={{ gap: 10 }}>
                                <div className="input-group">
                                    <label className="input-label">Peso (kg)</label>
                                    <input className="input" type="number" placeholder="82" value={perfil.peso} onChange={e => update('peso', e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Talla (cm)</label>
                                    <input className="input" type="number" placeholder="180" value={perfil.talla} onChange={e => update('talla', e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Sexo biológico</label>
                                <select className="input" value={perfil.sexo} onChange={e => update('sexo', e.target.value)}>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button className="btn btn--secondary" onClick={() => setStep(0)}>← Atrás</button>
                            <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => setStep(2)}>Continuar →</button>
                        </div>
                    </div>
                )}

                {/* PASO 2 — Insulina */}
                {step === 2 && (
                    <div className="animate-up">
                        <h2 style={{ marginBottom: 6 }}>Tu insulinoterapia</h2>
                        <p style={{ marginBottom: 24 }}>Para contextualizar tus datos. Solo tú tienes acceso a esta información.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 12 }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Insulina Basal</p>
                                <div className="grid-3" style={{ gap: 8 }}>
                                    <div className="input-group">
                                        <label className="input-label">Nombre</label>
                                        <input className="input" value={perfil.basalNombre} onChange={e => update('basalNombre', e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Dosis (U)</label>
                                        <input className="input" type="number" value={perfil.basalDosis} onChange={e => update('basalDosis', e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Hora</label>
                                        <input className="input" type="time" value={perfil.basalHora} onChange={e => update('basalHora', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 12 }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Insulina Rápida (Bolus)</p>
                                <div className="grid-3" style={{ gap: 8 }}>
                                    <div className="input-group">
                                        <label className="input-label">Nombre</label>
                                        <input className="input" value={perfil.boluNombre} onChange={e => update('boluNombre', e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Ratio CHO (U/10g)</label>
                                        <input className="input" type="number" value={perfil.ratioCHO} onChange={e => update('ratioCHO', e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Sensibilidad (mg/dL/U)</label>
                                        <input className="input" type="number" value={perfil.sensibilidad} onChange={e => update('sensibilidad', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button className="btn btn--secondary" onClick={() => setStep(1)}>← Atrás</button>
                            <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Continuar →</button>
                        </div>
                    </div>
                )}

                {/* PASO 3 — Entrenamiento */}
                {step === 3 && (
                    <div className="animate-up">
                        <h2 style={{ marginBottom: 6 }}>Entrenamiento</h2>
                        <p style={{ marginBottom: 24 }}>Para calcular zonas y personalizar el plan.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="grid-2" style={{ gap: 10 }}>
                                <div className="input-group">
                                    <label className="input-label">FC máxima (lpm)</label>
                                    <input className="input" type="number" value={perfil.fcMax} onChange={e => update('fcMax', e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">FC reposo basal (lpm)</label>
                                    <input className="input" type="number" value={perfil.fcReposo} onChange={e => update('fcReposo', e.target.value)} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Hora habitual de entrenamiento</label>
                                <input className="input" type="time" value={perfil.horaTrain} onChange={e => update('horaTrain', e.target.value)} />
                            </div>
                            <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 12, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                📊 FC máx = 220 − edad es una estimación. Si conoces tu FCmax real (ej: de un test máximo), úsala — es más precisa para calcular zonas Z2.
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                            <button className="btn btn--secondary" onClick={() => setStep(2)}>← Atrás</button>
                            <button className="btn btn--primary" style={{ flex: 1 }} onClick={() => setStep(4)}>Continuar →</button>
                        </div>
                    </div>
                )}

                {/* PASO 4 — Conectar datos */}
                {step === 4 && (
                    <div className="animate-up">
                        <h2 style={{ marginBottom: 6 }}>Conecta tus datos</h2>
                        <p style={{ marginBottom: 20 }}>Puedes hacer esto ahora o más tarde desde Ajustes → Integraciones.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                            {[
                                { icon: '🩸', title: 'LibreView CSV', desc: 'Importa tu historial de glucosa desde libreview.com', action: 'Importar más tarde' },
                                { icon: '⌚', title: 'Apple Watch', desc: 'iOS Shortcut webhook · actualización ~15 min', action: 'Configurar más tarde' },
                            ].map(item => (
                                <div key={item.title} style={{ padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                                    </div>
                                    <button className="btn btn--ghost btn--sm" style={{ flexShrink: 0, fontSize: '0.75rem' }}>→</button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn--secondary" onClick={() => setStep(3)}>← Atrás</button>
                            <button className="btn btn--primary btn--lg" style={{ flex: 1 }} onClick={saveAndComplete}>
                                🚀 Entrar a Antigravity
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
