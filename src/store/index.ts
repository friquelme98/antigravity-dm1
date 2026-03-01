import { create } from 'zustand'
import type { UserProfile, GlucoseReading, DailySummary, WorkoutSession, Meal, Supplement, Insight } from '../types'

interface AppState {
    // Auth
    user: UserProfile | null
    loading: boolean
    setUser: (user: UserProfile | null) => void
    setLoading: (v: boolean) => void

    // Glucose
    readings: GlucoseReading[]
    dailySummaries: DailySummary[]
    setReadings: (r: GlucoseReading[]) => void
    addReadings: (r: GlucoseReading[]) => void
    setDailySummaries: (s: DailySummary[]) => void

    // Workouts
    workouts: WorkoutSession[]
    setWorkouts: (w: WorkoutSession[]) => void
    addWorkout: (w: WorkoutSession) => void

    // Meals
    meals: Meal[]
    setMeals: (m: Meal[]) => void
    addMeal: (m: Meal) => void

    // Supplements
    supplements: Supplement[]
    setSupplements: (s: Supplement[]) => void

    // Insights
    insights: Insight[]
    setInsights: (i: Insight[]) => void
    dismissInsight: (id: string) => void

    // UI
    fabOpen: boolean
    setFabOpen: (v: boolean) => void
    activeModal: string | null
    setActiveModal: (m: string | null) => void
    toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void
    removeToast: (id: string) => void
}

export const useStore = create<AppState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),

    readings: [],
    dailySummaries: [],
    setReadings: (readings) => set({ readings }),
    addReadings: (newReadings) => set(s => ({
        readings: [...s.readings, ...newReadings]
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    })),
    setDailySummaries: (dailySummaries) => set({ dailySummaries }),

    workouts: [],
    setWorkouts: (workouts) => set({ workouts }),
    addWorkout: (w) => set(s => ({ workouts: [w, ...s.workouts] })),

    meals: [],
    setMeals: (meals) => set({ meals }),
    addMeal: (m) => set(s => ({ meals: [m, ...s.meals] })),

    supplements: [],
    setSupplements: (supplements) => set({ supplements }),

    insights: [],
    setInsights: (insights) => set({ insights }),
    dismissInsight: (id) => set(s => ({
        insights: s.insights.map(i => i.id === id ? { ...i, descartado: true, activo: false } : i)
    })),

    fabOpen: false,
    setFabOpen: (fabOpen) => set({ fabOpen }),
    activeModal: null,
    setActiveModal: (activeModal) => set({ activeModal }),

    toasts: [],
    addToast: (message, type = 'info') => {
        const id = Date.now().toString()
        set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500)
    },
    removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
