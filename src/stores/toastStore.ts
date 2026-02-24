import { create } from 'zustand'

export interface Toast {
  id:      string
  message: string
  type:    'info' | 'success' | 'error'
}

interface ToastState {
  toasts: Toast[]
  push:   (message: string, type?: Toast['type']) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    // Auto-dismiss after 4s
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))