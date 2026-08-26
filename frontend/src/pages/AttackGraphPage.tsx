import { useEffect, useMemo, useState } from 'react'
import { Background, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow } from '@xyflow/react'
import { api } from '../api'
import { Badge, Card, Disclaimer, EmptyState, PageHeader, Skeleton, critTone } from '../components/ui'

const nodeColor: Record<string, string> = { critical: '#f87171', high: '#fb923c', medium: '#38bdf8', low: '#64748b' }

function AssetNode({ data }: any) {
  const d = data as any
  return (
    <div className="rounded-lg border bg-slate-900/95 px-3 py-2 text-center shadow-lg transition-transform hover:scale-[1.03]"
      style={{ borderColor: nodeColor[d.criticality] || '#475569', boxShadow: d.on_critical_path ? `0 0 16px ${nodeColor[d.criticality]}88` : undefined }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: nodeColor[d.criticality] }} />
        <p className="max-w-[130px] truncate text-xs font-semibold text-slate-100">{d.name}</p>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-[10px] tracking-wider text-slate-500 uppercase">{d.criticality}</span>
        <span className="font-mono text-[10px]" style={{ color: nodeColor[d.criticality] }}>{d.risk}</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}

const nodeTypes = { asset: AssetNode }

export default function AttackGraphPage() {
  const [graph, setGraph] = useState<any>(null)
  const [chokes, setChokes] = useState<any[]>([])

  useEffect(() => {
    Promise.all([api.getAttackGraph(), api.getChokePoints()])
      .then(([g, c]) => { setGraph(g); setChokes(c) })
      .catch(console.error)
  }, [])

  const nodes = useMemo(() => (graph?.nodes || []).map((n: any) => ({
    id: String(n.id),
    type: 'asset',
    position: { x: n.position.x, y: n.position.y },
    data: n,
  })), [graph])

  const edges = useMemo(() => (graph?.edges || []).map((e: any) => ({
    id: e.id,
    source: String(e.source),
    target: String(e.target),
    type: 'smoothstep',
    animated: e.is_critical_path,
    label: `${e.technique} · ${Math.round(e.likelihood * 100)}%`,
    style: { stroke: e.is_critical_path ? '#f87171' : '#334155', strokeWidth: e.is_critical_path ? 2.2 : 1 },
    labelStyle: { fill: e.is_critical_path ? '#fca5a5' : '#94a3b8', fontSize: 9.5, fontFamily: 'monospace' },
    labelBgStyle: { fill: '#020617', fillOpacity: 0.85 },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    markerEnd: { type: MarkerType.ArrowClosed, color: e.is_critical_path ? '#f87171' : '#475569' },
  })), [graph])

  if (!graph) return <div className="p-6"><Card><Skeleton lines={10} height="h-5" /></Card></div>

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="relative min-h-[420px] flex-1 p-6">
        <PageHeader title="Attack Graph — Digital Twin" subtitle="Entry points to crown jewels · edge labels show MITRE technique and step likelihood" />
        <div className="h-[calc(100vh-190px)] overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
          <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}
            nodesDraggable={false} nodesConnectable={false} nodeTypes={nodeTypes} minZoom={0.3}>
            <Background color="#1e293b" gap={20} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor={(n: any) => nodeColor[(n.data as any)?.criticality] || '#475569'}
              maskColor="rgba(2,6,23,0.75)" style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
          </ReactFlow>
        </div>
        <div className="absolute right-9 bottom-9 rounded-lg border border-slate-800 bg-slate-900/95 px-3 py-2 text-[11px] backdrop-blur">
          <div className="flex items-center gap-3">
            {[['critical', '#f87171'], ['high', '#fb923c'], ['medium', '#38bdf8'], ['low', '#64748b']].map(([l, c]) => (
              <span key={l} className="inline-flex items-center gap-1.5 text-slate-400">
                <i className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
          <p className="mt-1 text-slate-600">Red glow + animated edges = highest-risk path</p>
        </div>
      </div>

      <div className="w-full shrink-0 space-y-3 overflow-y-auto border-t border-slate-800/80 p-4 lg:w-[380px] lg:border-t-0 lg:border-l">
        <Card title="Critical Attack Paths" >
          <ol className="space-y-2.5">
            {graph.paths.map((p: any, i: number) => (
              <li key={p.id} className={`rounded-xl border p-3 transition-all hover:translate-x-0.5 ${i === 0 ? 'border-red-500/40 bg-red-500/[0.06]' : 'border-slate-800 hover:border-slate-700'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <span className={`font-mono text-[11px] ${i === 0 ? 'text-red-400' : 'text-slate-600'}`}>#{i + 1}</span>
                    {p.name}
                  </span>
                  {p.is_critical && <Badge tone="red" pulse={i === 0}>critical</Badge>}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                  {[['risk', p.risk_score], ['lik.', `${Math.round(p.likelihood * 100)}%`], [`impact`, `₹${(p.financial_impact / 100000).toFixed(1)}L`]].map(([k, v]) => (
                    <div key={k as string} className="rounded-lg bg-slate-950/70 px-1 py-1.5">
                      <p className="font-mono text-xs text-slate-200">{v}</p>
                      <p className="text-[9px] tracking-wider text-slate-600 uppercase">{k}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {(p.techniques as string[]).map((t) => <Badge key={t}>{t}</Badge>)}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Choke Points — where to place controls">
          <ul className="space-y-2">
            {chokes.map((c) => (
              <li key={c.asset_id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/60 px-2.5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-300">{c.name}</p>
                  <p className="text-[10px] text-slate-600">traversal score {c.betweenness}</p>
                </div>
                <Badge tone={critTone(c.criticality)}>{c.criticality}</Badge>
              </li>
            ))}
            {chokes.length === 0 && <EmptyState text="No choke points detected." />}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-600">Betweenness centrality ranks assets an attacker must traverse most often — prime locations for the optimizer's controls.</p>
        </Card>
        <Disclaimer />
      </div>
    </div>
  )
}
