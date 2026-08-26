import { useEffect, useState } from 'react'
import { api } from '../api'
import { toast } from '../components/toast'
import { Badge, Button, Card, Disclaimer, PageHeader, RiskBar, Skeleton, critTone, cx } from '../components/ui'

export default function Assets() {
  const [assets, setAssets] = useState<any[]>([])
  const [vulns, setVulns] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', asset_type: 'server', criticality: 'medium', internet_exposed: false, data_sensitivity: 3 })

  const load = async () => {
    const [a, v] = await Promise.all([api.getAssets(), api.getVulns()])
    setAssets(a); setVulns(v); setLoading(false)
  }
  useEffect(() => { load().catch(console.error) }, [])

  const submit = async () => {
    if (!form.name) { toast('Asset name is required', 'error'); return }
    setSaving(true)
    try {
      await api.addAsset({ ...form, business_function: 'User defined' })
      toast(`Asset "${form.name}" added to inventory`)
      setForm({ name: '', asset_type: 'server', criticality: 'medium', internet_exposed: false, data_sensitivity: 3 })
      setShowForm(false)
      await load()
    } catch { toast('Failed to add asset', 'error') } finally { setSaving(false) }
  }

  const vulnCount = (id: number) => vulns.filter((v) => v.asset_id === id).length
  const maxCve = (id: number) => {
    const vs = vulns.filter((v) => v.asset_id === id)
    return vs.length ? Math.max(...vs.map((v) => v.severity)) : null
  }
  const shown = filter === 'all' ? assets : assets.filter((a) => a.criticality === filter)

  return (
    <div className="p-6">
      <PageHeader title="Asset Inventory" subtitle={`${assets.length} synthetic assets · ${vulns.length} known vulnerabilities`}
        actions={<>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm capitalize">
            {['all', 'critical', 'high', 'medium', 'low'].map((c) => <option key={c}>{c}</option>)}
          </select>
          <Button variant="ghost" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add asset'}</Button>
        </>} />

      {showForm && (
        <Card className="mb-4">
          <div className="grid grid-cols-1 items-end gap-3 text-sm md:grid-cols-5">
            <label className="block text-xs text-slate-400 md:col-span-2">Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 focus:border-cyan-500 focus:outline-none" placeholder="e.g. Analytics Server" /></label>
            <label className="block text-xs text-slate-400">Type
              <input value={form.asset_type} onChange={(e) => setForm({ ...form, asset_type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 focus:border-cyan-500 focus:outline-none" /></label>
            <label className="block text-xs text-slate-400">Criticality
              <select value={form.criticality} onChange={(e) => setForm({ ...form, criticality: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 capitalize focus:border-cyan-500 focus:outline-none">
                {['low', 'medium', 'high', 'critical'].map((c) => <option key={c}>{c}</option>)}
              </select></label>
            <label className="block text-xs text-slate-400">Data sensitivity (1–5)
              <input type="number" min={1} max={5} value={form.data_sensitivity}
                onChange={(e) => setForm({ ...form, data_sensitivity: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 focus:border-cyan-500 focus:outline-none" /></label>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={form.internet_exposed} onChange={(e) => setForm({ ...form, internet_exposed: e.target.checked })}
                className="h-3.5 w-3.5 accent-cyan-500" />
              Internet exposed
            </label>
            <Button onClick={submit} loading={saving}>Save asset</Button>
          </div>
        </Card>
      )}

      <Card pad={false}>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-slate-800 text-[10px] tracking-wider text-slate-500 uppercase">
            <th className="px-4 py-3 pr-3">Asset</th><th className="pr-3">Criticality</th><th className="pr-3">Exposed</th>
            <th className="pr-3">Sens.</th><th className="pr-3">CVEs</th><th className="pr-3">Max CVSS</th>
            <th className="w-44 pr-4">Risk contribution</th></tr></thead>
          <tbody>
            {shown.map((a) => (
              <tr key={a.id} className="border-b border-slate-900/70 transition-colors hover:bg-slate-900/40">
                <td className="px-4 py-2.5 pr-3">
                  <p className="font-medium text-slate-200">{a.name}</p>
                  <p className="text-[11px] text-slate-600">{a.ip_address} · {a.business_function}</p>
                </td>
                <td className="pr-3"><Badge tone={critTone(a.criticality)}>{a.criticality}</Badge></td>
                <td className="pr-3 text-xs">{a.internet_exposed ? <span className="flex items-center gap-1 text-red-400"><i className="h-1.5 w-1.5 rounded-full bg-red-400" />Yes</span> : <span className="text-slate-600">No</span>}</td>
                <td className="pr-3 font-mono text-xs">{a.data_sensitivity}/5</td>
                <td className="pr-3 font-mono text-xs">{vulnCount(a.id) || <span className="text-slate-600">—</span>}</td>
                <td className="pr-3"><span className={cx('font-mono text-xs', maxCve(a.id) !== null && (maxCve(a.id)! >= 8 ? 'text-red-400' : 'text-amber-400'))}>{maxCve(a.id)?.toFixed(1) ?? '—'}</span></td>
                <td className="py-2.5 pr-4"><RiskBar value={a.risk_contribution} /><span className="mt-0.5 block font-mono text-[10px] text-slate-600">{a.risk_contribution}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-4"><Skeleton lines={8} /></div>}
        {!loading && shown.length === 0 && <p className="py-8 text-center text-sm text-slate-600">No assets match this criticality filter.</p>}
      </Card>
      <Disclaimer />
    </div>
  )
}
