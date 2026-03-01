import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
    Activity, Droplets, UtensilsCrossed, Pill, Zap,
    LayoutDashboard, Settings, Plus, X
} from 'lucide-react'
import { useStore } from './store'
import { generateDemoReadings, computeDailySummary } from './lib/glucose'

// Pages
import Dashboard from './pages/Dashboard'
import GlucosePage from './pages/Glucose'
import TrainingPage from './pages/Training'
import MealsPage from './pages/Meals'
import SupplementsPage from './pages/Supplements'
import InsightsPage from './pages/Insights'
import SettingsPage from './pages/Settings'
import OnboardingPage from './pages/Onboarding'

// Quick-add modals
import QuickAddModal from './components/QuickAddModal'

const NAV_ITEMS = [
    { to: '/', label: 'Hoy', icon: LayoutDashboard },
    { to: '/glucosa', label: 'Glucosa', icon: Droplets },
    { to: '/entrenamiento', label: 'Entreno', icon: Activity },
    { to: '/comidas', label: 'Comidas', icon: UtensilsCrossed },
    { to: '/suplementos', label: 'Suplementos', icon: Pill },
    { to: '/insights', label: 'Insights', icon: Zap },
    { to: '/settings', label: 'Ajustes', icon: Settings },
]

const BOTTOM_NAV = [
    { to: '/', label: 'Hoy', icon: LayoutDashboard },
    { to: '/glucosa', label: 'Glucosa', icon: Droplets },
    { to: '/entrenamiento', label: 'Entreno', icon: Activity },
    { to: '/comidas', label: 'Comidas', icon: UtensilsCrossed },
    { to: '/insights', label: 'Insights', icon: Zap },
]

function Sidebar() {
    return (
        <nav className="sidebar">
            <div className="sidebar-logo">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>
                    ⚡
                </div>
                <div>
                    <div className="sidebar-logo-text">Antigravity</div>
                    <div className="sidebar-logo-sub">DM1 Performance OS</div>
                </div>
            </div>
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end={to === '/'}>
                    <Icon size={20} />
                    {label}
                </NavLink>
            ))}
        </nav>
    )
}

function BottomNav() {
    const location = useLocation()
    return (
        <nav className="bottom-nav">
            {BOTTOM_NAV.map(({ to, label, icon: Icon }) => {
                const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
                return (
                    <NavLink key={to} to={to} className={`bottom-nav-item${isActive ? ' active' : ''}`} end={to === '/'}>
                        <Icon size={22} />
                        <span>{label}</span>
                    </NavLink>
                )
            })}
        </nav>
    )
}

function FAB() {
    const { fabOpen, setFabOpen, setActiveModal } = useStore()

    const actions = [
        { label: 'Comida', emoji: '🍽️', modal: 'meal', bg: '#1C3A1C', color: '#30D158' },
        { label: 'Suplemento', emoji: '💊', modal: 'supplement', bg: '#1C1C3A', color: '#7C6FF7' },
        { label: 'Sesión', emoji: '🏃', modal: 'workout', bg: '#1C2A3A', color: '#0A84FF' },
        { label: 'Hipo', emoji: '🔻', modal: 'hypo', bg: '#3A1C1C', color: '#FF453A' },
    ]

    return (
        <>
            {fabOpen && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 148 }}
                        onClick={() => setFabOpen(false)}
                    />
                    <div className="fab-menu">
                        {actions.map(({ label, emoji, modal, bg, color }, i) => (
                            <div key={modal} className="fab-menu-item" style={{ animationDelay: `${i * 40}ms` }}>
                                <span className="fab-menu-label">{label}</span>
                                <button
                                    className="fab-menu-btn"
                                    style={{ background: bg, color }}
                                    onClick={() => { setFabOpen(false); setActiveModal(modal) }}
                                >
                                    {emoji}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
            <button className="fab" onClick={() => setFabOpen(!fabOpen)} aria-label="Acciones rápidas">
                {fabOpen ? <X size={22} /> : <Plus size={22} />}
            </button>
        </>
    )
}

function ToastContainer() {
    const { toasts, removeToast } = useStore()
    if (!toasts.length) return null

    const colors: Record<string, string> = {
        success: 'var(--success)',
        error: 'var(--danger)',
        info: 'var(--primary-light)',
    }

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className="toast"
                    style={{ borderLeft: `3px solid ${colors[t.type]}`, cursor: 'pointer' }}
                    onClick={() => removeToast(t.id)}
                >
                    {t.message}
                </div>
            ))}
        </div>
    )
}

