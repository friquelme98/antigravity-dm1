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

const SESSION_KEY = 'ag_llu_session'
const TOKEN_TTL_MS = 60 * 60 * 1000  // 1 hora

const CORS_PROXY = 'https://corsproxy.io/?url='

const REGION_URLS: Record<LLURegion, string> = {
    EU: 'https://api-eu.libreview.io',
    EU2: 'https://api-eu2.libreview.io',
    US: 'https://api.libreview.io',
    AP: 'https://api-ap.libreview.io',
    AUS: 'https://api-au.libreview.io',
    CA: 'https://api-ca.libreview.io',
}

const getHeaders = (token?: string) => {
    // Generar un ID simple para ayudar al proxy pero seguir pareciendo un cliente de iOS
    const h: Record<string, string> = {
        'product': 'llu.ios',
        'version': '4.12.0',
        'accept-encoding': 'gzip, deflate, br',
        'connection': 'keep-alive',
        'content-type': 'application/json',
        'accept': 'application/json',
        'cache-control': 'no-cache',
    }
    if (token) h['authorization'] = `Bearer ${token}`
    return h
}

// ── Auth ───────────────────────────────────────────────────────────────────
export async function llLogin(email: string, password: string, region: LLURegion): Promise<{
    session: LLUSession
    current: LLUCurrentReading | null
    connections: unknown[]
}> {
    let baseUrl = REGION_URLS[region] || REGION_URLS.EU
    let loginData

    // 1. Primer intento de Login
    try {
        const urlList = [`${baseUrl}/llu/auth/login`]
        const res = await fetch(`${CORS_PROXY}${encodeURIComponent(urlList[0])}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email, password }),
        })
        loginData = await res.json()
    } catch (e) {
        throw new Error('Error de red al intentar conectar. Revisa tu conexión o intenta más tarde.')
    }

    if (loginData?.status === 0 && loginData?.error?.message) {
        throw new Error(`LibreLinkUp rechazó la conexión: ${loginData.error.message}`)
    }

    // LibreLinkUp puede sugerir redirigir a otra región
    if (loginData?.data?.redirect && loginData?.data?.region) {
        const redirectRegion = loginData.data.region.toUpperCase() as LLURegion
        baseUrl = REGION_URLS[redirectRegion] || baseUrl

        const resRedirect = await fetch(`${CORS_PROXY}${encodeURIComponent(`${baseUrl}/llu/auth/login`)}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email, password }),
        })
        loginData = await resRedirect.json()
    }

    if (!loginData?.data?.authTicket?.token) {
        throw new Error('Credenciales incorrectas o servidor no disponible')
    }

    const token = loginData.data.authTicket.token

    // 2. Obtener Connections
    const connRes = await fetch(`${CORS_PROXY}${encodeURIComponent(`${baseUrl}/llu/connections`)}`, {
        method: 'GET',
        headers: getHeaders(token),
    })
    const connData = await connRes.json()
    const connections = connData?.data || []
    const patient = connections[0]

    const session: LLUSession = {
        token,
        patientId: patient?.patientId || '',
        region,
        savedAt: Date.now(),
    }

    saveSession(session)

    return {
        session,
        current: patient?.glucoseMeasurement ? {
            value_mgdl: patient.glucoseMeasurement.ValueInMgPerDl,
            trend: mapTrend(patient.glucoseMeasurement.TrendArrow),
            timestamp: patient.glucoseMeasurement.Timestamp,
        } : null,
        connections
    }
}

// ── Fetch glucose ──────────────────────────────────────────────────────────
export async function llFetchGlucose(session: LLUSession): Promise<{
    readings: Array<{ value_mgdl: number; trend: string; timestamp: string }>
    current: LLUCurrentReading | null
}> {
    const baseUrl = REGION_URLS[session.region] || REGION_URLS.EU

    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(`${baseUrl}/llu/connections/${session.patientId}/graph`)}`, {
        method: 'GET',
        headers: getHeaders(session.token),
    })

    if (res.status === 401) throw new Error('Token expirado')

    const data = await res.json()
    if (data.status !== 0) throw new Error(data.error?.message || 'Error obteniendo glucosa')

    const readings = mapReadings(data.data?.graphData || [])
    const current = data.data?.connection?.glucoseMeasurement

    return {
        readings,
        current: current ? {
            value_mgdl: current.ValueInMgPerDl,
            trend: mapTrend(current.TrendArrow),
            timestamp: current.Timestamp,
        } : null,
    }
}

function mapReadings(raw: any[]) {
    return raw.map(r => ({
        value_mgdl: r.ValueInMgPerDl ?? r.value ?? 0,
        trend: mapTrend(r.TrendArrow ?? r.trendArrow),
        timestamp: r.Timestamp ?? r.timestamp,
    })).filter(r => r.value_mgdl > 20)
}

function mapTrend(arrow: number) {
    const map: Record<number, string> = {
        1: 'FallingRapidly', 2: 'Falling', 3: 'Flat', 4: 'Rising', 5: 'RisingRapidly'
    }
    return map[arrow] ?? 'Unknown'
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
