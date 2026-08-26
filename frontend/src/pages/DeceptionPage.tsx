import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { toast } from '../components/toast'
import { Badge, Button, Card, Disclaimer, EmptyState, PageHeader, PhaseStepper, RiskBar, cx } from '../components/ui'

const STEP_HINTS = ['Deploy decoys', 'Simulate attacker', 'Correlate evidence', 'Recalibrate risk']

export default function DeceptionPage() {
  const [decoys, setDecoys] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [evidence, setEvidence] = useState<any>(null)
  const [recal, setRecal] = useState<any>(null)
  const [busy, setBusy] = useState<string>('')
  const lastSeenId = useRef(0)

  const load = useCallback(async () => {
    const [d, s, e, c] = await Promise.all([
      api.getDeceptions(), api.getDeceptionSummary(), api.getEvents(12), api.correlateEvidence(),
    ])
    setDecoys(d); setSummary(s); setEvents(e); setEvidence(c)
  }, [])

  useEffect(() => { load().catch(console.error) }, [load])
  useEffect(() => {
    const t = setInterval(() => { load().catch(() => {}) }, 5000)
    return () => clearInterval(t)
  }, [load])

  const stage = recal ? 3 : (evidence?.total_events ?? 0) > 0 ? 2 : summary?.active > 0 ? 1 : 0

  const deployAll = async () => {
    setBusy('deploy')
    try {
      const r = await api.deployAllDecoys()
      toast(`${r.deployed} decoy(s) deployed — isolated & synthetic`)
      await load()
    } catch { toast('Deployment failed', 'error') } finally { setBusy('') }
  }

  const simulate = async (id: number) => {
    setBusy(`sim-${id}`)
    try {
      await api.simulateRandomEvent(id)
      toast('Attacker interaction captured on decoy', 'info')
      await load()
    } catch { toast('Simulation failed', 'error') } finally { setBusy('') }
  }

  const recalibrate = async () => {
    setBusy('recal')
    try {
      const r = await api.recalculateRisk(0.25)
      setRecal(r)
      toast(`Risk recalibrated: ${r.previous_score} → ${r.overall_score}, confidence ${r.confidence_level}`)
      await load()
    } catch { toast('Recalibration failed', 'error') } finally { setBusy('') }
  }

  return (
    <div className="p-6">
      <PageHeader title="Deception Validation (DVR)" subtitle="Isolated decoys and honeytokens turn predicted risk into validated behavioural evidence"
        actions={<Button onClick={deployAll} loading={busy === 'deploy'} disabled={!!busy || !summary?.ready}>Deploy all decoys{summary ? ` (${summary.ready})` : ''}</Button>} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PhaseStepper active={stage} />
          <p className="text-[11px] text-slate-600">{STEP_HINTS[stage]}{stage < 3 && ' → next'}</p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {decoys.map((d) => (
          <Card key={d.id} className={cx(d.status === 'active' && 'border-violet-500/40 bg-violet-950/10')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-200">{d.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{d.location}</p>
              </div>
              <Badge tone={d.status === 'active' ? 'violet' : 'slate'} pulse={d.status === 'active'}>{d.status}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-mono">{d.decoy_ip || 'unassigned'}</span>
              <span>{d.deception_type.replace('_', ' ')}</span>
            </div>
            <Button variant="ghost" className="mt-3 w-full" loading={busy === `sim-${d.id}`}
              disabled={d.status !== 'active' || !!busy}
              onClick={() => simulate(d.id)}>
              Simulate attacker interaction
            </Button>
          </Card>
        ))}
        {decoys.length === 0 && <EmptyState text="No deception assets registered." />}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-5">
        <Card title="Live Interaction Feed" className="lg:col-span-3"
          right={<span className="font-mono text-[11px] text-slate-500">polling 5s</span>}>
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b border-slate-800 text-[10px] tracking-wider text-slate-500 uppercase">
              <th className="py-1.5 pr-2">Time</th><th className="pr-2">Event</th><th className="pr-2">Technique</th>
              <th className="pr-2">Severity</th><th>Confidence</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className={cx('border-b border-slate-900/70 hover:bg-slate-900/40', e.id === events[0]?.id && lastSeenId.current !== 0 && e.id > lastSeenId.current && 'flash-row')}>
                  <td className="py-2 pr-2 font-mono whitespace-nowrap text-slate-500">{new Date(e.timestamp).toLocaleTimeString('en-IN')}</td>
                  <td className="pr-2 text-slate-300">{e.description || e.event_type}</td>
                  <td className="pr-2"><Badge>{e.technique}</Badge></td>
                  <td className={cx('pr-2 font-mono', e.severity >= 0.85 ? 'text-red-400' : 'text-amber-400')}>{e.severity.toFixed(2)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-12 overflow-hidden rounded bg-slate-800"><div className="h-full bg-violet-400" style={{ width: `${e.confidence * 100}%` }} /></div>
                      <span className="font-mono text-violet-300">{Math.round(e.confidence * 100)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-600">No interactions yet — deploy a decoy, then simulate an attacker touch</td></tr>}
            </tbody>
          </table>
          {summary && (
            <div className="mt-3 flex gap-4 text-[11px] text-slate-500">
              <span>Engagement rate <b className="text-slate-300">{summary.engagement_rate_pct}%</b></span>
              <span>Total events <b className="text-slate-300">{summary.events_total}</b></span>
              <span>Engaged decoys <b className="text-slate-300">{summary.engaged_decoys}/{summary.active}</b></span>
            </div>
          )}
        </Card>

        <Card title="Evidence Correlation" className="lg:col-span-2">
          {evidence && (
            <>
              <div className="space-y-3">
                {[['Evidence confidence', (evidence.evidence_confidence ?? 0) * 100, Math.round((evidence.evidence_confidence ?? 0) * 100) + '%', 'bg-cyan-400'],
                  ['Attacker interest score', evidence.attacker_interest_score, String(evidence.attacker_interest_score), 'bg-red-400'],
                  ['Behaviour severity', (evidence.behaviour_severity ?? 0) * 100, String(evidence.behaviour_severity ?? 0), 'bg-amber-400']].map(([label, val, txt, color]) => (
                  <div key={label as string}>
                    <div className="mb-1 flex justify-between text-xs"><span className="text-slate-400">{label}</span><span className="font-mono text-slate-200">{txt}</span></div>
                    <div className="h-1.5 overflow-hidden rounded bg-slate-800"><div className={cx('h-full rounded transition-all duration-700', color)} style={{ width: `${Math.min(100, val as number)}%` }} /></div>
                  </div>
                ))}
              </div>
              <p className="mt-4 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Affected attack paths</p>
              <ul className="space-y-1.5">
                {(evidence.affected_paths || []).slice(0, 4).map((a: any) => (
                  <li key={a.path_id} className="rounded-lg bg-slate-950/60 px-2.5 py-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-slate-300">{a.path_name}</span>
                      <span className="shrink-0 font-mono text-emerald-400">+{a.evidence_impact} pts</span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-600">{a.matched_events} matched event(s) · via {Array.from(new Set(a.decoy_names)).join(', ') || '—'}</p>
                  </li>
                ))}
                {(!evidence.affected_paths || evidence.affected_paths.length === 0) &&
                  <li className="text-xs text-slate-600">Correlation appears once decoy events match path techniques.</li>}
              </ul>
            </>
          )}
        </Card>
      </div>

      <Card title="Risk Recalibration — close the DVR loop" className="mt-3">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="success" loading={busy === 'recal'} disabled={!!busy || (events.length === 0)} onClick={recalibrate}>
            Apply evidence → recalculate risk
          </Button>
          {recal && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-lg bg-slate-950/70 px-3 py-1.5">
                <span className="text-lg font-bold text-red-400">{recal.previous_score}</span>
                <Badge tone="slate">{recal.previous_confidence}</Badge>
              </span>
              <span className="text-xl text-cyan-400">→</span>
              <span className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5">
                <span className="text-xl font-extrabold text-emerald-400">{recal.overall_score}</span>
                <Badge tone="green">{recal.confidence_level.toUpperCase()} ({Math.round(recal.confidence * 100)}%)</Badge>
              </span>
              <span className="text-xs text-slate-500">Δ +{recal.change} pts from {recal.evidence_events} validated events</span>
              <a href="/investment" className="text-sm font-medium text-cyan-400 underline-offset-2 hover:underline">Continue to investment →</a>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-[11px] leading-relaxed text-slate-500">
        Safety by design: decoys are simulated isolated assets with synthetic data and credentials only. No real systems are scanned, no real secrets used, no intentionally vulnerable services exposed.
      </div>
      <Disclaimer />
    </div>
  )
}
