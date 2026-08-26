import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'

export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(' ')

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  )
}

export function Card({ title, right, children, className, pad = true }: { title?: string; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <div className={cx('rounded-xl border border-slate-800/80 bg-slate-900/50 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition-colors hover:border-slate-700/80', pad && 'p-4', className)}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">{title}</h3>
          {right}
        </div>
      )}
      {children}
    </div>
  )
}

const toneMap: Record<string, string> = {
  red: 'bg-red-500/15 text-red-300 border-red-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  blue: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  slate: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
  violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
}

export function Badge({ children, tone = 'slate', pulse }: { children: ReactNode; tone?: keyof typeof toneMap; pulse?: boolean }) {
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', toneMap[tone])}>
      {pulse && <i className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function useCountUp(target: number, ms = 700) {
  const [val, setVal] = useState(target)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setVal(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return val
}

export function StatCard({ label, value, sub, accent = 'text-cyan-400', prefix = '', suffix = '', decimals = 0, icon }: {
  label: string; value: number | string; sub?: ReactNode; accent?: string; prefix?: string; suffix?: string; decimals?: number; icon?: ReactNode
}) {
  const numeric = typeof value === 'number'
  const animated = useCountUp(numeric ? (value as number) : 0)
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 p-4 transition-all hover:border-slate-600/70">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{label}</p>
        {icon && <span className="opacity-60 transition-opacity group-hover:opacity-100">{icon}</span>}
      </div>
      <p className={cx('mt-1.5 text-3xl font-extrabold tabular-nums tracking-tight', accent)}>
        {numeric ? `${prefix}${(animated as number).toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}${suffix}` : value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  )
}

export function Button({ children, onClick, variant = 'primary', disabled, loading, className }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'danger' | 'success'; disabled?: boolean; loading?: boolean; className?: string
}) {
  const styles = {
    primary: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_16px_rgba(34,211,238,0.25)]',
    ghost: 'border border-slate-700 hover:border-slate-500 text-slate-200',
    danger: 'bg-red-500 hover:bg-red-400 text-white font-semibold',
    success: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-[0_0_16px_rgba(52,211,153,0.25)]',
  }
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className={cx('inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 text-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40', styles[variant], className)}>
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export function Spinner() {
  return <span className="btn-spin" />
}

export function Skeleton({ lines = 3, height = 'h-4' }: { lines?: number; height?: string }) {
  return (
    <div className="animate-pulse space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cx('rounded bg-slate-800/70', height)} style={{ width: `${100 - i * 14}%` }} />
      ))}
    </div>
  )
}

export function riskTone(score: number): keyof typeof toneMap {
  if (score >= 70) return 'red'
  if (score >= 45) return 'amber'
  return 'green'
}

export function RiskBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const w = useCountUp(Math.min(100, value))
  const color = value >= 70 ? 'bg-red-400' : value >= 45 ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-slate-800">
      <div className={cx('h-full rounded transition-all duration-700', color)} style={{ width: `${w}%`, transitionDelay: `${delay}ms` }} />
    </div>
  )
}

export function critTone(c: string): keyof typeof toneMap {
  return c === 'critical' ? 'red' : c === 'high' ? 'amber' : c === 'medium' ? 'blue' : 'slate'
}

const LOOP_STEPS = ['RISK', 'VALIDATE', 'INVEST', 'VERIFY']

export function PhaseStepper({ active }: { active: number }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {LOOP_STEPS.map((s, i) => {
        const done = i < active
        const current = i === active
        return (
          <div key={s} className="flex items-center gap-1.5 sm:gap-2">
            {i > 0 && <span className={cx('h-px w-4 sm:w-7', done ? 'bg-emerald-400/60' : 'bg-slate-700')} />}
            <span className={cx(
              'rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.14em]',
              current && 'border-cyan-400/60 bg-cyan-500/15 text-cyan-300 animate-pulse',
              done && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
              !current && !done && 'border-slate-700 bg-slate-900 text-slate-500',
            )}>{s}</span>
          </div>
        )
      })}
    </div>
  )
}

export function CompareBar({ labelBefore, labelAfter, before, after, unit = '' }: { labelBefore: string; labelAfter: string; before: number; after: number; unit?: string }) {
  const max = Math.max(before, after, 1)
  const bW = (before / max) * 100
  const aW = (after / max) * 100
  return (
    <div className="space-y-2">
      <div>
        <div className="mb-1 flex justify-between text-[11px]"><span className="text-slate-400">{labelBefore}</span><span className="font-mono text-red-300">{before.toLocaleString('en-IN')}{unit}</span></div>
        <div className="h-3 overflow-hidden rounded bg-slate-800"><div className="h-full rounded bg-gradient-to-r from-red-500/70 to-red-400 transition-all duration-1000" style={{ width: `${bW}%` }} /></div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-[11px]"><span className="text-slate-400">{labelAfter}</span><span className="font-mono text-emerald-300">{after.toLocaleString('en-IN')}{unit}</span></div>
        <div className="h-3 overflow-hidden rounded bg-slate-800"><div className="h-full rounded bg-gradient-to-r from-emerald-500/70 to-emerald-400 transition-all duration-1000" style={{ width: `${aW}%` }} /></div>
      </div>
    </div>
  )
}

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-800 px-6 py-10 text-center">
      <p className="max-w-sm text-sm text-slate-500">{text}</p>
      {action}
    </div>
  )
}

export function Disclaimer() {
  return <p className="mt-5 pb-2 text-center text-[11px] text-slate-600">All figures are simulated / estimated for prototype demonstration only — not real-world guarantees.</p>
}
