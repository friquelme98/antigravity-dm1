import { useState } from 'react'
import { format } from 'date-fns'
import { useStore } from '../store'

export default function MealsPage() {
    const { meals } = useStore()
    const [filter, setFilter] = useState<string>('all')

    const TIMINGS = ['all', 'pre_entreno', 'post_entreno', 'desayuno', 'almuerzo', 'cena', 'snack', 'rescate_hipo']

    const filtered = filter === 'all' ? meals : meals.filter(m => m.timing === filter)

    const totalCHO = filtered.reduce((s, m) => s + m.macros.cho_g, 0)
    const totalPRO = filtered.reduce((s, m) => s + m.macros.proteina_g, 0)
    const totalKcal = filtered.reduce((s, m) => s + m.macros.kcal, 0)

    const timingLabel: Record<string, string> = {
        pre_entreno: '🏃 Pre-entreno', post_entreno: '🔄 Post-entreno',
        desayuno: '☀️ Desayuno', almuerzo: '🍱 Almuerzo',
        cena: '🌙 Cena', snack: '🍌 Snack', rescate_hipo: '🔻 Rescate hipo',
    }

    return (
        <div className="animate-up" style={{ maxWidth: 860 }}>
            <div className="page-header">
                <h1 className="page-title">Comidas</h1>
                <p className="page-subtitle">Registro de alimentación y cravings</p>
            </div>

            {/* Macros totales */}
            <div className="grid-3" style={{ marginBottom: 20 }}>
                {[
                    { label: 'CHO total', value: `${totalCHO}g`, color: 'var(--warning)' },
                    { label: 'Proteína', value: `${totalPRO}g`, color: 'var(--info)' },
                    { label: 'Kcal', value: String(totalKcal), color: 'var(--text-primary)' },
                ].map(m => (
                    <div key={m.label} className="card stat-card">
                        <div className="stat-value" style={{ color: m.color }}>{m.value}</div>
                        <div className="stat-label">{m.label}</div>
                        <div className="stat-sublabel">{filtered.length} registros</div>
                    </div>
                ))}
            </div>

            {/* Filtro timing */}
            <div className="scroll-x" style={{ marginBottom: 16, display: 'flex', gap: 6 }}>
                {TIMINGS.map(t => (
                    <button key={t}
                        className={`btn btn--sm ${filter === t ? 'btn--primary' : 'btn--secondary'}`}
                        onClick={() => setFilter(t)}>
                        {t === 'all' ? 'Todos' : (timingLabel[t] || t).replace(/^[^ ]+ /, '')}
                    </button>
                ))}
            </div>

            {/* Lista de comidas */}
            {filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🍽️</div>
                    <h3 style={{ marginBottom: 8 }}>Sin comidas registradas</h3>
                    <p>Usa el botón ⚡ para registrar tu próxima comida rápidamente.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map(m => (
                        <div key={m.id} className="card card--interactive">
                            <div className="flex-between" style={{ marginBottom: 6 }}>
                                <div className="flex-row gap-8">
                                    <span style={{ fontSize: '1rem' }}>{timingLabel[m.timing]?.split(' ')[0] || '🍽️'}</span>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{m.descripcion}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                            {format(m.timestamp, 'HH:mm')} · {m.fuente_macros}
                                        </div>
                                    </div>
                                </div>
                                <span className="badge badge--neutral">{timingLabel[m.timing]?.replace(/^[^ ]+ /, '') || m.timing}</span>
                            </div>
                            <div className="grid-4" style={{ gap: 8 }}>
                                {[
                                    { l: 'CHO', v: m.macros.cho_g, c: 'var(--warning)' },
                                    { l: 'PRO', v: m.macros.proteina_g, c: 'var(--info)' },
                                    { l: 'GRA', v: m.macros.grasa_g, c: 'var(--text-secondary)' },
                                    { l: 'kcal', v: m.macros.kcal, c: 'var(--text-primary)' },
                                ].map(({ l, v, c }) => (
                                    <div key={l} style={{ textAlign: 'center', padding: '6px 4px', background: 'var(--bg-overlay)', borderRadius: 8 }}>
                                        <div style={{ fontWeight: 700, color: c, fontSize: '1rem' }}>{v}g</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{l}</div>
                                    </div>
                                ))}
                            </div>
                            {m.bolo_u && (
                                <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                    💉 Bolo: {m.bolo_u} U Novorapid
                                </div>
                            )}
                            {m.craving && m.craving.intensidad > 0 && (
                                <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    🧠 Craving: {m.craving.intensidad}/10 · {m.craving.contexto.join(', ')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Plantillas rápidas */}
            <div className="card" style={{ marginTop: 20 }}>
                <h4 style={{ marginBottom: 12 }}>💡 Snacks de rescate para hipo</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.875rem' }}>
                    {[
                        { item: 'Tabletas de glucosa ×3', cho: 15, tiempo: '~15 min' },
                        { item: 'Jugo de naranja 150 mL', cho: 18, tiempo: '~15 min' },
                        { item: 'Gel energético (maltodextrina)', cho: 25, tiempo: '~10 min' },
                        { item: 'Plátano pequeño', cho: 20, tiempo: '~20 min' },
                    ].map(s => (
                        <div key={s.item} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{s.item}</span>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{s.cho}g CHO</span>
                                <span style={{ color: 'var(--text-tertiary)' }}>{s.tiempo}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 10 }}>
                    Regla 15-15: 15g CHO y remide a los 15 min. Si persiste, repetir. Fuente: ADA 2024.
                </p>
            </div>
        </div>
    )
}
