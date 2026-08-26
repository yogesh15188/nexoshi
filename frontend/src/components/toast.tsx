import { useEffect, useState } from 'react'
import { cx } from './ui'

type ToastItem = { id: number; message: string; type: 'success' | 'error' | 'info' }

export function toast(message: string, type: ToastItem['type'] = 'success') {
  window.dispatchEvent(new CustomEvent('nexoshi-toast', { detail: { message, type } }))
}

let nextId = 1

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])
  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail
      const id = nextId++
      setItems((prev) => [...prev.slice(-3), { id, message, type }])
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200)
    }
    window.addEventListener('nexoshi-toast', handler)
    return () => window.removeEventListener('nexoshi-toast', handler)
  }, [])
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 space-y-2">
      {items.map((t) => (
        <div key={t.id}
          className={cx('toast-item pointer-events-auto flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm shadow-xl backdrop-blur',
            t.type === 'success' && 'border-emerald-500/40 bg-emerald-950/90 text-emerald-200',
            t.type === 'error' && 'border-red-500/40 bg-red-950/90 text-red-200',
            t.type === 'info' && 'border-sky-500/40 bg-sky-950/90 text-sky-200')}>
          <span className={cx('h-1.5 w-1.5 rounded-full',
            t.type === 'success' && 'bg-emerald-400',
            t.type === 'error' && 'bg-red-400',
            t.type === 'info' && 'bg-sky-400')} />
          {t.message}
        </div>
      ))}
    </div>
  )
}
