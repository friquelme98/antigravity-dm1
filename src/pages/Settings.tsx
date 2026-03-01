import { useState } from 'react'
import { useStore } from '../store'
import { User, Shield, Bell, Link, Download, Trash2, ChevronRight } from 'lucide-react'

export default function SettingsPage() {
    const { user, addToast } = useStore()
    const [umbrales, setUmbrales] = useState({ hipo: 70, hiper: 250, preEjMin: 90, preEjMax: 150 })
    const [section, setSection] = useState<string | null>(null)

    const sections = [
        { id: 'perfil', icon: User, label: 'Mi Perfil', color: 'var(--primary)' },
        { id: 'umbrales', icon: Bell, label: 'Umbrales y Alertas', color: 'var(--warning)' },
        { id: 'integraciones', icon: Link, label: 'Integraciones', color: 'var(--info)' },
        { id: 'privacidad', icon: Shield, label: 'Datos y Privacidad', color: 'var(--success)' },
    ]

    return (
        <div className="animate-up" style={{ maxWidth: 680 }}>
            <div className="page-header">
                <h1 className="page-title">Ajustes</h1>
            </div>

            {/* Perfil mini */}
            <div className="card card--elevated" style={{ flexDirection: 'row', display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                    👨‍⚕️
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.0625rem' }}>{user?.nombre || 'Usuario'}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user?.email}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <span className="badge badge--primary">DM1</span>
                        <span className="badge badge--neutral">{user?.peso_kg ?? '—'} kg</span>
                        <span className="badge badge--neutral">FC max: {user?.fcMax ?? '—'} lpm</span>
                    </div>
                </div>
            </div>

            {/* Secciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
                {sections.map(({ id, icon: Icon, label, color }) => (
                    <button key={id}
                        className="btn btn--ghost"
                        style={{ justifyContent: 'space-between', padding: '14px 16px', borderRadius: 'var(--radius-md)', background: section === id ? 'var(--bg-elevated)' : 'transparent', width: '100%' }}
                        onClick={() => setSection(section === id ? null : id)}>
                        <div className="flex-row gap-12">
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={16} color={color} />
                            </div>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-tertiary)" style={{ transform: section === id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                ))}
            </div>

            {/* Umbrales */}
            {section === 'umbrales' && (
                <div className="card animate-up" style={{ marginBottom: 16 }}>
                    <h4 style={{ marginBottom: 16 }}>Umbrales clínicos personalizados</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[
                            { label: 'Hipoglicemia (mg/dL)', key: 'hipo' as const, note: 'Estándar: <70 mg/dL (ATTD 2023)' },
                            { label: 'Hiperglicemia alerta (mg/dL)', key: 'hiper' as const, note: 'Alerta activa si supera este valor' },
                            { label: 'Glucosa pre-ejercicio mínima', key: 'preEjMin' as const, note: 'ADA 2024: ≥90 mg/dL para iniciar' },
                            { label: 'Glucosa pre-ejercicio máxima', key: 'preEjMax' as const, note: 'ADA 2024: <150 mg/dL ideal' },
                        ].map(({ label, key, note }) => (
                            <div key={key} className="input-group">
                                <label className="input-label">{label}: <strong style={{ color: 'var(--primary-light)' }}>{umbrales[key]} mg/dL</strong></label>
                                <input type="range" min={40} max={400} value={umbrales[key]}
                                    onChange={e => setUmbrales(prev => ({ ...prev, [key]: +e.target.value }))}
                                    style={{ width: '100%', accentColor: 'var(--primary)' }} />
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{note}</div>
                            </div>
                        ))}
                        <button className="btn btn--primary" onClick={() => addToast('✅ Umbrales guardados', 'success')}>
                            Guardar umbrales
                        </button>
                    </div>
                </div>
            )}

            {/* Integraciones */}
            {section === 'integraciones' && (
                <div className="card animate-up" style={{ marginBottom: 16 }}>
                    <h4 style={{ marginBottom: 14 }}>Estado de integraciones</h4>
                    {[
                        { name: 'LibreView CSV', status: 'active', note: 'Última importación: hoy 13:20', icon: '🩸' },
                        { name: 'LibreLinkUp (API)', status: 'inactive', note: 'No configurado — requiere credenciales', icon: '🔗' },
                        { name: 'Apple Health XML', status: 'inactive', note: 'No importado — exporta desde app Salud', icon: '🍎' },
                        { name: 'iOS Shortcut Webhook', status: 'inactive', note: 'Endpoint: configura en producción', icon: '⌚' },
                        { name: 'Nightscout', status: 'inactive', note: 'No configurado — opcional v1', icon: '🌙' },
                    ].map(({ name, status, note, icon }) => (
                        <div key={name} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{note}</div>
                            </div>
                            <span className={`badge ${status === 'active' ? 'badge--success' : 'badge--neutral'}`}>
                                {status === 'active' ? '✓ Activo' : 'Inactivo'}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Privacidad */}
            {section === 'privacidad' && (
                <div className="card animate-up" style={{ marginBottom: 16 }}>
                    <h4 style={{ marginBottom: 14 }}>Datos y Privacidad</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <button className="btn btn--secondary btn--full" onClick={() => addToast('📦 Exportación iniciada — recibirás un JSON con todos tus datos', 'info')}>
                            <Download size={16} /> Exportar todos mis datos (JSON)
                        </button>
                        <button className="btn btn--secondary btn--full" onClick={() => addToast('📊 Exportando CSV de glucosa...', 'info')}>
                            <Download size={16} /> Exportar glucosa (CSV)
                        </button>
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                            <button className="btn btn--danger btn--full" onClick={() => addToast('⚠️ Esta acción es irreversible. Confirma en el email que te enviaremos.', 'error')}>
                                <Trash2 size={16} /> Solicitar eliminación de cuenta
                            </button>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
                                Todos tus datos serán eliminados de Firebase en 30 días desde la solicitud.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info app */}
            <div className="card" style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                    <div className="flex-between"><span>Versión</span><span>0.1.0-MVP</span></div>
                    <div className="flex-between"><span>Entorno</span><span>localhost (demo)</span></div>
                    <div className="flex-between"><span>Stack</span><span>React + Vite + Firebase</span></div>
                </div>
                <div className="disclaimer-banner" style={{ marginTop: 12 }}>
                    ⚕️ Antigravity es una herramienta de visualización y apoyo para uso personal. No es un dispositivo médico certificado y no reemplaza la indicación de tu endocrinólogo o equipo de salud.
                </div>
            </div>
        </div>
    )
}
