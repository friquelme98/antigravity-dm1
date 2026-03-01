import { useState } from 'react'
import { useStore } from '../store'
import { format } from 'date-fns'

const CATALOG = [
    { id: 'whey', nombre: 'Whey Isolate', dosis: '30g', timing: 'post_entreno', emoji: '🥤', notas: 'Sin lactosa. 25g proteína.' },
    { id: 'creatina', nombre: 'Creatina Monohidrato', dosis: '5g', timing: 'cualquier momento', emoji: '💪', notas: 'Mezclar con agua. En días sin entreno también.' },
    { id: 'electrolitos', nombre: 'Electrolitos (Na/K/Mg)', dosis: '1 sobre', timing: 'pre/durante entreno', emoji: '⚡', notas: 'Especialmente importante en sesiones >45 min.' },
    { id: 'cafeina', nombre: 'Cafeína 200mg', dosis: '200mg', timing: 'pre-entreno', emoji: '☕', notas: '⚠️ Puede elevar glucosa y enmascarar síntomas de hipo. Usar con cautela.', warning: true },
    { id: 'omega3', nombre: 'Omega-3 DHA/EPA', dosis: '2g', timing: 'con comida', emoji: '🐟', notas: 'Antiinflamatorio. Sin impacto glucémico.' },
    { id: 'vitamind', nombre: 'Vitamina D3 2000 IU', dosis: '2000 IU', timing: 'con desayuno', emoji: '🌞', notas: 'Frecuente déficit en DM1. Verificar a través de nivel sérico.' },
]

export default function SupplementsPage() {
    const { addToast } = useStore()
    const [log, setLog] = useState<Record<string, boolean>>({})
    const today = format(new Date(), 'yyyy-MM-dd')

    const toggle = (id: string) => {
        setLog(prev => {
            const next = { ...prev, [id]: !prev[id] }
            if (next[id]) addToast(`✅ ${CATALOG.find(c => c.id === id)?.nombre} registrado`, 'success')
            return next
        })
    }

    const done = Object.values(log).filter(Boolean).length

    return (
        <div className="animate-up" style={{ maxWidth: 860 }}>
            <div className="page-header">
                <h1 className="page-title">Suplementos</h1>
                <p className="page-subtitle">Adherencia diaria y seguimiento</p>
            </div>

            {/* Adherencia hoy */}
            <div className="card card--elevated" style={{ marginBottom: 20 }}>
                <div className="flex-between" style={{ marginBottom: 10 }}>
                    <h4>Adherencia hoy — {today}</h4>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem', color: done === CATALOG.length ? 'var(--success)' : 'var(--text-primary)' }}>
                        {done}/{CATALOG.length}
                    </div>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(done / CATALOG.length) * 100}%`, background: done === CATALOG.length ? 'var(--success)' : 'var(--primary)' }} />
                </div>
            </div>

            {/* Catálogo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CATALOG.map(supp => (
                    <div key={supp.id} className="card" style={{ borderColor: log[supp.id] ? 'rgba(48,209,88,0.3)' : supp.warning ? 'rgba(255,159,10,0.3)' : 'var(--border)' }}>
                        <div className="flex-between">
                            <div className="flex-row gap-12">
                                <div style={{ fontSize: '1.5rem' }}>{supp.emoji}</div>
                                <div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 600 }}>{supp.nombre}</span>
                                        <span className="badge badge--neutral">{supp.dosis}</span>
                                        {supp.warning && <span className="badge badge--warning">⚠️ Precaución DM1</span>}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                        🕐 {supp.timing}
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                        {supp.notas}
                                    </div>
                                </div>
                            </div>
                            <label className="toggle" style={{ flexShrink: 0 }}>
                                <input type="checkbox" checked={!!log[supp.id]} onChange={() => toggle(supp.id)} />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            {/* Adherencia últimos 7 días (mock) */}
            <div className="card" style={{ marginTop: 20 }}>
                <h4 style={{ marginBottom: 14 }}>Adherencia últimos 7 días</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {CATALOG.slice(0, 4).map(s => {
                        const pct = Math.round(Math.random() * 40 + 60)
                        const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)'
                        return (
                            <div key={s.id}>
                                <div className="flex-between" style={{ marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.875rem' }}>{s.emoji} {s.nombre}</span>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color }}>{pct}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Nota creatina */}
            <div className="disclaimer-banner" style={{ marginTop: 16 }}>
                💡 La creatina (3–5g/día) es segura en DM1 y puede mejorar rendimiento en ejercicio de alta intensidad. No afecta la glucemia directamente. Referencia: Gualano B et al. J Strength Cond Res 2011.
            </div>
        </div>
    )
}
