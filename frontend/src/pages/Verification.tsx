import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import { api, fmtCompact, fmtRupee } from '../api'
import { toast } from '../components/toast'
import { Badge, Button, Card, CompareBar, Disclaimer, EmptyState, PageHeader, PhaseStepper, StatCard } from '../components/ui'

export default function Verification() {
  const [result, setResult] = useState<any>(null)
  const [hasPlan, setHasPlan] = useState<boolean | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [busy, setBusy] = useState(false)

  const check = async () => {
    try {
      const r = await api.getRecommendations()
      setHasPlan(!!r?.plan)
      setHistory(await api.getRiskHistory())
    } catch { setHasPlan(false) }
  }
  useEffect(() => { check() }, [])

  const run = async () => {
    setBusy(true)
    try {
      const r = await api.runVerification()
      if (r.verification_status === 'blocked') toast(r.reason, 'error')
      else {
        setResult(r)
        toast(`Verified: risk ${r.risk_before_initial} → ${r.risk_after_investment} (−${r.reduction_percentage}%)`)
      }
      setHistory(await api.getRiskHistory())
    } finally { setBusy(false) }
  }

  return (
    <div className="p-6">
      <PageHeader title="Deploy & Verify" subtitle="Simulated deployment → recalculated attack graph → measured before vs after"
        actions={<Button variant="success" loading={busy} disabled={busy || hasPlan === false} onClick={run}>Run post-investment verification</Button>} />

      {hasPlan && !result && (
        <Card className="mb-3"><PhaseStepper active={2} /></Card>
      )}

      {hasPlan === false && (
        <Card className="border-amber-500/30 bg-amber-500/[0.06]">
          <EmptyState text="No investment plan found — the optimizer must select controls before deployment can be simulated."
            action={<Link to="/investment" className="rounded-lg bg-cyan-500 px-4 py-1.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400">Go to Investment Optimizer</Link>} />
        </Card>
      )}

      {!result && hasPlan !== false && (
        <Card><EmptyState text="Run verification to simulate deployment of the recommended controls and measure exactly how much risk they remove." /></Card>
      )}

      {result && (
        <>
          <Card className="mb-3"><PhaseStepper active={3} /></Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Risk before" value={result.risk_before_initial} accent="text-red-400" sub={`evidence-adjusted ${result.risk_after_evidence}`} />
            <StatCard label="Risk after" value={result.risk_after_investment} accent="text-emerald-400" sub={`${result.reduction_percentage}% reduction`} />
            <StatCard label="Investment" value={Math.round(result.investment_cost / 100000)} prefix="₹" suffix=" L" decimals={1} accent="text-cyan-300" sub={`${result.controls_applied.length} controls deployed`} />
            <StatCard label="Efficiency" value={result.risk_reduction_per_rupee} decimals={2} suffix=" pts/₹L" accent="text-emerald-300" sub="points removed per ₹1L" />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card title="Risk & loss delta">
              <CompareBar labelBefore="Risk before" labelAfter="Risk after" before={result.risk_before_initial} after={result.risk_after_investment} />
              <div className="my-4 border-t border-slate-800/70" />
              <CompareBar labelBefore={`Loss before (${fmtCompact(result.expected_loss_before)})`} labelAfter={`Loss after (${fmtCompact(result.expected_loss_after)})`}
                before={result.expected_loss_before / 100000} after={result.expected_loss_after / 100000} unit=" L" />
              <p className="mt-3 rounded-lg bg-emerald-500/10 py-1.5 text-center text-sm font-semibold text-emerald-300">
                Avoided loss: {fmtRupee(result.loss_reduction)}
              </p>
            </Card>

            <Card title="Feedback loop — next cycle">
              <div className="rounded-lg border border-sky-500/25 bg-sky-500/[0.07] p-3">
                <Badge tone="blue">observed outcome feeds learning</Badge>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">{result.feedback?.next_cycle_recommendation}</p>
              </div>
              <p className="mt-3 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Areas to watch</p>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {(result.feedback?.areas_to_watch || []).map((a: string) => (
                  <li key={a} className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-2.5 py-1.5"><span className="h-1 w-1 rounded-full bg-amber-400" />{a}</li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-600">{result.feedback?.observed_outcome}. Evidence layer resets for the next optimization cycle.</p>
            </Card>

            <Card title="Controls deployed">
              <div className="flex flex-wrap gap-1.5">
                {result.controls_applied.map((id: number) => <Badge key={id} tone="blue">control #{id}</Badge>)}
              </div>
              <dl className="mt-4 space-y-2 text-xs">
                {[['Verification status', result.verification_status],
                  ['Timestamp', new Date(result.timestamp).toLocaleString('en-IN')],
                  ['Loss before', fmtRupee(result.expected_loss_before)],
                  ['Loss after', fmtRupee(result.expected_loss_after)]].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between border-b border-slate-800/60 pb-1.5 last:border-none">
                    <dt className="text-slate-500">{k}</dt><dd className="font-mono text-slate-300">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          <Card title="Risk timeline across the loop" className="mt-3">
            <ReactECharts notMerge style={{ height: 220 }} option={{
              backgroundColor: 'transparent',
              grid: { left: 42, right: 24, top: 26, bottom: 60 },
              xAxis: { type: 'category', data: history.map((s, i) => `${s.phase} #${i + 1}`), axisLabel: { color: '#64748b', fontSize: 10, rotate: 22 } },
              yAxis: { type: 'value', max: 100, axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
              tooltip: { trigger: 'axis', backgroundColor: '#0f172a', borderColor: '#334155', textStyle: { color: '#e2e8f0' } },
              series: [{
                type: 'line', data: history.map((s) => s.score), smooth: true, symbol: 'circle', symbolSize: 7,
                lineStyle: { color: '#34d399', width: 3 }, itemStyle: { color: '#34d399', borderColor: '#065f46', borderWidth: 2 },
                areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(52,211,153,0.22)' }, { offset: 1, color: 'rgba(52,211,153,0)' }] } },
                markLine: { silent: true, symbol: 'none',
                  data: [{ yAxis: result.risk_before_initial, lineStyle: { color: '#f87171', type: 'dashed' }, label: { formatter: 'pre-investment', color: '#f87171' } }],
                  label: { position: 'insideEndTop', fontSize: 10 } },
              }],
            }} />
          </Card>
        </>
      )}
      <Disclaimer />
    </div>
  )
}
