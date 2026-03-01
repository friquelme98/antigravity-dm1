// Servicio LibreLinkUp — llama al proxy de Vercel en /api/librelinkup
// Las credenciales NUNCA se almacenan — solo el token con TTL

export type LLURegion = 'EU' | 'EU2' | 'US' | 'AP' | 'AUS' | 'CA'

export interface LLUSession {
    token: string
    patientId: string
    region: LLURegion
    savedAt: number  // timestamp ms
}

export interface LLUCurrentReading {
    value_mgdl: number
    trend: string
    timestamp: string
}

const PROXY = '/api/librelinkup'
const SESSION_KEY = 'ag_llu_session'
const TOKEN_TTL_MS = 60 * 60 * 1000  // 1 hora

// ── Auth ───────────────────────────────────────────────────────────────────
export async function llLogin(email: string, password: string, region: LLURegion): Promise<{
    session: LLUSession
    current: LLUCurrentReading | null
    connections: unknown[]
}> {
    const res = await fetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password, region }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error de autenticación')

    const session: LLUSession = {
        token: data.token,
        patientId: data.patientId || data.connections?.[0]?.patientId || '',
        region,
        savedAt: Date.now(),
    }

    saveSession(session)
    return { session, current: data.current, connections: data.connections || [] }
}

// ── Fetch glucose ──────────────────────────────────────────────────────────
export async function llFetchGlucose(session: LLUSession): Promise<{
    readings: Array<{ value_mgdl: number; trend: string; timestamp: string }>
    current: LLUCurrentReading | null
}> {
    const res = await fetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'fetch',
            token: session.token,
            patientId: session.patientId,
            region: session.region,
        }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error obteniendo glucosa')
    return data
}

// ── Session storage ────────────────────────────────────────────────────────
export function saveSession(session: LLUSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadSession(): LLUSession | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY)
        if (!raw) return null
        const session: LLUSession = JSON.parse(raw)
        // Expirar token después de 1h
        if (Date.now() - session.savedAt > TOKEN_TTL_MS) {
            clearSession()
            return null
        }
        return session
    } catch {
        return null
    }
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY)
}