function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="page-layout">
            <Sidebar />
            <main className="page-content animate-fade">
                {children}
            </main>
            <BottomNav />
            <FAB />
            <QuickAddModal />
            <ToastContainer />
        </div>
    )
}

export default function App() {
    const { setReadings, setDailySummaries, setInsights, setUser, setLoading } = useStore()
    const [onboarded, setOnboarded] = useState(true) // true = skip onboarding en dev

    useEffect(() => {
        // Cargar datos demo
        const readings = generateDemoReadings(14)
        setReadings(readings)

        // Calcular summaries por día
        const byDay = new Map<string, typeof readings>()
        readings.forEach(r => {
            const d = r.timestamp.toISOString().split('T')[0]
            if (!byDay.has(d)) byDay.set(d, [])
            byDay.get(d)!.push(r)
        })
        const summaries = Array.from(byDay.entries())
            .map(([date, rs]) => computeDailySummary(rs, date))
        setDailySummaries(summaries)

        // Insights demo
        setInsights([
            {
                id: '1', generatedAt: new Date(), tipo: 'hipo_tardia',
                texto_corto: 'Patrón de hipoglicemia tardía detectado',
                texto_detalle: 'En los últimos 7 días, 3 de 4 sesiones matinales de running se asociaron con TBR en ventana 2–4h post-ejercicio (media 67 mg/dL). Considera reducir basal nocturna o agregar CHO de absorción lenta post-sesión.',
                nivel_confianza: 'alto',
                fuente: 'ADA Standards 2024, §15',
                accion_sugerida: 'Evalúa con tu endocrinólogo reducir Tresiba 1–2 U en días de entreno matinal.',
                activo: true, descartado: false,
            },
            {
                id: '2', generatedAt: new Date(), tipo: 'hipo_pre_ejercicio',
                texto_corto: 'Glucosa óptima pre-entreno no alcanzada (2 veces esta semana)',
                texto_detalle: '2 de 5 sesiones registradas iniciaron con glucosa <90 mg/dL. El rango recomendado pre-ejercicio de resistencia es 90–150 mg/dL (ADA 2024).',
                nivel_confianza: 'alto',
                fuente: 'ADA Standards of Medical Care in Diabetes 2024, §15',
                accion_sugerida: 'Verifica glucosa a las 4:45 am. Si <90: consume 15g CHO de acción rápida antes de iniciar.',
                activo: true, descartado: false,
            },
            {
                id: '3', generatedAt: new Date(), tipo: 'tir_bajo',
                texto_corto: 'TIR semanal: 68% — ligeramente bajo meta',
                texto_detalle: 'Tu TIR de los últimos 7 días es 68%, ligeramente bajo la meta recomendada ≥70% (consenso ATTD 2023). El TAR (>180 mg/dL) representa el 22%, principalmente post-almuerzo.',
                nivel_confianza: 'alto',
                fuente: 'Battelino T et al. ATTD Consensus 2023',
                accion_sugerida: 'Revisa el ratio CHO del almuerzo. El TAR post-almuerzo sugiere posible subestimación.',
                activo: true, descartado: false,
            },
        ])

        // Usuario demo
        setUser({
            uid: 'demo-user',
            email: 'demo@antigravity.cl',
            nombre: 'Dr. Usuario',
            peso_kg: 82.5,
            talla_cm: 180,
            fcMax: 185,
            fcReposo_basal: 48,
        })
        setLoading(false)
    }, [])

    if (!onboarded) {
        return (
            <BrowserRouter>
                <OnboardingPage onComplete={() => setOnboarded(true)} />
            </BrowserRouter>
        )
    }

    return (
        <BrowserRouter>
            <AppShell>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/glucosa" element={<GlucosePage />} />
                    <Route path="/entrenamiento" element={<TrainingPage />} />
                    <Route path="/comidas" element={<MealsPage />} />
                    <Route path="/suplementos" element={<SupplementsPage />} />
                    <Route path="/insights" element={<InsightsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/onboarding" element={<OnboardingPage onComplete={() => setOnboarded(true)} />} />
                </Routes>
            </AppShell>
        </BrowserRouter>
    )
}
