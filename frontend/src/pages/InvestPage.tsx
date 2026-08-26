import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { api, fmtCompact, fmtRupee } from '../api'
import { toast } from '../components/toast'
import { Badge, Button, Card, Disclaimer, EmptyState, PageHeader, RiskBar, Skeleton } from '../components/ui'

const PALETTE = ['#22d3ee', '#34d399', '#a78bfa', '#fbbf24', '#f87171', '#38bdf8', '#fb923c', '#4ade80']

export default function InvestPage() {
  const [budget, setBudget] = useState(1000000)
  const [controls, setControls] = useState<any[]>([])
  const [plan, setPlan] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getControls(),
      api.getRecommendations().catch(() => null),
    ]).then(([c, r]) => {
      setControls(c)
      if (r?.plan) setPlan(r.plan)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const optimize = async () => {
    setBusy(true)
    try {
      const p = await api.optimizeInvestment(budget)
      setPlan(p)
      toast(`Plan #${p.plan_id}: ${p.selected_controls.length} controls · ${fmtCompact(p.total_cost)} · risk ${p.risk_before} → ${p.risk_after}`)
    } catch { toast('Optimization failed', 'error') } finally { setBusy(false) }
  }

  const valueScore = (c: any) => ((c.expected_reduction * 100) / Math.max(c.cost / 100000, 0.1)).toFixed(1)
  const selectedIds: number[] = plan?.selected_controls?.map((c: any) => c.id) ?? plan?.controls?.map((c: any) => c.id) ?? []

  return (
    <div className="p-6">
      <PageHeader title="Security Investment Optimizer" subtitle="Highest expected risk reduction per rupee under budget constraint — greedy value heuristic with path-coverage boost" />

      <Card className="mb-4">
        <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm text-slate-300">Security budget</label>
              <div className="flex items-center gap-2">
                {[500000, 1000000, 1500000, 2000000].map((b) => (
                  <Button key={b} variant={budget === b ? 'primary' : 'ghost'} className="!px-2.5 !py-1 !text-xs" onClick={() => setBudget(b)}>
                    {fmtCompact(b)}
                  </Button>
                ))}
              </div>
            </div>
            <input type="range" min={100000} max={2000000} step={50000} value={budget}
              onChange={(e) => setBudget(Number(e.target.value))} className="w-full" />
            <div className="mt-1 flex justify-between text-[10px] text-slate-600"><span>₹1L</span><span>₹20L</span></div>
          </div>
          <div className="flex items-center gap-3">
            <input type="number" min={0} step={50000} value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-40 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-right font-mono text-lg" />
            <Button onClick={optimize} loading={busy} disabled={busy || budget <= 0}>Optimize portfolio</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <Card title={`Available Controls (${controls.length})`} className="lg:col-span-3"
          right={<span className="text-[11px] text-slate-600">highlighted = in current plan</span>}>
          {loading ? <Skeleton lines={8} /> : (
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-slate-800 text-[10px] tracking-wider text-slate-500 uppercase">
                <th className="py-2 pr-2">Control</th><th className="pr-2">Cost</th><th className="pr-2">Reduction</th>
                <th className="pr-2">Effort</th><th className="pr-2">Paths</th><th>Value/₹L</th></tr></thead>
              <tbody>
                {controls.map((c) => {
                  const chosen = selectedIds.includes(c.id)
                  return (
                    <tr key={c.id} className={`border-b border-slate-900/70 transition-colors ${chosen ? 'bg-emerald-500/[0.07]' : ''}`}>
                      <td className="py-2 pr-2">
                        <p className="font-medium text-slate-200">{chosen && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" />}{c.name}</p>
                        <p className="text-[11px] text-slate-500">{c.category}</p>
                      </td>
                      <td className="pr-2 font-mono text-xs">{fmtCompact(c.cost)}</td>
                      <td className="pr-2 font-mono text-emerald-400">{Math.round(c.expected_reduction * 100)}%</td>
                      <td className="pr-2"><Badge tone={c.effort === 'low' ? 'green' : c.effort === 'medium' ? 'blue' : 'amber'}>{c.effort}</Badge></td>
                      <td className="pr-2 font-mono text-[11px] text-slate-400">{(c.paths_affected as string[]).join(', ')}</td>
                      <td className="font-mono font-semibold text-cyan-300">{valueScore(c)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>

        <div className="space-y-3 lg:col-span-2">
          {plan ? (
            <>
              {(plan.selected_controls || plan.controls || []).length > 0 && (
                <Card title="Spend allocation">
                  <ReactECharts notMerge style={{ height: 170 }} option={{
                    backgroundColor: 'transparent',
                    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>${fmtRupee(p.value)} (${p.percent}%)` },
                    series: [{
                      type: 'pie', radius: ['52%', '78%'], center: ['50%', '50%'],
                      itemStyle: { borderRadius: 5, borderColor: '#020617', borderWidth: 2 },
                      label: { show: false }, data: (plan.selected_controls || plan.controls).map((c: any, i: number) => ({
                        name: c.name.split(' (')[0], value: c.cost, itemStyle: { color: PALETTE[i % PALETTE.length] },
                      })),
                    }],
                    graphic: [{ type: 'text', left: 'center', top: 'center', style: { text: fmtCompact(plan.total_cost), fill: '#e2e8f0', fontSize: 16, fontWeight: 700 } }],
                  }} />
                </Card>
              )}
              <Card title={`Recommended Plan`}>
                <ul className="space-y-1.5 text-sm">
                  {(plan.selected_controls || plan.controls || []).map((c: any, i: number) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/60 px-2.5 py-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="truncate text-slate-200">{c.name}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-slate-400">{fmtCompact(c.cost)} · −{Math.round((c.expected_reduction ?? 0) * 100)}%</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-xs"><span className="text-slate-400">Budget utilisation</span>
                    <span className="font-mono">{fmtRupee(plan.total_cost)} / {fmtRupee(plan.budget ?? plan.budget)}</span></div>
                  <RiskBar value={(plan.total_cost / (plan.budget || 1)) * 100} />
                  <div className="flex justify-between pt-1"><span className="text-slate-400">Projected risk</span>
                    <span>{plan.risk_before} → <b className="text-emerald-400">{plan.risk_after}</b></span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Expected reduction</span>
                    <span className="font-semibold text-emerald-400">−{plan.risk_reduction} pts ({plan.risk_reduction_pct}%)</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Efficiency</span>
                    <span className="font-mono">{plan.risk_reduction_per_rupee} pts/₹L</span></div>
                </div>
                {plan.applied
                  ? <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-center text-xs text-emerald-300">Deployed — view verification results</div>
                  : <Link to="/verification" className="mt-3 block rounded-lg bg-emerald-500 py-2 text-center text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.35)]">Deploy &amp; verify →</Link>}
              </Card>
            </>
          ) : (
            <Card title="No plan yet">
              <EmptyState text="Set a budget and run the optimizer to get a ranked control portfolio tailored to your attack paths." />
            </Card>
          )}
        </div>
      </div>
      <Disclaimer />
    </div>
  )
}
