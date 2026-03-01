import { useStore } from '../store'

export default function InsightsPage() {
    const { insights, dismissInsight } = useStore()
    const active = insights.filter(i => i.activo && !i.descartado)
    const dismissed = insights.filter(i => i.descartado)

    const confidenceColor: Record<string, string> = {
        alto: 'var(--success)', medio: 'var(--warning)', bajo: 'var(--info)'
    }

    const tipoEmoji: Record<string, string> = {
        hipo_pre_ejercicio: '🔻', hipo_tardia: '⏰', fatiga_acumulada: '😴',
        cetosis_riesgo: '⚠️', craving_patron: '🧠', progresion_carga: '📈',
        fc_reposo_alta: '💓', tir_bajo: '📊',
    }

    return (
        <div className="animate-up" style={{ maxWidth: 860 }}>
            <div className="page-header">
                <h1 className="page-title">Insights</h1>
                <p className="page-subtitle">Patrones detectados y recomendaciones no prescriptivas</p>
            </div>

            <div className="disclaimer-banner" style={{ marginBottom: 20 }}>
                ℹ️ Los insights de Antigravity son sugerencias basadas en tus datos y en guías clínicas publicadas. No constituyen prescripción médica ni reemplazan la evaluación de tu endocrinólogo o equipo de salud.
            </div>

            {active.length === 0 && dismissed.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚡</div>
                    <h3 style={{ marginBottom: 8 }}>Sin insights activos</h3>
                    <p>Los insights se generan cuando hay suficientes datos históricos (≥7 días) y se detectan patrones relevantes.</p>
                </div>
            )}

            {active.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ marginBottom: 14 }}>Insights activos ({active.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {active.map(ins => (
                            <div key={ins.id} className="card" style={{ borderLeft: `3px solid ${confidenceColor[ins.nivel_confianza]}` }}>
                                <div className="flex-between" style={{ marginBottom: 10 }}>
                                    <div className="flex-row gap-8">
                                        <span style={{ fontSize: '1.25rem' }}>{tipoEmoji[ins.tipo] || '💡'}</span>
                                        <div>
                                            <h4>{ins.texto_corto}</h4>
                                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                                <span className={`badge badge--${ins.nivel_confianza === 'alto' ? 'success' : ins.nivel_confianza === 'medio' ? 'warning' : 'primary'}`}>
                                                    {ins.nivel_confianza} confianza
                                                </span>
                                                <span className="badge badge--neutral">{ins.tipo.replace(/_/g, ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn--ghost btn--sm" onClick={() => dismissInsight(ins.id)}
                                        title="Descartar este insight">
                                        ✕
                                    </button>
                                </div>

                                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 12 }}>
                                    {ins.texto_detalle}
                                </p>

                                {ins.accion_sugerida && (
                                    <div style={{ background: 'var(--bg-overlay)', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                                            Considerar (no prescriptivo)
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{ins.accion_sugerida}</p>
                                    </div>
                                )}

                                {ins.fuente && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', gap: 6, alignItems: 'center' }}>
                                        📚 Fuente: {ins.fuente}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cómo funcionan los insights */}
            <div className="card">
                <h4 style={{ marginBottom: 12 }}>¿Cómo se generan los insights?</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {[
                        { titulo: '🩸 Hipo pre-ejercicio', desc: 'Se activa si en los últimos 7 días ≥2 sesiones iniciaron con glucosa <90 mg/dL. Fuente: ADA 2024 §15.' },
                        { titulo: '⏰ Hipoglicemia tardía', desc: 'Detecta si ≥2 episodios TBR ocurren en ventana 2–6h post sesión matinal. Fuente: Riddell MC et al. Lancet D&E 2017.' },
                        { titulo: '😴 Fatiga acumulada', desc: 'Se activa si carga semanal actual >130% de la semana anterior (TRIMP). Fuente: Banister 1991.' },
                        { titulo: '📊 TIR bajo meta', desc: 'TIR <70% en los últimos 7 días con ≥5 días de datos. Fuente: ATTD 2023.' },
                        { titulo: '💓 FC reposo alta', desc: 'FC reposo promedio 7 días supera en >10% la basal del usuario. Requiere datos Apple Health.' },
                    ].map(({ titulo, desc }) => (
                        <div key={titulo} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{titulo}</div>
                            <div>{desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {dismissed.length > 0 && (
                <details style={{ marginTop: 20 }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.875rem', padding: '8px 0' }}>
                        Insights descartados ({dismissed.length})
                    </summary>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                        {dismissed.map(ins => (
                            <div key={ins.id} className="card" style={{ opacity: 0.5 }}>
                                <div className="flex-row gap-8">
                                    <span>{tipoEmoji[ins.tipo] || '💡'}</span>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{ins.texto_corto}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </details>
            )}
        </div>
    )
}
