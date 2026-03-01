import type { GlucoseReading, DailySummary } from '../types'

// ── Parsear CSV LibreView ──────────────────────────────────────
// LibreView exporta 2 formatos: "Glucosa (mg/dL)" y "Glucose (mg/dL)"
// Primera fila = metadata del reporte, se omite
// Segunda fila = headers

export function parseLibreViewCSV(csvText: string): GlucoseReading[] {
    const lines = csvText.trim().split('\n')

    // Detectar separador (coma o punto y coma)
    const sep = lines[0].includes(';') ? ';' : ','

    // Buscar línea de headers (contiene "Timestamp" o "Marca de tiempo")
    let headerIdx = -1
    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const l = lines[i].toLowerCase()
        if (l.includes('timestamp') || l.includes('marca de tiempo') || l.includes('fecha')) {
            headerIdx = i
            break
        }
    }
    if (headerIdx < 0) throw new Error('Formato CSV no reconocido. Verifica que sea un export de LibreView.')

    const headers = lines[headerIdx].split(sep).map(h => h.replace(/"/g, '').trim().toLowerCase())

    // Buscar columnas clave
    const tsIdx = headers.findIndex(h => h.includes('timestamp') || h.includes('marca') || h.includes('fecha'))
    const valIdx = headers.findIndex(h => h.includes('glucosa') || h.includes('glucose') || h.includes('historic'))
    const scanIdx = headers.findIndex(h => h.includes('scan') || h.includes('escaneo'))
    const trendIdx = headers.findIndex(h => h.includes('trend') || h.includes('tendencia') || h.includes('flecha'))

    if (tsIdx < 0 || (valIdx < 0 && scanIdx < 0)) {
        throw new Error('No se encontraron columnas de timestamp o glucosa en el CSV.')
    }

    const readings: GlucoseReading[] = []

    for (let i = headerIdx + 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.replace(/"/g, '').trim())
        if (cols.length < 3) continue

        const rawTs = cols[tsIdx]
        const rawVal = valIdx >= 0 ? cols[valIdx] : (scanIdx >= 0 ? cols[scanIdx] : '')
        const rawTrend = trendIdx >= 0 ? cols[trendIdx] : ''

        if (!rawTs || !rawVal || rawVal === '' || rawVal === '-') continue

        const value_mgdl = parseFloat(rawVal.replace(',', '.'))
        if (isNaN(value_mgdl) || value_mgdl < 20 || value_mgdl > 600) continue

        // Parsear fecha — LibreView usa "DD-MM-YYYY HH:MM" o "YYYY-MM-DD HH:MM:SS" o "M/D/YYYY H:MM AM/PM"
        const timestamp = parseLibreDate(rawTs)
        if (!timestamp) continue

        readings.push({
            id: `csv_${timestamp.getTime()}_${value_mgdl}`,
            timestamp,
            value_mgdl,
            trend: parseTrend(rawTrend),
            source: 'libreview_csv',
            isManual: false,
        })
    }

    // Deduplicar por timestamp
    const seen = new Set<number>()
    return readings.filter(r => {
        const key = r.timestamp.getTime()
        if (seen.has(key)) return false
        seen.add(key)
        return true
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

function parseLibreDate(raw: string): Date | null {
    if (!raw) return null
    // Formato ISO: 2026-03-01T05:00:00 o 2026-03-01 05:00
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
        const d = new Date(raw.replace(' ', 'T'))
        return isNaN(d.getTime()) ? null : d
    }
    // Formato europeo DD-MM-YYYY HH:MM
    const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[\s,T]?(\d{1,2})?:?(\d{2})?/)
    if (m) {
        const [, d, mo, y, h = '0', min = '0'] = m
        const date = new Date(+y, +mo - 1, +d, +h, +min)
        return isNaN(date.getTime()) ? null : date
    }
    return null
}

function parseTrend(raw: string): GlucoseReading['trend'] {
    const r = raw.toLowerCase()
    if (r.includes('rising rapidly') || r.includes('sube rapido') || r === '↑↑') return 'RisingRapidly'
    if (r.includes('rising') || r.includes('sube') || r === '↑') return 'Rising'
    if (r.includes('falling rapidly') || r.includes('baja rapido') || r === '↓↓') return 'FallingRapidly'
    if (r.includes('falling') || r.includes('baja') || r === '↓') return 'Falling'
    if (r.includes('flat') || r.includes('estable') || r === '→') return 'Flat'
    return 'Unknown'
}

// ── Calcular métricas diarias ──────────────────────────────────
export function computeDailySummary(readings: GlucoseReading[], date: string): DailySummary {
    const vals = readings.map(r => r.value_mgdl)
    const n = vals.length
    if (n === 0) return emptyDailySummary(date)

    const avg = vals.reduce((s, v) => s + v, 0) / n
    const variance = vals.reduce((s, v) => s + (v - avg) ** 2, 0) / n
    const sd = Math.sqrt(variance)
    const tir = vals.filter(v => v >= 70 && v <= 180).length / n * 100
    const tar = vals.filter(v => v > 180).length / n * 100
    const tbr = vals.filter(v => v < 70).length / n * 100
    const tbr_severe = vals.filter(v => v < 54).length / n * 100
    const cv = avg > 0 ? (sd / avg) * 100 : 0
    const eA1c = (avg + 46.7) / 28.7

    // Detectar eventos de hipo (lecturas <70 con ≥15 min de recovery)
    let hypoEvents = 0
    let inHypo = false
    for (const r of readings) {
        if (!inHypo && r.value_mgdl < 70) { inHypo = true; hypoEvents++ }
        else if (inHypo && r.value_mgdl >= 80) inHypo = false
    }

    return {
        date, count: n,
        avg_mgdl: Math.round(avg * 10) / 10,
        tir_pct: Math.round(tir * 10) / 10,
        tar_pct: Math.round(tar * 10) / 10,
        tbr_pct: Math.round(tbr * 10) / 10,
        tbr_severe_pct: Math.round(tbr_severe * 10) / 10,
        cv_pct: Math.round(cv * 10) / 10,
        sd_mgdl: Math.round(sd * 10) / 10,
        min_mgdl: Math.min(...vals),
        max_mgdl: Math.max(...vals),
        calculated_eA1c: Math.round(eA1c * 10) / 10,
        hypo_events: hypoEvents,
    }
}

function emptyDailySummary(date: string): DailySummary {
    return {
        date, count: 0, avg_mgdl: 0, tir_pct: 0, tar_pct: 0, tbr_pct: 0,
        tbr_severe_pct: 0, cv_pct: 0, sd_mgdl: 0, min_mgdl: 0, max_mgdl: 0,
        calculated_eA1c: 0, hypo_events: 0,
    }
}

// ── Trend arrow ────────────────────────────────────────────────
export function trendArrow(trend: GlucoseReading['trend']): string {
    const map: Record<string, string> = {
        RisingRapidly: '↑↑', Rising: '↑', Flat: '→',
        Falling: '↓', FallingRapidly: '↓↓', Unknown: '—'
    }
    return map[trend] ?? '—'
}

// ── Glucosa status ─────────────────────────────────────────────
export function glucoseStatus(val: number): 'tbr' | 'tir' | 'tar' {
    if (val < 70) return 'tbr'
    if (val > 180) return 'tar'
    return 'tir'
}

// ── Generar datos demo ─────────────────────────────────────────
export function generateDemoReadings(days = 7): GlucoseReading[] {
    const readings: GlucoseReading[] = []
    const now = new Date()

    for (let d = days - 1; d >= 0; d--) {
        const baseDate = new Date(now)
        baseDate.setDate(baseDate.getDate() - d)
        baseDate.setHours(0, 0, 0, 0)

        // Simulación: 288 lecturas (cada 5 min) con patrón circadiano
        let val = 95 + Math.random() * 20
        for (let m = 0; m < 24 * 60; m += 5) {
            const ts = new Date(baseDate.getTime() + m * 60000)
            const hour = ts.getHours()

            // Patrones: sube post-comida, baja en ejercicio (5am), baja nocturno
            let delta = (Math.random() - 0.5) * 8
            if (hour === 5) delta -= 15  // ejercicio matinal
            if (hour === 7 || hour === 13 || hour === 20) delta += 20 // comidas
            if (hour >= 1 && hour <= 4) delta -= 3 // dawn basal

            val = Math.max(60, Math.min(260, val + delta))

            const trend: GlucoseReading['trend'] = delta > 3 ? 'Rising' : delta < -3 ? 'Falling' : 'Flat'
            readings.push({
                id: `demo_${ts.getTime()}`,
                timestamp: ts,
                value_mgdl: Math.round(val),
                trend,
                source: 'libreview_csv',
                isManual: false,
            })
        }
    }
    return readings
}
