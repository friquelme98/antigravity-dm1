import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, Droplets, Activity, Zap, Apple, AlertTriangle } from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts'
import { useStore } from '../store'
import { trendArrow, glucoseStatus } from '../lib/glucose'

export default function Dashboard() {
    const { readings, dailySummaries, workouts, meals, insights, user } = useStore()

    // Última lectura de glucosa
    const latest = readings[readings.length - 1]
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const todaySummary = dailySummaries.find(s => s.date === todayStr)

    // Mini gráfico últimas 3h
    const now = Date.now()
    const last3h = readings
        .filter(r => now - r.timestamp.getTime() < 3 * 3600 * 1000)
        .map(r => ({ time: format(r.timestamp, 'HH:mm'), value: r.value_mgdl }))

    // Semana actual
    const weekSummaries = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
            return dailySummaries.find(s => s.date === d)
        }).filter(Boolean)
        return days as typeof dailySummaries
    }, [dailySummaries])

    const weekTIR = weekSummaries.length > 0
        ? Math.round(weekSummaries.reduce((s, d) => s + d.tir_pct, 0) / weekSummaries.length)
        : 0

    // Sesión de hoy
    const todayWorkout = workouts.find(w => {
        const d = format(w.startTime, 'yyyy-MM-dd')
        return d === todayStr
    })

    // Comidas de hoy
    const todayMeals = meals.filter(m => format(m.timestamp, 'yyyy-MM-dd') === todayStr)
    const todayCHO = todayMeals.reduce((s, m) => s + m.macros.cho_g, 0)
    const todayPRO = todayMeals.reduce((s, m) => s + m.macros.proteina_g, 0)
    const todayKcal = todayMeals.reduce((s, m) => s + m.macros.kcal, 0)

    const activeInsights = insights.filter(i => i.activo && !i.descartado)

    const glucoseColor = latest
        ? glucoseStatus(latest.value_mgdl) === 'tir' ? 'var(--success)'
            : glucoseStatus(latest.value_mgdl) === 'tar' ? 'var(--warning)'
                : 'var(--danger)'
        : 'var(--text-secondary)'

    const hora = new Date().getHours()
    const greeting = hora < 6 ? '🌙 Madrugar vale la pena' : hora < 12 ? '☀️ Buenos días' : hora < 19 ? '👋 Buenas tardes' : '🌙 Buenas noches'

    return (
        <div className="animate-up" style={{ maxWidth: 900 }}>
            {/* Header */}
            <div className="page-header">
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 4 }}>
                    {greeting} · {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                </p>
                <h1 className="page-title">
                    {user?.nombre?.split(' ')[1] ? `Dr. ${user.nombre.split(' ')[1]}` : 'Dashboard'}
                </h1>
            </div>

            {/* GLUCOSA HERO */}
            <div className="card card--elevated" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #141420 0%, #1a1a2e 100%)', border: '1px solid var(--border-strong)' }}>
                <div className="flex-between" style={{ marginBottom: 16 }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Glucosa actual</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            {latest ? (
                                <>
                                    <span className="glucose-value" style={{ color: glucoseColor }}>{latest.value_mgdl}</span>
                                    <span className="glucose-unit">mg/dL</span>
                                    <span className="glucose-trend">{trendArrow(latest.trend)}</span>
                                </>
                            ) : (
                                <span style={{ fontSize: '1.5rem', color: 'var(--text-tertiary)' }}>Sin datos</span>
                            )}
                        </div>
                        {latest && (
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                hace {Math.round((now - latest.timestamp.getTime()) / 60000)} min · {glucoseStatus(latest.value_mgdl) === 'tir' ? '✅ En rango' : glucoseStatus(latest.value_mgdl) === 'tar' ? '⚠️ Alto' : '🔻 Bajo'}
                            </p>
                        )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="stat-value" style={{ color: weekTIR >= 70 ? 'var(--success)' : weekTIR >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                            {weekTIR}%
                        </div>
                        <div className="stat-label">TIR semana</div>
                        <div className="stat-sublabel">meta: ≥70%</div>
                    </div>
                </div>

                {/* Mini chart */}
                {last3h.length > 2 && (
                    <div style={{ height: 80, marginBottom: 12 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={last3h} margin={{ top: 4, right: 4, bottom: 0, left: -30 }}>
                                <ReferenceArea y1={70} y2={180} fill="rgba(48,209,88,0.08)" />
                                <ReferenceLine y={70} stroke="var(--danger)" strokeDasharray="3 3" strokeWidth={1} />
                                <ReferenceLine y={180} stroke="var(--warning)" strokeDasharray="3 3" strokeWidth={1} />
                                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
                                <YAxis domain={[50, 250]} tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
                                <Line type="monotone" dataKey="value" stroke={glucoseColor} strokeWidth={2.5} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* TIR bar */}
                {todaySummary && (
                    <div>
                        <div className="flex-between" style={{ marginBottom: 6 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>TIR hoy</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>TBR {todaySummary.tbr_pct}% · TIR {todaySummary.tir_pct}% · TAR {todaySummary.tar_pct}%</span>
                        </div>
                        <div className="tir-bar">
                            <div className="tir-segment tir-tbr" style={{ width: `${todaySummary.tbr_pct}%` }} />
                            <div className="tir-segment tir-tir" style={{ width: `${todaySummary.tir_pct}%` }} />
                            <div className="tir-segment tir-tar" style={{ width: `${todaySummary.tar_pct}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Métricas rápidas */}
            <div className="grid-4" style={{ marginBottom: 16 }}>
                {[
                    { label: 'CV', value: todaySummary ? `${todaySummary.cv_pct}%` : '—', sublabel: 'objetivo <36%', color: todaySummary && todaySummary.cv_pct > 36 ? 'var(--warning)' : 'var(--text-primary)' },
                    { label: 'Prom.', value: todaySummary ? `${todaySummary.avg_mgdl}` : '—', sublabel: 'mg/dL hoy', color: 'var(--text-primary)' },
                    { label: 'eA1c', value: todaySummary ? `${todaySummary.calculated_eA1c}%` : '—', sublabel: '14 días', color: 'var(--text-primary)' },
                    { label: 'Hipos', value: todaySummary ? String(todaySummary.hypo_events) : '0', sublabel: 'hoy', color: todaySummary && todaySummary.hypo_events > 0 ? 'var(--danger)' : 'var(--text-primary)' },
                ].map(s => (
                    <div key={s.label} className="card stat-card">
                        <div className="stat-value" style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-sublabel">{s.sublabel}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
                {/* Sesión de hoy */}
                <div className="card">
                    <div className="flex-between" style={{ marginBottom: 12 }}>
                        <div className="flex-row gap-8">
                            <Activity size={18} color="var(--info)" />
                            <h4>Plan de hoy</h4>
                        </div>
                        <span className="badge badge--neutral">5:00 AM</span>
                    </div>
                    {todayWorkout ? (
                        <div>
                            <div className="flex-row" style={{ marginBottom: 8 }}>
                                <span style={{ fontSize: '1.25rem' }}>{todayWorkout.type === 'running' ? '🏃' : '🚴'}</span>
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        {todayWorkout.type === 'running' ? 'Running' : 'Ciclismo'} · {todayWorkout.duration_min} min
                                    </div>
                                    {todayWorkout.metrics.fc_media && (
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                            FC media: {todayWorkout.metrics.fc_media} lpm · RPE: {todayWorkout.percepcion?.rpe ?? '—'}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="badge badge--success">✓ Completada</span>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: '1.25rem' }}>🏃</span>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Running Z2 · 45 min</div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Requiere glucosa pre ≥90 mg/dL</div>
                                </div>
                            </div>
                            <span className="badge badge--neutral">○ Pendiente</span>
                        </div>
                    )}
                </div>

                {/* Nutrición hoy */}
                <div className="card">
                    <div className="flex-between" style={{ marginBottom: 12 }}>
                        <div className="flex-row gap-8">
                            <Apple size={18} color="var(--success)" />
                            <h4>Nutrición hoy</h4>
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{todayMeals.length} comidas</span>
                    </div>
                    {todayMeals.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div className="grid-3" style={{ gap: 8 }}>
                                {[
                                    { label: 'CHO', value: `${todayCHO}g`, color: 'var(--warning)' },
                                    { label: 'PRO', value: `${todayPRO}g`, color: 'var(--info)' },
                                    { label: 'kcal', value: String(todayKcal), color: 'var(--text-primary)' },
                                ].map(m => (
                                    <div key={m.label} style={{ textAlign: 'center' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.125rem', color: m.color }}>{m.value}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {todayMeals.slice(0, 3).map(m => (
                                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{m.descripcion}</span>
                                        <span style={{ color: 'var(--text-tertiary)' }}>{format(m.timestamp, 'HH:mm')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Sin comidas registradas hoy.<br />Usa el botón ⚡ para agregar rápido.</p>
                    )}
                </div>
            </div>

            {/* Insights activos */}
            {activeInsights.length > 0 && (
                <div>
                    <div className="section-header">
                        <div className="flex-row gap-8">
                            <Zap size={18} color="var(--primary-light)" />
                            <h3>Insights activos</h3>
                        </div>
                        <span className="badge badge--primary">{activeInsights.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {activeInsights.slice(0, 2).map(ins => (
                            <InsightCard key={ins.id} insight={ins} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function InsightCard({ insight }: { insight: { id: string; texto_corto: string; texto_detalle: string; nivel_confianza: string; accion_sugerida?: string; fuente?: string } }) {
    const { dismissInsight } = useStore()
    const borderColor = insight.nivel_confianza === 'alto' ? 'var(--success)' : insight.nivel_confianza === 'medio' ? 'var(--warning)' : 'var(--info)'

    return (
        <div className="card" style={{ borderLeft: `3px solid ${borderColor}`, paddingLeft: 16 }}>
            <div className="flex-between" style={{ marginBottom: 6 }}>
                <div className="flex-row gap-8">
                    <span className={`badge badge--${insight.nivel_confianza === 'alto' ? 'success' : insight.nivel_confianza === 'medio' ? 'warning' : 'primary'}`}>
                        {insight.nivel_confianza} confianza
                    </span>
                </div>
                <button className="btn btn--icon btn--ghost btn--sm" onClick={() => dismissInsight(insight.id)}>
                    <AlertTriangle size={14} />
                </button>
            </div>
            <h4 style={{ marginBottom: 4 }}>{insight.texto_corto}</h4>
            <p style={{ fontSize: '0.8125rem', lineHeight: 1.5, marginBottom: insight.accion_sugerida ? 10 : 0 }}>{insight.texto_detalle}</p>
            {insight.accion_sugerida && (
                <div style={{ background: 'var(--bg-overlay)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--text-tertiary)', marginRight: 4 }}>Considerar:</span>
                    {insight.accion_sugerida}
                </div>
            )}
            {insight.fuente && (
                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 8 }}>Fuente: {insight.fuente}</p>
            )}
        </div>
    )
}
