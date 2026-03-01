import { useState } from 'react'
import { X, UtensilsCrossed, Pill, Activity, AlertTriangle, Syringe } from 'lucide-react'
import { useStore } from '../store'
import type { Meal, WorkoutSession, SupplementLog } from '../types'

const MEAL_TIMINGS = [
    'pre_entreno', 'post_entreno', 'desayuno', 'almuerzo', 'cena', 'snack', 'rescate_hipo'
]

const PLANTILLAS = [
    { nombre: 'Avena proteica', cho: 45, pro: 32, gra: 8, kcal: 380 },
    { nombre: 'Whey + fruta', cho: 30, pro: 25, gra: 2, kcal: 238 },
    { nombre: 'Quinoa + pollo', cho: 50, pro: 40, gra: 10, kcal: 450 },
    { nombre: 'Pan con huevo', cho: 30, pro: 14, gra: 12, kcal: 284 },
    { nombre: 'Plátano', cho: 27, pro: 1, gra: 0, kcal: 105 },
]

export default function QuickAddModal() {
    const { activeModal, setActiveModal, addMeal, addWorkout, addToast } = useStore()

    if (!activeModal) return null

    const close = () => setActiveModal(null)

    return (
        <div className="modal-overlay" onClick={close}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                {activeModal === 'meal' && <MealForm onClose={close} onSave={(m) => { addMeal(m); addToast('✅ Comida registrada', 'success'); close() }} />}
                {activeModal === 'workout' && <WorkoutForm onClose={close} onSave={(w) => { addWorkout(w); addToast('✅ Sesión registrada', 'success'); close() }} />}
                {activeModal === 'hypo' && <HypoForm onClose={close} onSave={() => { addToast('🔻 Hipo registrada', 'info'); close() }} />}
                {activeModal === 'supplement' && <SupplementForm onClose={close} onSave={() => { addToast('💊 Suplemento registrado', 'success'); close() }} />}
            </div>
        </div>
    )
}

