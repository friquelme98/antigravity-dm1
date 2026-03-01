// Tipos globales Antigravity

export type GlucoseTrend = 'Flat' | 'Rising' | 'RisingRapidly' | 'Falling' | 'FallingRapidly' | 'Unknown'

export interface GlucoseReading {
    id: string
    timestamp: Date
    value_mgdl: number
    trend: GlucoseTrend
    source: 'libreview_csv' | 'librelinkup' | 'nightscout' | 'manual'
    isManual: boolean
    sessionId?: string
    notes?: string
}

export interface DailySummary {
    date: string
    count: number
    avg_mgdl: number
    tir_pct: number
    tar_pct: number
    tbr_pct: number
    tbr_severe_pct: number
    cv_pct: number
    sd_mgdl: number
    min_mgdl: number
    max_mgdl: number
    calculated_eA1c: number
    hypo_events: number
}

export interface WorkoutSession {
    id: string
    type: 'running' | 'ciclismo' | 'fuerza' | 'otro'
    startTime: Date
    endTime: Date
    duration_min: number
    source: 'apple_health_export' | 'apple_shortcut' | 'manual'
    metrics: {
        distancia_km?: number
        fc_media?: number
        fc_max?: number
        fc_reposo_dia?: number
        hrv_rmssd?: number
        kcal_activas?: number
        ritmo_medio_min_km?: number
        zonas_min?: Record<'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5', number>
        trimp?: number
        pasos?: number
    }
    percepcion?: {
        rpe?: number
        dolor?: Array<{ zona: string; intensidad: number }>
        fatiga?: number
        notas?: string
    }
    glucosa_context?: {
        pre_mgdl?: number
        post_30min_mgdl?: number
        post_2h_mgdl?: number
    }
}

export type MealTiming =
    | 'pre_entreno' | 'post_entreno'
    | 'desayuno' | 'almuerzo' | 'cena'
    | 'snack' | 'rescate_hipo'

export interface Meal {
    id: string
    timestamp: Date
    timing: MealTiming
    descripcion: string
    plantillaId?: string
    macros: {
        cho_g: number
        proteina_g: number
        grasa_g: number
        fibra_g?: number
        kcal: number
    }
    bolo_u?: number
    craving?: { intensidad: number; contexto: string[]; notas?: string }
    foto_url?: string
    fuente_macros: 'manual' | 'usda' | 'estimado'
}

export interface Supplement {
    id: string
    nombre: string
    marca?: string
    dosis_g: number
    macros_por_dosis?: { proteina_g: number; cho_g: number; grasa_g: number }
    horario_target: MealTiming | 'mañana' | 'noche'
    activo: boolean
    notas?: string
}

export interface SupplementLog {
    id: string
    suppId: string
    timestamp: Date
    tomado: boolean
    toleranciaGI?: 0 | 1 | 2 | 3
    efectoPercibido?: 'positivo' | 'neutro' | 'negativo' | 'sin_dato'
    notas?: string
}

export type InsightConfidence = 'alto' | 'medio' | 'bajo'
export type InsightType =
    | 'hipo_pre_ejercicio' | 'hipo_tardia'
    | 'fatiga_acumulada' | 'cetosis_riesgo'
    | 'craving_patron' | 'progresion_carga'
    | 'fc_reposo_alta' | 'tir_bajo'

export interface Insight {
    id: string
    generatedAt: Date
    tipo: InsightType
    texto_corto: string
    texto_detalle: string
    nivel_confianza: InsightConfidence
    fuente?: string
    accion_sugerida?: string
    activo: boolean
    descartado: boolean
}

export interface TrainingPlan {
    id: string
    nombre: string
    inicio: string
    fin: string
    semanas: TrainingWeek[]
    activo: boolean
}

export interface TrainingWeek {
    numero: number
    tipo: 'base' | 'progresion' | 'deload' | 'pico'
    sesiones: PlannedSession[]
    carga_target_trimp: number
    deload: boolean
}

export interface PlannedSession {
    dia: 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'
    tipo: 'running' | 'ciclismo' | 'fuerza' | 'descanso'
    zona?: 'Z1' | 'Z2' | 'Z3' | 'Z4' | 'Z5'
    duracion_target_min: number
    descripcion?: string
    long_run?: boolean
}

export interface UserProfile {
    uid: string
    email: string
    nombre: string
    peso_kg: number
    talla_cm: number
    fechaNacimiento?: string
    sexo?: 'M' | 'F' | 'otro'
    fcMax?: number
    fcReposo_basal?: number
    insulinas?: {
        basal?: { nombre: string; dosis_u: number; hora: string }
        bolus?: { nombre: string; ratio_cho: number; sensibilidad_mgdl_por_u: number }
    }
    horarioEntrenamiento?: string
    diasEntrenamiento?: string[]
    deportes?: string[]
    termsAcceptedAt?: Date
}
