import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { api, fmtCompact, fmtRupee } from '../api'
import { toast } from '../components/toast'
import { Badge, Button, Card, Disclaimer, EmptyState, PageHeader, PhaseStepper, RiskBar, Skeleton, StatCard, riskTone } from '../components/ui'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [risk, setRisk] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [plan, setPlan] = useState<any>(null)

  const load = async () => {
    const [m, r, h, e, rec] = await Promise.all([
      api.getMetrics(), api.getCurrentRisk(), api.getRiskHistory(), api.getEvents(6),
      api.getRecommendations().catch(() => null),
    ])
    setMetrics(m); setRisk(r); setHistory(h); setEvents(e); setPlan(rec?.plan ?? null)
  }
  useEffect(() => { load().catch(console.error) }, [])

  if (!metrics || !risk) return <div className="p-6"><Card><Skeleton lines={8} height="h-6" /></Card></div>

  const phases = history.map((s) => s.phase)
  const stage = phases.includes('post_investment') ? 3
    : plan?.applied ? 3
    : plan ? 2
    : phases.includes('validated') ? 1 : 0

  const drivers: { name: string; value: number }[] = (risk.top_drivers as string[] | undefined)?.map((d) => ({
    name: d.split(' (Risk')[0],
    value: Number(d.match(/([\d.]+)\)$/)?.[1] ?? 0),
  })) ?? []

  return (
    <div className="p-6">
      <PageHeader
        title="Executive Dashboard"
        subtitle="NovaTech Manufacturing · continuous cyber-risk posture"
        actions={<Button variant="ghost" onClick={() => { load(); toast('Dashboard refreshed', 'info') }}>Refresh</Button>}
      />

      <Card className="mb-4">
        <PhaseStepper active={stage} />
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="flex items-center justify-center !p-1" title={undefined}>
          <ReactECharts notMerge style={{ height: 168, width: '100%' }} option={{
            series: [{
              type: 'gauge', startAngle: 210, endAngle: -30, min: 0, max: 100, radius: '115%',
              progress: { show: true, width: 12, roundCap: true },
              axisLine: { roundCap: true, lineStyle: { width: 12, color: [[0.45, '#134e4a'], [0.7, '#78350f'], [1, '#7f1d1d']] } },
              pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
              detail: { fontSize: 34, fontWeight: 800, offsetCenter: [0, '-8%'], color: '#e2e8f0' },
              title: { offsetCenter: [0, '28%'], fontSize: 10, color: '#64748b' },
              data: [{ value: metrics.overall_risk_score, name: `RISK ${risk.confidence_level?.toUpperCase()}` }],
            }],
          }} />
        </Card>
        <StatCard label="Expected Loss" value={Math.round(metrics.estimated_expected_loss / 100000)} prefix="₹" suffix=" L" decimals={1} accent="text-amber-400"
          sub={`${fmtRupee(metrics.estimated_expected_loss)} simulated`} />
        <StatCard label="High-Risk Paths" value={metrics.high_risk_paths_count} accent="text-red-400"
          sub={`${metrics.critical_assets_count} critical assets`} />
        <StatCard label="Active Decoys" value={metrics.active_deception_assets} accent="text-violet-400"
          sub={`${metrics.recent_interactions} interactions logged`} />
        <StatCard label="Efficiency" value={metrics.risk_reduction_per_rupee} decimals={2} suffix=" pts/₹L" accent="text-emerald-400"
          sub={`post-invest risk ${metrics.post_investment_risk}`} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card title="Top Risk Drivers" right={<Badge tone={riskTone(metrics.overall_risk_score)}>{metrics.overall_risk_score}/100</Badge>}>
          {drivers.length ? (
            <ol className="space-y-3">
              {drivers.slice(0, 5).map((d, i) => (
                <li key={i}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate text-slate-300">{i + 1}. {d.name}</span>
                    <span className="ml-2 shrink-0 font-mono text-cyan-300">{d.value}</span>
                  </div>
                  <RiskBar value={d.value} delay={i * 90} />
                </li>
              ))}
            </ol>
          ) : <EmptyState text="No risk data yet." />}
          <p className="mt-4 text-[11px] text-slate-600">Evidence confidence {Math.round((risk.confidence ?? 0) * 100)}% · phase {risk.phase}</p>
        </Card>

        <Card title="Investment Recommendation" right={<Badge tone="green">₹10L target</Badge>}>
          <div className="space-y-2.5 text-sm">
            {[
              ['Recommended budget', fmtCompact(metrics.recommended_investment), 'text-emerald-400 font-semibold'],
              ['Expected risk reduction', `−${metrics.expected_risk_reduction} pts`, 'font-semibold'],
              ['Post-investment risk', `${metrics.post_investment_risk}/100`, 'text-emerald-300'],
              ['Reduction per ₹ invested', `${metrics.risk_reduction_per_rupee} pts/₹L`, ''],
            ].map(([k, v, cls]) => (
              <div key={k as string} className="flex items-center justify-between border-b border-slate-800/60 pb-2 last:border-none last:pb-0">
                <span className="text-slate-400">{k}</span><span className={cls as string}>{v}</span>
              </div>
            ))}
          </div>
          <a href="/investment" className="mt-4 block rounded-lg bg-cyan-500 py-2 text-center text-sm font-semibold text-slate-950 transition-all hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]">
            Open Investment Optimizer
          </a>
          {plan && <p className="mt-2 text-center text-[11px] text-slate-500">Latest plan #{plan.plan_id ?? plan.id}: {fmtCompact(plan.total_cost)} · projected {plan.risk_before} → {plan.risk_after}</p>}
        </Card>

        <Card title="Recent Attacker Interactions" right={<Badge tone="violet" pulse={events.length > 0}>decoys</Badge>}>
          {events.length === 0
            ? <EmptyState text="No decoy activity yet — deploy decoys on the Deception Validation page to start gathering evidence."
                action={<a href="/deception" className="rounded-lg bg-violet-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-400">Go to Deception</a>} />
            : (
              <ul className="space-y-1.5 text-xs">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/60 px-2.5 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-slate-300">{e.description || e.event_type}</p>
                      <p className="text-[10px] text-slate-600">{new Date(e.timestamp).toLocaleTimeString('en-IN')} · {e.technique}</p>
                    </div>
                    <span className="shrink-0 font-mono text-violet-300">{Math.round(e.confidence * 100)}%</span>
                  </li>
                ))}
              </ul>
            )}
        </Card>
      </div>

      <Card title="Risk Journey — Baseline → Evidence → Post-Investment" className="mt-3">
        {history.length > 1 ? (
          <ReactECharts notMerge style={{ height: 210 }} option={{
            backgroundColor: 'transparent',
            grid: { left: 40, right: 24, top: 24, bottom: 48 },
            xAxis: { type: 'category', data: history.map((s, i) => `${s.phase} #${i + 1}`), axisLabel: { color: '#64748b', fontSize: 10, rotate: 20 } },
            yAxis: { type: 'value', max: 100, axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
            tooltip: { trigger: 'axis', backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
            series: [{
              type: 'line', data: history.map((s) => s.score), smooth: true,
              symbol: 'circle', symbolSize: 7,
              lineStyle: { color: '#22d3ee', width: 3 },
              itemStyle: { color: '#22d3ee', borderColor: '#0e7490', borderWidth: 2 },
              areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(34,211,238,0.25)' }, { offset: 1, color: 'rgba(34,211,238,0)' }] } },
              markPoint: { data: [{ type: 'max' }, { type: 'min' }], symbolSize: 42, itemStyle: { color: 'transparent' }, label: { color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' } },
            }],
          }} />
        ) : <EmptyState text="Run the demo loop — deploy decoys and optimize investment — to build the risk timeline." />}
      </Card>
      <Disclaimer />
    </div>
  )
}
