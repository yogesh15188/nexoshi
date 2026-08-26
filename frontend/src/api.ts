const BASE = '/api/v1'

async function req(path: string, opts?: RequestInit) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

export const api = {
  getMetrics: () => req('/metrics'),
  resetDemo: () => req('/demo/reset', { method: 'POST' }),
  getAssets: () => req('/assets'),
  addAsset: (a: any) => req('/assets', { method: 'POST', body: JSON.stringify(a) }),
  getVulns: () => req('/vulnerabilities'),
  getThreats: () => req('/threats'),
  getAttackGraph: () => req('/attack-graph'),
  getChokePoints: () => req('/attack-graph/choke-points'),
  getCurrentRisk: () => req('/risk/current'),
  calculateRisk: () => req('/risk/calculate', { method: 'POST' }),
  recalculateRisk: (boost = 0.25) =>
    req('/risk/recalculate', { method: 'POST', body: JSON.stringify({ evidence_confidence_boost: boost }) }),
  getRiskHistory: () => req('/risk/history'),
  getDeceptions: (status?: string) => req(`/deception/assets${status ? `?status=${status}` : ''}`),
  deployAllDecoys: () => req('/deception/deploy-all', { method: 'POST' }),
  simulateRandomEvent: (id: number) =>
    req('/deception/simulate-random', { method: 'POST', body: JSON.stringify({ deception_asset_id: id }) }),
  getEvents: (limit = 15) => req(`/deception/events?limit=${limit}`),
  getDeceptionSummary: () => req('/deception/summary'),
  correlateEvidence: () => req('/evidence/correlate'),
  getControls: () => req('/controls'),
  optimizeInvestment: (budget: number) =>
    req('/investment/optimize', { method: 'POST', body: JSON.stringify({ budget }) }),
  getRecommendations: () => req('/investment/recommendations'),
  runVerification: () => req('/verification/run', { method: 'POST' }),
}

export const fmtRupee = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

export const fmtCompact = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n}`
}
