import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { api, fmtCompact, fmtRupee } from '../api'
import { Badge, Card, Disclaimer, PageHeader, PhaseStepper, RiskBar, Skeleton } from '../components/ui'

export default function RiskPage() {
  const [risk, setRisk] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [threats, setThreats] = useState<any[]>([])

  useEffect(() => {
    Promise.all([api.getCurrentRisk(), api.getRiskHistory(), api.getThreats()])
      .then(([r, h, t]) => { setRisk(r); setHistory(h); setThreats(t) })
      .catch(console.error)
  }, [])

  if (!risk) return <div className="p-6"><Card><Skeleton lines={8} height="h-6" /></Card></div>

  const drivers = (risk.top_drivers as string[] | undefined)?.map((d) => ({
    name: d.split(' (Risk')[0],
    value: Number(d.match(/([\d.]+)\)$/)?.[1] ?? 0),
  })).reverse() ?? []

  const scoreColor = risk.score >= 70 ? '#f87171' : risk.score >= 45 ? '#fbbf24' : '#34d399'

  return (
    <div className="p-6">
      <PageHeader title="Cyber Risk Quantification"
        subtitle="Likelihood × Business Impact × Exposure × Path Confidence — normalized 0–100"
        actions={<PhaseStepper active={risk.phase === 'post_investment' ? 3 : risk.phase === 'validated' ? 1 : 0} />} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card>
          <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Technical risk score</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-6xl font-extrabold tabular-nums tracking-tight" style={{ color: scoreColor }}>{Math.round(risk.score)}</span>
            <span className="pb-2 text-slate-600">/100</span>
          </div>
          <RiskBar value={risk.score} />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            Phase: <Badge tone="blue">{risk.phase}</Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            Confidence:
            <Badge tone={risk.confidence_level === 'high' ? 'green' : risk.confidence_level === 'medium' ? 'amber' : 'slate'} pulse={risk.confidence_level === 'high'}>
              {risk.confidence_level?.toUpperCase()} ({Math.round((risk.confidence ?? 0) * 100)}%)
            </Badge>
          </div>
          <p className="mt-3 text-[11px] text-slate-600">{risk.timestamp ? `Snapshot ${new Date(risk.timestamp).toLocaleString('en-IN')}` : ''}</p>
        </Card>

        <Card title="Estimated financial exposure">
          <p className="mt-1 text-5xl font-extrabold tracking-tight text-amber-400">{fmtCompact(risk.financial_loss)}</p>
          <p className="mt-1.5 text-xs text-slate-500">{fmtRupee(risk.financial_loss)} simulated annualized expected loss</p>
          <div className="mt-5 space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs leading-relaxed text-slate-400">
            <p className="font-mono text-cyan-300/90">R = L × I × E × C<sub>path</sub></p>
            <p>Per-path risks aggregated with criticality weights; behavioural evidence from decoys raises path confidence.</p>
          </div>
        </Card>

        <Card title="Threat likelihood · intel feed" right={<Badge tone="slate">synthetic</Badge>}>
          <ul className="space-y-2.5">
            {threats.map((t) => (
              <li key={t.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5"><Badge>{t.technique}</Badge><span className="truncate text-slate-300">{t.name}</span></span>
                  <span className="ml-2 shrink-0 font-mono text-cyan-300">{Math.round(t.likelihood * 100)}%</span>
                </div>
                <RiskBar value={t.likelihood * 100} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card title="Top risk drivers" className="lg:col-span-2">
          <ReactECharts notMerge style={{ height: 270 }} option={{
            backgroundColor: 'transparent',
            grid: { left: 150, right: 46, top: 12, bottom: 26 },
            xAxis: { type: 'value', max: 100, axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
            yAxis: { type: 'category', data: drivers.map((d) => d.name), axisLabel: { color: '#94a3b8', fontSize: 11 } },
            tooltip: { backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
            series: [{
              type: 'bar', data: drivers.map((d) => d.value), barWidth: 15,
              itemStyle: { borderRadius: 7, color: (p: any) => (p.value >= 70 ? '#f87171' : p.value >= 45 ? '#fbbf24' : '#34d399') },
              label: { show: true, position: 'right', color: '#e2e8f0', fontSize: 11, fontFamily: 'monospace' },
              animationDelay: (i: number) => i * 90,
            }],
          }} />
        </Card>

        <Card title="Snapshot timeline">
          <ol className="relative space-y-4 border-l border-slate-800 pl-5">
            {[...history].slice(-7).reverse().map((s, i) => (
              <li key={s.id} className="relative">
                <span className={`absolute top-1 -left-[25px] h-2.5 w-2.5 rounded-full border-2 border-slate-950 ${i === 0 ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]' : 'bg-slate-600'}`} />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-200 capitalize">{s.phase}</p>
                  <span className="font-mono text-sm" style={{ color: s.score >= 70 ? '#f87171' : s.score >= 45 ? '#fbbf24' : '#34d399' }}>{s.score}</span>
                </div>
                <p className="text-[11px] text-slate-500">conf {Math.round(s.confidence * 100)}% · loss {fmtCompact(s.financial_loss)}</p>
              </li>
            ))}
            {history.length === 0 && <li className="text-xs text-slate-600">No snapshots yet</li>}
          </ol>
        </Card>
      </div>
      <Disclaimer />
    </div>
  )
}
