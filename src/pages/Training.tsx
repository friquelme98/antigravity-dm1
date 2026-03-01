import { useState, useRef } from 'react'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Upload, CheckCircle, Watch, Smartphone, Info } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { useStore } from '../store'

// Plan de 12 semanas base Z2
const PLAN_12_SEMANAS = [
    {
        numero: 1, tipo: 'base' as const, deload: false, carga: 360, sesiones: [
            { dia: 'lun', tipo: 'running', zona: 'Z2', min: 40, desc: 'Carrera Z2 continua. Glucosa pre ≥90 mg/dL.' },
            { dia: 'mie', tipo: 'ciclismo', zona: 'Z2', min: 55, desc: 'Ciclismo Z2. Baja intensidad.' },
            { dia: 'vie', tipo: 'running', zona: 'Z2', min: 45, desc: 'Running suave Z2.' },
            { dia: 'sab', tipo: 'running', zona: 'Z2', min: 65, desc: 'Long run Z2. Llevar gel de rescate.' },
        ]
    },
    {
        numero: 2, tipo: 'base' as const, deload: false, carga: 396, sesiones: [
            { dia: 'lun', tipo: 'running', zona: 'Z2', min: 44, desc: 'Carrera Z2 +10% vs semana 1.' },
            { dia: 'mie', tipo: 'ciclismo', zona: 'Z2', min: 60, desc: 'Ciclismo Z2.' },
            { dia: 'vie', tipo: 'running', zona: 'Z2', min: 50, desc: 'Running Z2.' },
            { dia: 'sab', tipo: 'running', zona: 'Z2', min: 72, desc: 'Long run Z2.' },
        ]
    },
    {
        numero: 3, tipo: 'base' as const, deload: false, carga: 436, sesiones: [
            { dia: 'lun', tipo: 'running', zona: 'Z2', min: 48, desc: 'Carrera Z2.' },
            { dia: 'mie', tipo: 'ciclismo', zona: 'Z2', min: 66, desc: 'Ciclismo Z2.' },
            { dia: 'vie', tipo: 'running', zona: 'Z2', min: 55, desc: 'Running Z2.' },
            { dia: 'sab', tipo: 'running', zona: 'Z2', min: 80, desc: 'Long run Z2. Snack post obligatorio.' },
        ]
    },
    {
        numero: 4, tipo: 'deload' as const, deload: true, carga: 260, sesiones: [
            { dia: 'lun', tipo: 'running', zona: 'Z1', min: 30, desc: 'Semana DELOAD. Baja intensidad y duración.' },
            { dia: 'jue', tipo: 'ciclismo', zona: 'Z1', min: 40, desc: 'Ciclismo suave.' },
            { dia: 'sab', tipo: 'running', zona: 'Z2', min: 45, desc: 'Long run corto.' },
        ]
    },
]

const ZONE_COLORS: Record<string, string> = {
    Z1: '#8E8E93', Z2: '#30D158', Z3: '#FF9F0A', Z4: '#FF453A', Z5: '#BF0000'
}

