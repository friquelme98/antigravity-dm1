// Vercel Serverless Function — Proxy seguro para LibreLinkUp API (no oficial)
// Referencia: https://github.com/DiaKEM/libre-link-up-api-client

const REGION_URLS = {
    EU: 'https://api-eu.libreview.io',
    EU2: 'https://api-eu2.libreview.io',
    US: 'https://api.libreview.io',
    AP: 'https://api-ap.libreview.io',
    AUS: 'https://api-au.libreview.io',
    CA: 'https://api-ca.libreview.io',
}

const LLU_HEADERS = {
    'product': 'llu.ios',
    'version': '4.12.0',
    'accept-encoding': 'gzip, deflate, br',
    'connection': 'keep-alive',
    'content-type': 'application/json',
    'accept': 'application/json',
    'cache-control': 'no-cache',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
}

export default async function handler(req, res) {
    // CORS — solo desde nuestro dominio
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') return res.status(200).end()
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { action, email, password, token, patientId, region = 'EU' } = req.body || {}
    const baseUrl = REGION_URLS[region] || REGION_URLS.EU

    try {
        // ── LOGIN ──────────────────────────────────────────────────────────────
        if (action === 'login') {
            if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' })

            const loginRes = await fetch(`${baseUrl}/llu/auth/login`, {
                method: 'POST',
                headers: LLU_HEADERS,
                body: JSON.stringify({ email, password }),
            })

            const loginBody = await loginRes.text()
            let loginData
            try { loginData = JSON.parse(loginBody) } catch (e) {
                console.error('[LLU Auth Error Raw]', loginBody)
                return res.status(502).json({ error: 'Respuesta del servidor LibreLinkUp bloqueda o en mantenimiento.' })
            }

            // LibreLinkUp puede redirigir a otra región
            if (loginData?.data?.redirect && loginData?.data?.region) {
                const redirectRegion = loginData.data.region.toUpperCase()
                const redirectUrl = REGION_URLS[redirectRegion] || baseUrl
                const retryRes = await fetch(`${redirectUrl}/llu/auth/login`, {
                    method: 'POST',
                    headers: LLU_HEADERS,
                    body: JSON.stringify({ email, password }),
                })
                const retryData = await retryRes.json()
                if (!retryData?.data?.authTicket?.token) {
                    return res.status(401).json({ error: 'Credenciales incorrectas o región incorrecta', detail: retryData?.error?.message || retryData?.error })
                }
                return await fetchConnections(retryData.data.authTicket.token, redirectUrl, res)
            }

            if (!loginData?.data?.authTicket?.token) {
                return res.status(401).json({ error: 'Credenciales incorrectas', detail: loginData?.error?.message })
            }

            return await fetchConnections(loginData.data.authTicket.token, baseUrl, res)
        }

        // ── FETCH GLUCOSE (usa token guardado en cliente) ─────────────────────
        if (action === 'fetch') {
            if (!token || !patientId) return res.status(400).json({ error: 'Token y patientId requeridos' })

            const graphRes = await fetch(`${baseUrl}/llu/connections/${patientId}/graph`, {
                headers: { ...LLU_HEADERS, authorization: `Bearer ${token}` },
            })

            if (!graphRes.ok) return res.status(401).json({ error: 'Token expirado o inválido — vuelve a iniciar sesión' })

            const graphData = await graphRes.json()
            const readings = mapReadings(graphData?.data?.graphData || [])
            const current = graphData?.data?.connection?.glucoseMeasurement

            return res.status(200).json({
                readings,
                current: current ? {
                    value_mgdl: current.ValueInMgPerDl,
                    trend: mapTrend(current.TrendArrow),
                    timestamp: current.Timestamp,
                } : null,
            })
        }

        // ── CONNECTIONS (lista de pacientes — puede ser el propio usuario) ─────
        if (action === 'connections') {
            if (!token) return res.status(400).json({ error: 'Token requerido' })

            const connRes = await fetch(`${baseUrl}/llu/connections`, {
                headers: { ...LLU_HEADERS, authorization: `Bearer ${token}` },
            })

            const connData = await connRes.json()
            return res.status(200).json({ connections: connData?.data || [] })
        }

        return res.status(400).json({ error: `Acción "${action}" no reconocida` })

    } catch (err) {
        console.error('[LibreLinkUp Proxy]', err)
        return res.status(500).json({ error: 'Error interno del proxy', detail: err.message })
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────
async function fetchConnections(token, baseUrl, res) {
    const connRes = await fetch(`${baseUrl}/llu/connections`, {
        headers: { ...LLU_HEADERS, authorization: `Bearer ${token}` },
    })
    const connData = await connRes.json()
    const connections = connData?.data || []

    // Normalmente hay una sola conexión (el propio sensor del usuario)
    const patient = connections[0]

    return res.status(200).json({
        token,
        patientId: patient?.patientId || null,
        connections,
        current: patient?.glucoseMeasurement ? {
            value_mgdl: patient.glucoseMeasurement.ValueInMgPerDl,
            trend: mapTrend(patient.glucoseMeasurement.TrendArrow),
            timestamp: patient.glucoseMeasurement.Timestamp,
        } : null,
    })
}

function mapReadings(raw) {
    return raw.map(r => ({
        value_mgdl: r.ValueInMgPerDl ?? r.value ?? 0,
        trend: mapTrend(r.TrendArrow ?? r.trendArrow),
        timestamp: r.Timestamp ?? r.timestamp,
    })).filter(r => r.value_mgdl > 20)
}

function mapTrend(arrow) {
    // LibreLinkUp TrendArrow: 1=RapidlyDecreasing, 2=Decreasing, 3=Stable, 4=Increasing, 5=RapidlyIncreasing
    const map = {
        1: 'FallingRapidly', 2: 'Falling', 3: 'Flat', 4: 'Rising', 5: 'RisingRapidly'
    }
    return map[arrow] ?? 'Unknown'
}
