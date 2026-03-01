import { useState, useRef, useEffect, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import { Upload, Download, Wifi, WifiOff, AlertCircle, Info, CheckCircle, RefreshCw, LogOut } from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts'
import { useStore } from '../store'
import { parseLibreViewCSV, computeDailySummary, glucoseStatus, trendArrow } from '../lib/glucose'
import { llLogin, llFetchGlucose, loadSession, clearSession, type LLURegion, type LLUSession } from '../lib/librelinkup'

type Tab = 'grafico' | 'metricas' | 'importar' | 'librelinkup'

export default function GlucosePage() {
    const [tab, setTab] = useState<Tab>('grafico')
    const { readings, dailySummaries, addReadings, setDailySummaries, addToast } = useStore()
    const [days, setDays] = useState(7)
    const fileRef = useRef<HTMLInputElement>(null)
    const [importing, setImporting] = useState(false)

    const cutoff = subDays(new Date(), days)
    const filtered = readings.filter(r => r.timestamp >= cutoff)
    const chartData = filtered
        .filter((_, i) => i % (days > 3 ? 3 : 1) === 0)
        .map(r => ({ time: format(r.timestamp, 'MM/dd HH:mm'), value: r.value_mgdl, trend: r.trend }))

    const latest = readings[readings.length - 1]

    const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImporting(true)
        try {
            const text = await file.text()
            const parsed = parseLibreViewCSV(text)
            if (parsed.length === 0) throw new Error('No se encontraron lecturas válidas en el archivo.')
            addReadings(parsed)

            // Recalcular summaries
            const byDay = new Map<string, typeof parsed>()
            parsed.forEach(r => {
                const d = r.timestamp.toISOString().split('T')[0]
                if (!byDay.has(d)) byDay.set(d, [])
                byDay.get(d)!.push(r)
            })
            const summaries = Array.from(byDay.entries()).map(([date, rs]) => computeDailySummary(rs, date))
            setDailySummaries(summaries)

            addToast(`✅ ${parsed.length} lecturas importadas · ${byDay.size} días`, 'success')
        } catch (err: unknown) {
            addToast(`❌ ${err instanceof Error ? err.message : 'Error al procesar el CSV'}`, 'error')
        } finally {
            setImporting(false)
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    // Métricas promedio del período
    const vals = filtered.map(r => r.value_mgdl)
    const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
    const tir = vals.length > 0 ? vals.filter(v => v >= 70 && v <= 180).length / vals.length * 100 : 0
    const tar = vals.length > 0 ? vals.filter(v => v > 180).length / vals.length * 100 : 0
    const tbr = vals.length > 0 ? vals.filter(v => v < 70).length / vals.length * 100 : 0
    const cv = vals.length > 0 && avg > 0 ? Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length) / avg * 100 : 0
    const eA1c = avg > 0 ? (avg + 46.7) / 28.7 : 0

    const TABS: { key: Tab; label: string }[] = [
        { key: 'grafico', label: '📊 Gráfico' },
        { key: 'metricas', label: '📈 Métricas' },
        { key: 'importar', label: '📥 Importar' },
        { key: 'librelinkup', label: '🔗 LibreLinkUp' },
    ]

    return (
        <div className="animate-up" style={{ maxWidth: 900 }}>
            <div className="page-header">
                <h1 className="page-title">Glucosa</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                    {latest && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: glucoseStatus(latest.value_mgdl) === 'tir' ? 'var(--success)' : glucoseStatus(latest.value_mgdl) === 'tar' ? 'var(--warning)' : 'var(--danger)' }}>
                                {latest.value_mgdl} {trendArrow(latest.trend)}
                            </span>
                            <span className="badge badge--neutral">mg/dL · {format(latest.timestamp, 'HH:mm')}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="scroll-x" style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
                {TABS.map(t => (
                    <button key={t.key}
                        className="btn btn--ghost btn--sm"
                        style={{ borderRadius: '6px 6px 0 0', borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent', color: tab === t.key ? 'var(--primary-light)' : 'var(--text-secondary)' }}
                        onClick={() => setTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* GRÁFICO */}
            {tab === 'grafico' && (
                <div>
                    {/* Selector días */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {[1, 3, 7, 14].map(d => (
                            <button key={d} className={`btn btn--sm ${days === d ? 'btn--primary' : 'btn--secondary'}`}
                                onClick={() => setDays(d)}>
                                {d === 1 ? '24h' : `${d}d`}
                            </button>
                        ))}
                    </div>

                    <div className="card" style={{ padding: '20px 10px 10px', marginBottom: 12 }}>
                        <div className="chart-container" style={{ height: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -15 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <ReferenceArea y1={70} y2={180} fill="rgba(48,209,88,0.06)" />
                                    <ReferenceLine y={70} stroke="var(--danger)" strokeDasharray="4 4" label={{ value: '70', fill: 'var(--danger)', fontSize: 9 }} />
                                    <ReferenceLine y={180} stroke="var(--warning)" strokeDasharray="4 4" label={{ value: '180', fill: 'var(--warning)', fontSize: 9 }} />
                                    <ReferenceLine y={250} stroke="rgba(255,69,58,0.4)" strokeDasharray="4 4" label={{ value: '250', fill: 'rgba(255,69,58,0.5)', fontSize: 8 }} />
                                    <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                                    <YAxis domain={[40, 300]} tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                                        formatter={(val: number) => [`${val} mg/dL`, 'Glucosa']}
                                        labelStyle={{ color: 'var(--text-secondary)' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--primary)' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* TIR bar del período */}
                    <div className="card">
                        <div className="flex-between" style={{ marginBottom: 12 }}>
                            <h4>Distribución {days === 1 ? '24h' : `${days} días`}</h4>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                            {[
                                { label: 'TBR <70', val: tbr, color: 'var(--danger)' },
                                { label: 'TIR 70–180', val: tir, color: 'var(--success)' },
                                { label: 'TAR >180', val: tar, color: 'var(--warning)' },
                            ].map(({ label, val, color }) => (
                                <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.375rem', fontWeight: 700, color }}>{Math.round(val)}%</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="tir-bar" style={{ height: 14 }}>
                            <div className="tir-segment tir-tbr" style={{ width: `${tbr}%` }} />
                            <div className="tir-segment tir-tir" style={{ width: `${tir}%` }} />
                            <div className="tir-segment tir-tar" style={{ width: `${tar}%` }} />
                        </div>
                    </div>
                </div>
            )}

            {/* MÉTRICAS */}
            {tab === 'metricas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="grid-2">
                        {[
                            { label: 'Promedio glucosa', value: `${Math.round(avg)} mg/dL`, sub: `(${days}d)`, color: 'var(--text-primary)' },
                            { label: 'eA1c estimada', value: `${eA1c.toFixed(1)}%`, sub: 'fórmula Nathan 2008', color: avg > 154 ? 'var(--warning)' : 'var(--success)' },
                            { label: 'Coef. de Variación', value: `${cv.toFixed(1)}%`, sub: `objetivo <36%`, color: cv > 36 ? 'var(--warning)' : 'var(--success)' },
                            { label: 'Lecturas totales', value: String(filtered.length), sub: `${days} días`, color: 'var(--text-primary)' },
                        ].map(m => (
                            <div key={m.label} className="card stat-card">
                                <div className="stat-value" style={{ color: m.color }}>{m.value}</div>
                                <div className="stat-label">{m.label}</div>
                                <div className="stat-sublabel">{m.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Daily summaries table */}
                    <div className="card">
                        <h4 style={{ marginBottom: 14 }}>Resumen diario</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)' }}>
                                        {['Fecha', 'Prom', 'TIR%', 'TAR%', 'TBR%', 'CV%', 'Hipos'].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailySummaries.slice(-days).reverse().map(s => (
                                        <tr key={s.date} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '8px 8px' }}>{s.date}</td>
                                            <td style={{ padding: '8px 8px' }}>{s.avg_mgdl}</td>
                                            <td style={{ padding: '8px 8px', color: s.tir_pct >= 70 ? 'var(--success)' : 'var(--warning)' }}>{s.tir_pct}%</td>
                                            <td style={{ padding: '8px 8px', color: s.tar_pct > 25 ? 'var(--warning)' : 'var(--text-primary)' }}>{s.tar_pct}%</td>
                                            <td style={{ padding: '8px 8px', color: s.tbr_pct > 4 ? 'var(--danger)' : 'var(--text-primary)' }}>{s.tbr_pct}%</td>
                                            <td style={{ padding: '8px 8px', color: s.cv_pct > 36 ? 'var(--warning)' : 'var(--text-primary)' }}>{s.cv_pct}%</td>
                                            <td style={{ padding: '8px 8px', color: s.hypo_events > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{s.hypo_events}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="disclaimer-banner">
                        ℹ️ eA1c estimada se calcula con la fórmula de Nathan et al. (Diabetes Care 2008): (promedio + 46.7) / 28.7. Esta estimación puede diferir de tu HbA1c de laboratorio, especialmente en DM1. No usar para decisiones clínicas.
                    </div>
                </div>
            )}

            {/* IMPORTAR */}
            {tab === 'importar' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card">
                        <div className="flex-row gap-12" style={{ marginBottom: 16 }}>
                            <Download size={22} color="var(--primary-light)" />
                            <div>
                                <h3>Importar desde LibreView</h3>
                                <p style={{ fontSize: '0.875rem', marginTop: 2 }}>Vía CSV — método 100% oficial</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                            {[
                                'Abre la app LibreView en tu computador (libreview.com)',
                                'Ve a "Mi glucosa" → "Exportar datos" → selecciona el período',
                                'Descarga el archivo CSV (puede llamarse "GlucoseData.csv" o similar)',
                                'Súbelo aquí con el botón de abajo',
                            ].map((step, i) => (
                                <div key={i} className="step-instruction">
                                    <div className="step-num">{i + 1}</div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{step}</p>
                                </div>
                            ))}
                        </div>

                        <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} id="csv-upload" />
                        <label htmlFor="csv-upload">
                            <div className={`btn btn--primary btn--full btn--lg ${importing ? '' : ''}`}
                                style={{ cursor: importing ? 'not-allowed' : 'pointer', pointerEvents: importing ? 'none' : 'auto' }}>
                                {importing ? <><span className="spinner" />  Procesando...</> : <><Upload size={18} /> Seleccionar archivo CSV</>}
                            </div>
                        </label>
                    </div>

                    <div className="card">
                        <div className="flex-row gap-12" style={{ marginBottom: 14 }}>
                            <CheckCircle size={20} color="var(--success)" />
                            <h4>Formatos compatibles</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {[
                                '✅ LibreView export CSV (todas las versiones)',
                                '✅ FreeStyle Libre 2 y Libre 3',
                                '✅ Fechas en formato DD/MM/YYYY, YYYY-MM-DD, o M/D/YYYY',
                                '✅ Separador coma o punto y coma',
                                '✅ mg/dL (chipsets US/LATAM) y mmol/L (conversión automática)',
                            ].map(f => <p key={f} style={{ margin: 0 }}>{f}</p>)}
                        </div>
                    </div>
                </div>
            )}

            {/* LIBRELINKUP */}
            {tab === 'librelinkup' && <LibreLinkUpPanel />}
        </div>
    )
}

function LibreLinkUpPanel() {
    const [accepted, setAccepted] = useState(false)
    const [email, setEmail] = useState('')
    const [pass, setPass] = useState('')
    const [region, setRegion] = useState<LLURegion>('EU')
    const [loading, setLoading] = useState(false)
    const [session, setSession] = useState<LLUSession | null>(() => loadSession())
    const [lastSync, setLastSync] = useState<Date | null>(null)
    const [currentReading, setCurrentReading] = useState<{ value_mgdl: number; trend: string } | null>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const { addReadings, setDailySummaries, addToast } = useStore()

    const REGIONS: { value: LLURegion; label: string }[] = [
        { value: 'EU', label: 'Europa — recomendado LATAM' },
        { value: 'EU2', label: 'Europa 2 (EU2)' },
        { value: 'US', label: 'Estados Unidos' },
        { value: 'AP', label: 'Asia-Pacífico' },
        { value: 'AUS', label: 'Australia' },
        { value: 'CA', label: 'Canadá' },
    ]

    // Mapear lecturas del proxy al formato de la app
    const ingestReadings = useCallback((raw: Array<{ value_mgdl: number; trend: string; timestamp: string }>) => {
        if (!raw?.length) return
        const mapped = raw.map((r, i) => ({
            id: `llu-${Date.now()}-${i}`,
            timestamp: new Date(r.timestamp),
            value_mgdl: r.value_mgdl,
            trend: r.trend as import('../types').GlucoseTrend,
            source: 'librelinkup' as const,
            isManual: false,
        }))
        addReadings(mapped)

        // Recalcular daily summaries
        const byDay = new Map<string, typeof mapped>()
        mapped.forEach(r => {
            const d = r.timestamp.toISOString().split('T')[0]
            if (!byDay.has(d)) byDay.set(d, [])
            byDay.get(d)!.push(r)
        })
        const summaries = Array.from(byDay.entries()).map(([date, rs]) => computeDailySummary(rs, date))
        setDailySummaries(summaries)
    }, [addReadings, setDailySummaries])

    const doFetch = useCallback(async (s: LLUSession) => {
        try {
            const data = await llFetchGlucose(s)
            ingestReadings(data.readings)
            if (data.current) setCurrentReading({ value_mgdl: data.current.value_mgdl, trend: data.current.trend })
            setLastSync(new Date())
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error de sincronización'
            if (msg.includes('expirado') || msg.includes('inválido')) {
                clearSession()
                setSession(null)
                addToast('⚠️ Sesión expirada — vuelve a iniciar sesión', 'error')
            }
        }
    }, [ingestReadings, addToast])

    // Polling cada 5 minutos
    useEffect(() => {
        if (!session) return
        doFetch(session)  // fetch inmediato al conectar
        pollRef.current = setInterval(() => doFetch(session), 5 * 60 * 1000)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [session, doFetch])

    const handleLogin = async () => {
        if (!email || !pass) return
        setLoading(true)
        try {
            const result = await llLogin(email, pass, region)
            setSession(result.session)
            setPass('')  // limpiar contraseña de memoria
            if (result.current) setCurrentReading({ value_mgdl: result.current.value_mgdl, trend: result.current.trend })
            addToast(`✅ Conectado a LibreLinkUp · ${result.connections.length} conexión(es)`, 'success')
        } catch (err) {
            addToast(`❌ ${err instanceof Error ? err.message : 'Error de conexión'}`, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = () => {
        if (pollRef.current) clearInterval(pollRef.current)
        clearSession()
        setSession(null)
        setCurrentReading(null)
        setLastSync(null)
        addToast('Desconectado de LibreLinkUp', 'info')
    }

    // ── DISCLAIMER ─────────────────────────────────────────────────────────
    if (!accepted) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ borderColor: 'rgba(255,159,10,0.3)' }}>
                    <div className="flex-row gap-12" style={{ marginBottom: 14 }}>
                        <AlertCircle size={22} color="var(--warning)" />
                        <div>
                            <h3>LibreLinkUp — API No Oficial</h3>
                            <span className="badge badge--warning" style={{ marginTop: 4 }}>Experimental · Opción avanzada</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <p>Esta integración utiliza la <strong style={{ color: 'var(--text-primary)' }}>API no oficial de LibreLinkUp</strong>, obtenida por reverse engineering de la comunidad Nightscout.</p>
                        <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <li>No es soportada oficialmente por Abbott</li>
                            <li>Puede dejar de funcionar si Abbott cambia su backend</li>
                            <li>Tus credenciales se envían por HTTPS y <strong>no se almacenan</strong> — solo el token de sesión (expira en 1h)</li>
                            <li>Polling cada 5 min — no es tiempo real del sensor, sino del servidor de Abbott</li>
                        </ul>
                    </div>
                </div>
                <button className="btn btn--full btn--lg"
                    onClick={() => setAccepted(true)}
                    style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid rgba(255,159,10,0.4)' }}>
                    Entiendo los riesgos — Continuar
                </button>
            </div>
        )
    }

    // ── CONECTADO ───────────────────────────────────────────────────────────
    if (session) {
        const trendIcon = { Flat: '→', Rising: '↗', RisingRapidly: '↑↑', Falling: '↘', FallingRapidly: '↓↓', Unknown: '?' }
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ borderColor: 'rgba(48,209,88,0.3)' }}>
                    <div className="flex-between" style={{ marginBottom: 14 }}>
                        <div className="flex-row gap-12">
                            <Wifi size={20} color="var(--success)" />
                            <div>
                                <div style={{ fontWeight: 700 }}>LibreLinkUp conectado</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                    {lastSync ? `Última sync: ${format(lastSync, 'HH:mm:ss')}` : 'Sincronizando...'}
                                </div>
                            </div>
                        </div>
                        <span className="badge badge--success">● LIVE</span>
                    </div>

                    {currentReading && (
                        <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                            <div style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-0.04em', color: currentReading.value_mgdl < 70 ? 'var(--danger)' : currentReading.value_mgdl > 180 ? 'var(--warning)' : 'var(--success)' }}>
                                {currentReading.value_mgdl}
                                <span style={{ fontSize: '1.5rem', marginLeft: 8 }}>{trendIcon[currentReading.trend as keyof typeof trendIcon] ?? '?'}</span>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>mg/dL · LibreLinkUp</div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn--secondary" style={{ flex: 1 }} onClick={() => session && doFetch(session)}>
                            <RefreshCw size={15} /> Sync ahora
                        </button>
                        <button className="btn btn--danger" onClick={handleDisconnect}>
                            <LogOut size={15} /> Desconectar
                        </button>
                    </div>
                </div>

                <div className="disclaimer-banner">
                    🔄 La sincronización automática ocurre cada 5 minutos mientras esta página esté abierta. Para sincronización en background cuando la app está cerrada, se requiere una app nativa iOS (en desarrollo).
                </div>
            </div>
        )
    }

    // ── LOGIN ───────────────────────────────────────────────────────────────
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
                <div className="flex-row gap-12" style={{ marginBottom: 16 }}>
                    <WifiOff size={22} color="var(--text-tertiary)" />
                    <div>
                        <h3>Conectar LibreLinkUp</h3>
                        <p style={{ fontSize: '0.8125rem', marginTop: 2 }}>Sincronización cada 5 min desde servidores Abbott</p>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="input-group">
                        <label className="input-label">Región de tu cuenta</label>
                        <select className="input" value={region} onChange={e => setRegion(e.target.value as LLURegion)}>
                            {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Email de LibreLinkUp</label>
                        <input className="input" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Contraseña</label>
                        <input className="input" type="password" placeholder="Contraseña de LibreLinkUp" value={pass} onChange={e => setPass(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    </div>
                    <div className="disclaimer-banner" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>Tu contraseña se envía por HTTPS a nuestro proxy y <strong>nunca se guarda</strong>. Solo el token de sesión (1h de TTL) queda en tu dispositivo.</span>
                    </div>
                    <button className="btn btn--primary btn--full btn--lg"
                        onClick={handleLogin}
                        disabled={!email || !pass || loading}>
                        {loading ? <><span className="spinner" /> Conectando...</> : <><Wifi size={18} /> Conectar y sincronizar</>}
                    </button>
                </div>
            </div>
        </div>
    )
}