function MealForm({ onClose, onSave }: { onClose: () => void; onSave: (m: Meal) => void }) {
    const [desc, setDesc] = useState('')
    const [timing, setTiming] = useState<string>('desayuno')
    const [cho, setCho] = useState('')
    const [pro, setPro] = useState('')
    const [gra, setGra] = useState('')
    const [bolo, setBolo] = useState('')

    const applyPlantilla = (p: typeof PLANTILLAS[0]) => {
        setDesc(p.nombre)
        setCho(String(p.cho))
        setPro(String(p.pro))
        setGra(String(p.gra))
    }

    const save = () => {
        if (!desc.trim()) return
        onSave({
            id: Date.now().toString(),
            timestamp: new Date(),
            timing: timing as Meal['timing'],
            descripcion: desc,
            macros: {
                cho_g: +cho || 0,
                proteina_g: +pro || 0,
                grasa_g: +gra || 0,
                kcal: (+cho || 0) * 4 + (+pro || 0) * 4 + (+gra || 0) * 9,
            },
            bolo_u: bolo ? +bolo : undefined,
            fuente_macros: 'manual',
        })
    }

    return (
        <>
            <div className="modal-header">
                <div className="flex-row gap-8">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UtensilsCrossed size={16} color="var(--success)" />
                    </div>
                    <h3>Registrar Comida</h3>
                </div>
                <button className="btn btn--icon btn--ghost" onClick={onClose}><X size={18} /></button>
            </div>

            {/* Plantillas */}
            <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>PLANTILLAS RÁPIDAS</p>
                <div className="scroll-x" style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
                    {PLANTILLAS.map(p => (
                        <button key={p.nombre} className="btn btn--secondary btn--sm" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                            onClick={() => applyPlantilla(p)}>
                            {p.nombre}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                    <label className="input-label">Descripción</label>
                    <input className="input" placeholder="ej: Avena con whey y canela" value={desc} onChange={e => setDesc(e.target.value)} autoFocus />
                </div>
                <div className="input-group">
                    <label className="input-label">Momento</label>
                    <select className="input" value={timing} onChange={e => setTiming(e.target.value)}>
                        {MEAL_TIMINGS.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                <div className="grid-3" style={{ gap: 10 }}>
                    <div className="input-group">
                        <label className="input-label">CHO (g)</label>
                        <input className="input" type="number" placeholder="0" value={cho} onChange={e => setCho(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">PRO (g)</label>
                        <input className="input" type="number" placeholder="0" value={pro} onChange={e => setPro(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">GRA (g)</label>
                        <input className="input" type="number" placeholder="0" value={gra} onChange={e => setGra(e.target.value)} />
                    </div>
                </div>
                <div className="input-group">
                    <label className="input-label">Bolo aplicado (U) — opcional</label>
                    <input className="input" type="number" step="0.5" placeholder="ej: 3.5" value={bolo} onChange={e => setBolo(e.target.value)} />
                </div>
                <button className="btn btn--primary btn--full btn--lg" onClick={save}>Guardar comida</button>
            </div>
        </>
    )
}

function WorkoutForm({ onClose, onSave }: { onClose: () => void; onSave: (w: WorkoutSession) => void }) {
    const [tipo, setTipo] = useState<'running' | 'ciclismo' | 'fuerza' | 'otro'>('running')
    const [duracion, setDuracion] = useState('45')
    const [fcMedia, setFcMedia] = useState('')
    const [rpe, setRpe] = useState('6')
    const [preGlu, setPreGlu] = useState('')
    const [postGlu, setPostGlu] = useState('')
    const [notas, setNotas] = useState('')

    const save = () => {
        const now = new Date()
        const start = new Date(now.getTime() - (+duracion || 45) * 60000)
        onSave({
            id: Date.now().toString(),
            type: tipo,
            startTime: start,
            endTime: now,
            duration_min: +duracion || 45,
            source: 'manual',
            metrics: {
                fc_media: fcMedia ? +fcMedia : undefined,
            },
            percepcion: { rpe: +rpe, notas },
            glucosa_context: {
                pre_mgdl: preGlu ? +preGlu : undefined,
                post_30min_mgdl: postGlu ? +postGlu : undefined,
            },
        })
    }

    return (
        <>
            <div className="modal-header">
                <div className="flex-row gap-8">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--info-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={16} color="var(--info)" />
                    </div>
                    <h3>Registrar Sesión</h3>
                </div>
                <button className="btn btn--icon btn--ghost" onClick={onClose}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                    <label className="input-label">Tipo</label>
                    <select className="input" value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)}>
                        <option value="running">🏃 Running</option>
                        <option value="ciclismo">🚴 Ciclismo</option>
                        <option value="fuerza">🏋️ Fuerza</option>
                        <option value="otro">⚡ Otro</option>
                    </select>
                </div>
                <div className="grid-2" style={{ gap: 10 }}>
                    <div className="input-group">
                        <label className="input-label">Duración (min)</label>
                        <input className="input" type="number" value={duracion} onChange={e => setDuracion(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">FC media (lpm)</label>
                        <input className="input" type="number" placeholder="148" value={fcMedia} onChange={e => setFcMedia(e.target.value)} />
                    </div>
                </div>
                <div className="input-group">
                    <label className="input-label">RPE (6–20 Borg): {rpe}</label>
                    <input type="range" min={6} max={20} value={rpe} onChange={e => setRpe(e.target.value)}
                        style={{ width: '100%', accentColor: 'var(--primary)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                        <span>Muy suave (6)</span><span>Máximo (20)</span>
                    </div>
                </div>
                <div className="grid-2" style={{ gap: 10 }}>
                    <div className="input-group">
                        <label className="input-label">Glucosa pre (mg/dL)</label>
                        <input className="input" type="number" placeholder="112" value={preGlu} onChange={e => setPreGlu(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Glucosa post 30' (mg/dL)</label>
                        <input className="input" type="number" placeholder="88" value={postGlu} onChange={e => setPostGlu(e.target.value)} />
                    </div>
                </div>
                <div className="input-group">
                    <label className="input-label">Notas</label>
                    <input className="input" placeholder="ej: Rodilla levemente molesta al km 5" value={notas} onChange={e => setNotas(e.target.value)} />
                </div>
                <button className="btn btn--primary btn--full btn--lg" onClick={save}>Guardar sesión</button>
            </div>
        </>
    )
}

function HypoForm({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
    const [glucosa, setGlucosa] = useState('')
    const [sintomas, setSintomas] = useState<string[]>([])
    const [tratamiento, setTratamiento] = useState('')
    const [cho, setCho] = useState('15')

    const SINTOMAS = ['Sudoración', 'Temblor', 'Palpitaciones', 'Confusión', 'Hambre intensa', 'Debilidad', 'Cefalea']

    const toggleSintoma = (s: string) =>
        setSintomas(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

    return (
        <>
            <div className="modal-header">
                <div className="flex-row gap-8">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={16} color="var(--danger)" />
                    </div>
                    <h3>Registrar Hipoglicemia</h3>
                </div>
                <button className="btn btn--icon btn--ghost" onClick={onClose}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                    <label className="input-label">Glucosa al detectar (mg/dL)</label>
                    <input className="input" type="number" placeholder="ej: 58" value={glucosa} onChange={e => setGlucosa(e.target.value)} autoFocus />
                </div>
                <div className="input-group">
                    <label className="input-label">Síntomas</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                        {SINTOMAS.map(s => (
                            <button key={s}
                                className={`btn btn--sm ${sintomas.includes(s) ? 'btn--danger' : 'btn--secondary'}`}
                                onClick={() => toggleSintoma(s)}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid-2" style={{ gap: 10 }}>
                    <div className="input-group">
                        <label className="input-label">Tratamiento</label>
                        <select className="input" value={tratamiento} onChange={e => setTratamiento(e.target.value)}>
                            <option value="">Seleccionar...</option>
                            <option value="glucosa">Tabletas de glucosa</option>
                            <option value="jugo">Jugo de fruta</option>
                            <option value="gel">Gel energético</option>
                            <option value="caramelo">Caramelos</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">CHO ingeridos (g)</label>
                        <input className="input" type="number" value={cho} onChange={e => setCho(e.target.value)} />
                    </div>
                </div>
                <div className="disclaimer-banner">
                    ⚠️ Regla 15-15: consume 15g CHO, espera 15 min y remide. Esta app no reemplaza la evaluación clínica.
                </div>
                <button className="btn btn--danger btn--full btn--lg" onClick={onSave}>Registrar hipo</button>
            </div>
        </>
    )
}

function SupplementForm({ onClose, onSave }: { onClose: () => void; onSave: (l: SupplementLog) => void }) {
    const { supplements } = useStore()
    const [suppId, setSuppId] = useState(supplements[0]?.id || '')
    const [tomado, setTomado] = useState(true)
    const [gi, setGi] = useState<0 | 1 | 2 | 3>(0)

    const defaultSupps = [
        { id: 'whey', nombre: 'Whey Isolate 30g' },
        { id: 'creatina', nombre: 'Creatina 5g' },
        { id: 'electrolitos', nombre: 'Electrolitos' },
        { id: 'cafeina', nombre: 'Cafeína 200mg ⚠️' },
    ]

    const allSupps = supplements.length > 0 ? supplements : defaultSupps

    return (
        <>
            <div className="modal-header">
                <div className="flex-row gap-8">
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pill size={16} color="var(--primary-light)" />
                    </div>
                    <h3>Registrar Suplemento</h3>
                </div>
                <button className="btn btn--icon btn--ghost" onClick={onClose}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                    <label className="input-label">Suplemento</label>
                    <select className="input" value={suppId} onChange={e => setSuppId(e.target.value)}>
                        {allSupps.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>¿Lo tomaste hoy?</span>
                    <label className="toggle">
                        <input type="checkbox" checked={tomado} onChange={e => setTomado(e.target.checked)} />
                        <span className="toggle-slider" />
                    </label>
                </div>
                <div className="input-group">
                    <label className="input-label">Tolerancia GI: {['Sin molestia', 'Leve', 'Moderada', 'Severa'][gi]}</label>
                    <input type="range" min={0} max={3} value={gi} onChange={e => setGi(+e.target.value as 0 | 1 | 2 | 3)}
                        style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
                <button className="btn btn--primary btn--full btn--lg" onClick={() => onSave({
                    id: Date.now().toString(), suppId, timestamp: new Date(), tomado, toleranciaGI: gi, efectoPercibido: 'sin_dato'
                })}>
                    Guardar
                </button>
            </div>
        </>
    )
}