export default function TrainingPage() {
    const [tab, setTab] = useState<'plan' | 'carga' | 'apple'>('plan')
    const [semana, setSemana] = useState(1)
    const { workouts, addToast } = useStore()

    const semanaActual = PLAN_12_SEMANAS[semana - 1]

    // Carga semanal última 8 semanas (mock)
    const cargaData = Array.from({ length: 8 }, (_, i) => ({
        semana: `S${i + 1}`,
        trimp: [320, 360, 396, 180, 440, 480, 260, 360][i] || 0,
        target: 360 + i * 36,
    }))

    const weekWorkouts = workouts.filter(w => {
        const d = w.startTime
        const weekStart = subDays(new Date(), 7)
        return d >= weekStart
    })

    return (
        <div className="animate-up" style={{ maxWidth: 900 }}>
            <div className="page-header">
                <h1 className="page-title">Entrenamiento</h1>
                <p className="page-subtitle">Plan 12 semanas · Base Z2</p>
            </div>

            {/* Tabs */}
            <div className="scroll-x" style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
                {[
                    { key: 'plan', label: '📅 Plan 12 semanas' },
                    { key: 'carga', label: '📊 Carga semanal' },
                    { key: 'apple', label: '⌚ Apple Watch' },
                ].map(t => (
                    <button key={t.key}
                        className="btn btn--ghost btn--sm"
                        style={{ borderRadius: '6px 6px 0 0', borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent', color: tab === t.key ? 'var(--primary-light)' : 'var(--text-secondary)' }}
                        onClick={() => setTab(t.key as typeof tab)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* PLAN */}
            {tab === 'plan' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Selector semana */}
                    <div className="card" style={{ padding: '12px 16px' }}>
                        <div className="flex-between" style={{ marginBottom: 12 }}>
                            <h4>Seleccionar semana</h4>
                            <span className={`badge ${semanaActual?.deload ? 'badge--warning' : 'badge--primary'}`}>
                                {semanaActual?.deload ? '🔄 Deload' : `Sem. ${semana} · ${semanaActual?.tipo}`}
                            </span>
                        </div>
                        <div className="scroll-x" style={{ display: 'flex', gap: 6 }}>
                            {PLAN_12_SEMANAS.map(s => (
                                <button key={s.numero}
                                    className={`btn btn--sm ${semana === s.numero ? 'btn--primary' : s.deload ? 'btn--secondary' : 'btn--secondary'}`}
                                    style={s.deload ? { border: '1px solid var(--warning)', color: 'var(--warning)' } : {}}
                                    onClick={() => setSemana(s.numero)}>
                                    S{s.numero}{s.deload ? ' 🔄' : ''}
                                </button>
                            ))}
                            {Array.from({ length: 12 - PLAN_12_SEMANAS.length }, (_, i) => (
                                <button key={`future-${i}`} disabled className="btn btn--sm btn--secondary" style={{ opacity: 0.3 }}>
                                    S{PLAN_12_SEMANAS.length + i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sesiones de la semana seleccionada */}
                    {semanaActual && (
                        <div className="card">
                            <div className="flex-between" style={{ marginBottom: 14 }}>
                                <h3>Semana {semanaActual.numero}</h3>
                                <div style={{ textAlign: 'right', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                    Carga objetivo: <strong>{semanaActual.carga}</strong> TRIMP
                                </div>
                            </div>
                            {semanaActual.deload && (
                                <div style={{ background: 'var(--warning-bg)', border: '1px solid rgba(255,159,10,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: '0.875rem', color: 'var(--warning)' }}>
                                    🔄 <strong>Semana de deload.</strong> Reduce carga al 60%. Prioriza recuperación y monitorea glucosa — la sensibilidad a la insulina puede aumentar.
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {semanaActual.sesiones.map((s, i) => {
                                    const diaLabel = { lun: 'Lunes', mar: 'Martes', mie: 'Miércoles', jue: 'Jueves', vie: 'Viernes', sab: 'Sábado', dom: 'Domingo' }[s.dia]
                                    return (
                                        <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 14px', background: 'var(--bg-overlay)', borderRadius: 12, alignItems: 'flex-start' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: ZONE_COLORS[s.zona] + '22', border: `1px solid ${ZONE_COLORS[s.zona]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                                                {s.tipo === 'running' ? '🏃' : '🚴'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="flex-between">
                                                    <div style={{ fontWeight: 600 }}>{diaLabel} — {s.tipo === 'running' ? 'Running' : 'Ciclismo'}</div>
                                                    <span className="badge badge--neutral">{s.min} min</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{s.desc}</div>
                                                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                                    <span className="badge" style={{ background: ZONE_COLORS[s.zona] + '22', color: ZONE_COLORS[s.zona] }}>Zona {s.zona}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Reglas */}
                    <div className="card">
                        <h4 style={{ marginBottom: 12 }}>⚠️ Reglas DM1 + Entrenamiento matinal</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
                            {[
                                { icon: '🩸', text: 'Glucosa pre-ejercicio: 90–150 mg/dL. Si <90: 15g CHO rápido, esperar 15 min. Si >250: no iniciar sin cetonas negativas.' },
                                { icon: '🔻', text: 'Riesgo de hipo tardía (2–6h post): no corrijas agresivo inmediatamente post sesión. Monitorea a las 2h.' },
                                { icon: '📈', text: 'Progresión máxima: +10% carga semanal. Deload cada 4 semanas (60% carga).' },
                                { icon: '🚩', text: 'Bandera roja: dolor ≥6/10 → no progresar esa semana. Reporta a tu médico.' },
                            ].map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '1rem' }}>{r.icon}</span>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sesiones registradas esta semana */}
                    {weekWorkouts.length > 0 && (
                        <div className="card">
                            <h4 style={{ marginBottom: 12 }}>Sesiones esta semana ({weekWorkouts.length})</h4>
                            {weekWorkouts.map(w => (
                                <div key={w.id} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '1.25rem' }}>{w.type === 'running' ? '🏃' : '🚴'}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600 }}>{format(w.startTime, "EEE d/M HH:mm", { locale: es })} · {w.duration_min} min</div>
                                        {w.percepcion?.rpe && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>RPE: {w.percepcion.rpe}</div>}
                                    </div>
                                    <span className="badge badge--success">✓</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* CARGA */}
            {tab === 'carga' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card">
                        <h4 style={{ marginBottom: 16 }}>Carga semanal (TRIMP) — Últimas 8 semanas</h4>
                        <div style={{ height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cargaData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="semana" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10 }} />
                                    <Bar dataKey="trimp" fill="var(--primary)" radius={[6, 6, 0, 0]} name="TRIMP real" />
                                    <Bar dataKey="target" fill="rgba(124,111,247,0.2)" radius={[6, 6, 0, 0]} name="TRIMP objetivo" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="card">
                        <h4 style={{ marginBottom: 12 }}>¿Qué es TRIMP?</h4>
                        <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                            El Training Impulse (TRIMP, Banister 1991) es una medida de carga de entrenamiento que combina duración × intensidad de FC. Permite cuantificar el estrés fisiológico de cada sesión y controlar la progresión semanal. Un TRIMP semanal de 360–500 es apropiado para un atleta DM1 en fase base. El umbral de alerta es semana_actual &gt; 1.3 × semana_anterior.
                        </p>
                    </div>
                </div>
            )}

            {/* APPLE WATCH */}
            {tab === 'apple' && <AppleWatchPanel addToast={addToast} />}
        </div>
    )
}

function AppleWatchPanel({ addToast }: { addToast: (m: string, t?: 'success' | 'error' | 'info') => void }) {
    const [showXML, setShowXML] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Método 1: XML */}
            <div className="card">
                <div className="flex-row gap-12" style={{ marginBottom: 14 }}>
                    <Smartphone size={22} color="var(--info)" />
                    <div>
                        <h3>Método 1 — Export Apple Health XML</h3>
                        <span className="badge badge--neutral">Mayor cobertura histórica</span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {[
                        'Abre la app Salud en tu iPhone',
                        'Toca tu foto de perfil (arriba derecha)',
                        'Selecciona "Exportar todos los datos de Salud"',
                        'Espera la exportación y comparte el archivo .zip',
                        'Sube el archivo "export.xml" contenido en el .zip',
                    ].map((s, i) => (
                        <div key={i} className="step-instruction">
                            <div className="step-num">{i + 1}</div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{s}</p>
                        </div>
                    ))}
                </div>
                <input ref={fileRef} type="file" accept=".xml,.zip" style={{ display: 'none' }} id="xml-upload"
                    onChange={() => addToast('✅ Archivo recibido — procesando en background', 'success')} />
                <label htmlFor="xml-upload">
                    <div className="btn btn--primary btn--full" style={{ cursor: 'pointer' }}>
                        <Upload size={18} /> Subir export.xml de Apple Health
                    </div>
                </label>
            </div>

            {/* Método 2: Shortcut */}
            <div className="card" style={{ borderColor: 'rgba(48,209,88,0.3)' }}>
                <div className="flex-row gap-12" style={{ marginBottom: 14 }}>
                    <Watch size={22} color="var(--success)" />
                    <div>
                        <h3>Método 2 — iOS Shortcut (cuasi-tiempo real)</h3>
                        <span className="badge badge--success">✅ Sin código · Actualización ~15 min</span>
                    </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>
                    Un Atajo de iOS puede leer automáticamente FC, HRV, pasos y sueño desde tu Apple Watch y enviarlos a Antigravity cada 15 minutos. Sin instalar nada adicional.
                </p>
                <button className="btn btn--secondary btn--full" onClick={() => setShowXML(!showXML)} style={{ marginBottom: showXML ? 14 : 0 }}>
                    {showXML ? 'Ocultar instrucciones' : 'Ver instrucciones paso a paso'}
                </button>
                {showXML && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[
                            'Instala la app "Atajos" (Shortcuts) en tu iPhone (ya viene preinstalada en iOS 16+)',
                            'Abre Atajos → ícono "+" arriba derecha → Nueva automatización',
                            'Selecciona "Tiempo" → cada 15 minutos',
                            'Agrega acción: "Obtener cantidad de salud" → FC reposo / Pasos / HRV',
                            'Agrega acción: "Obtener contenido de URL" → URL de tu endpoint de Antigravity → Method: POST → Body: JSON con los valores',
                            'URL del endpoint: [disponible en Ajustes → Integraciones → Apple Watch Webhook]',
                            'Activa la automatización → confirma permisos de Salud cuando los solicite',
                        ].map((s, i) => (
                            <div key={i} className="step-instruction">
                                <div className="step-num">{i + 1}</div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{s}</p>
                            </div>
                        ))}
                        <div className="disclaimer-banner" style={{ marginTop: 8 }}>
                            ℹ️ El endpoint del webhook estará disponible una vez que instales Antigravity en Firebase. En modo localhost, puedes usar ngrok para probar el flujo.
                        </div>
                        <div style={{ background: 'var(--bg-overlay)', borderRadius: 10, padding: '12px 14px' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos que se envían</p>
                            <pre style={{ fontSize: '0.8rem', color: 'var(--success)', overflowX: 'auto' }}>
                                {`{
  "timestamp": "2026-03-01T05:15:00",
  "fc_reposo": 48,
  "hrv_rmssd": 52.3,
  "pasos_dia": 1240,
  "sueño_h": 6.8,
  "fuente": "ios_shortcut"
}`}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Método 3: Futuro */}
            <div className="card" style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                <div className="flex-row gap-12" style={{ marginBottom: 8 }}>
                    <Watch size={22} color="var(--text-tertiary)" />
                    <div>
                        <h3 style={{ color: 'var(--text-secondary)' }}>Método 3 — App nativa iOS (v1 futura)</h3>
                        <span className="badge badge--neutral">Planificado · Cuasi tiempo real</span>
                    </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                    Una app iOS mínima en Swift (WKWebView + HealthKit background delivery) enviará datos cada ~5 min. Requiere cuenta de Apple Developer ($99/año) y distribución por TestFlight. Esta es la ruta hacia integración real de Apple Watch.
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    <Info size={14} />
                    Nota: Apple no permite acceso a HealthKit desde PWA/web. Esto es una limitación de iOS, no de Antigravity.
                </div>
            </div>
        </div>
    )
}

