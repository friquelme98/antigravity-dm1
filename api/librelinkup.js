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

const getHeaders = () => {
    const randomIp = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    return {
        'product': 'llu.ios',
        'version': '4.12.0',
        'accept-encoding': 'gzip, deflate, br',
        'connection': 'keep-alive',
        'content-type': 'application/json; charset=utf-8',
        'accept': 'application/json',
        'cache-control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'X-Forwarded-For': randomIp,
        'X-Real-IP': randomIp,
        'True-Client-IP': randomIp,
    }
}

export const config = {
    runtime: 'edge', // Usa Edge Runtime (Cloudflare) para evitar bloqueo de Datacenter IP
}

export default async function handler(req) {
    // Edge runtime req es un objeto Request web estándar
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        })
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    let body
    try {
        body = await req.json()
    } catch {
        return new Response(JSON.stringify({ error: 'Body no válido' }), { status: 400 })
    }

    const { action, password, token, patientId, region = 'EU' } = body
    const email = body?.email?.trim()
    const baseUrl = REGION_URLS[region] || REGION_URLS.EU

    try {
        // ── LOGIN ──────────────────────────────────────────────────────────────
        if (action === 'login') {
            if (!email || !password) return jsonResponse({ error: 'Email y contraseña requeridos' }, 400)

            const loginRes = await fetch(`${baseUrl}/llu/auth/login`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ email, password }),
            })

            const loginBody = await loginRes.text()
            let loginData
            try { loginData = JSON.parse(loginBody) } catch (e) {
                console.error('[LLU Auth Error Raw]', loginBody)
                return jsonResponse({ error: 'Vercel bloqueado por Abbott', detail: loginBody.substring(0, 100) }, 502)
            }

            // LibreLinkUp puede redirigir a otra región
            if (loginData?.data?.redirect && loginData?.data?.region) {
                const redirectRegion = loginData.data.region.toUpperCase()
                const redirectUrl = REGION_URLS[redirectRegion] || baseUrl
                const retryRes = await fetch(`${redirectUrl}/llu/auth/login`, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ email, password }),
                })
                const retryData = await retryRes.json()
                if (!retryData?.data?.authTicket?.token) {
                    return jsonResponse({ error: 'Credenciales incorrectas o región incorrecta', detail: retryData?.error?.message || retryData?.error }, 401)
                }
                return await fetchConnections(retryData.data.authTicket.token, redirectUrl)
            }

            if (!loginData?.data?.authTicket?.token) {
                return jsonResponse({ error: 'Credenciales incorrectas', detail: loginData?.error?.message }, 401)
            }

            return await fetchConnections(loginData.data.authTicket.token, baseUrl)
        }

        // ── FETCH GLUCOSE ─────────────────────────────────────────────────────
        if (action === 'fetch') {
            if (!token || !patientId) return jsonResponse({ error: 'Token y patientId requeridos' }, 400)

            const graphRes = await fetch(`${baseUrl}/llu/connections/${patientId}/graph`, {
                headers: { ...getHeaders(), authorization: `Bearer ${token}` },
            })

            if (!graphRes.ok) return jsonResponse({ error: 'Token expirado o inválido — vuelve a iniciar sesión' }, 401)

            const graphData = await graphRes.json()
            const readings = mapReadings(graphData?.data?.graphData || [])
            const current = graphData?.data?.connection?.glucoseMeasurement

            return jsonResponse({
                readings,
                current: current ? {
                    value_mgdl: current.ValueInMgPerDl,
                    trend: mapTrend(current.TrendArrow),
                    timestamp: current.Timestamp,
                } : null,
            })
        }

        // ── CONNECTIONS ────────────────────────────────────────────────────────
        if (action === 'connections') {
            if (!token) return jsonResponse({ error: 'Token requerido' }, 400)

            const connRes = await fetch(`${baseUrl}/llu/connections`, {
                headers: { ...getHeaders(), authorization: `Bearer ${token}` },
            })

            const connData = await connRes.json()
            return jsonResponse({ connections: connData?.data || [] })
        }

        return jsonResponse({ error: `Acción "${action}" no reconocida` }, 400)

    } catch (err) {
        console.error('[LibreLinkUp Proxy]', err)
        return jsonResponse({ error: 'Error interno del proxy', detail: err.message }, 500)
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    })
}

async function fetchConnections(token, baseUrl) {
    const connRes = await fetch(`${baseUrl}/llu/connections`, {
        headers: { ...getHeaders(), authorization: `Bearer ${token}` },
    })
    const connData = await connRes.json()
    const connections = connData?.data || []

    const patient = connections[0]

    return jsonResponse({
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
