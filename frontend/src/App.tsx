import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { api } from './api'
import { Toaster, toast } from './components/toast'
import { Button, cx } from './components/ui'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import AttackGraphPage from './pages/AttackGraphPage'
import RiskPage from './pages/RiskPage'
import DeceptionPage from './pages/DeceptionPage'
import InvestPage from './pages/InvestPage'
import Verification from './pages/Verification'

const groups = [
  {
    label: 'Monitor',
    items: [
      { path: '/', label: 'Dashboard', hint: 'Executive overview' },
      { path: '/assets', label: 'Assets', hint: 'Inventory & exposure' },
      { path: '/attack-graph', label: 'Attack Graph', hint: 'Digital twin' },
      { path: '/risk', label: 'Risk Quantification', hint: 'Score & drivers' },
    ],
  },
  {
    label: 'Act',
    items: [
      { path: '/deception', label: 'Deception Validation', hint: 'DVR evidence loop' },
      { path: '/investment', label: 'Investment Optimizer', hint: 'Budget allocation' },
      { path: '/verification', label: 'Verify & Feedback', hint: 'Before vs after' },
    ],
  },
]

export default function App() {
  const [resetting, setResetting] = useState(false)

  const resetDemo = async () => {
    setResetting(true)
    try {
      await api.resetDemo()
      toast('Demo environment reset to baseline', 'info')
      setTimeout(() => window.location.reload(), 600)
    } catch {
      toast('Reset failed', 'error')
      setResetting(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950/80">
        <div className="border-b border-slate-800/80 px-4 py-4">
          <h1 className="text-lg font-extrabold tracking-[0.2em] text-cyan-400">NEXOSHI</h1>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Adaptive Cyber Risk &amp; Deception Investment Optimizer</p>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-1.5 px-3 text-[10px] font-bold tracking-[0.18em] text-slate-600 uppercase">{g.label}</p>
              <div className="space-y-0.5">
                {g.items.map((n) => (
                  <NavLink key={n.path} to={n.path} end={n.path === '/'}
                    className={({ isActive }) =>
                      cx('relative block rounded-lg px-3 py-2 transition-all',
                        isActive ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200')}>
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
                        <span className="block text-sm font-medium">{n.label}</span>
                        <span className="block text-[10px] text-slate-600">{n.hint}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="space-y-2 border-t border-slate-800/80 p-3">
          <Button variant="ghost" className="w-full" loading={resetting} onClick={resetDemo} disabled={resetting}>
            Reset demo environment
          </Button>
          <p className="text-center text-[10px] tracking-wider text-slate-600">SIH 2026 · NovaTech Manufacturing</p>
        </div>
      </aside>
      <main key={location.pathname} className="page-enter flex-1 overflow-y-auto bg-slate-950/40">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/attack-graph" element={<AttackGraphPage />} />
          <Route path="/risk" element={<RiskPage />} />
          <Route path="/deception" element={<DeceptionPage />} />
          <Route path="/investment" element={<InvestPage />} />
          <Route path="/verification" element={<Verification />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  )
}
