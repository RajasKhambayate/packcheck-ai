import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/AppShell.jsx'
import { PageHeader, StatusPill } from '../components/Common.jsx'
import api from '../api/client'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'non_compliant', label: 'Non-Compliant' },
]

export default function ProductHistory() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    api.get('/products', { params: { q: q || undefined, status: status || undefined, limit: 100 } })
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false))
  }, [q, status])

  useEffect(() => {
    const t = setTimeout(fetchData, 300)
    return () => clearTimeout(t)
  }, [fetchData])

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          eyebrow="Repository"
          title="Scanned products & inspection history"
          subtitle="Search and review every product scan, its extracted declarations, and compliance verdict."
        />

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <SearchIcon />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by product name, brand or category…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-ink-950/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brass-500/40"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg border border-ink-950/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brass-500/40"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-ink-950/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-mono-tag uppercase text-ink-900/40 border-b border-ink-950/5">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Scanned</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-ink-950/5">
                    <td colSpan={5} className="px-5 py-4"><div className="h-4 bg-ink-950/5 rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-14 text-center text-ink-900/40 text-sm">
                  No products found. Try a different search or run a new scan.
                </td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="border-b border-ink-950/5 last:border-0 hover:bg-ink-950/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <Link to={`/products/${item.id}`} className="font-medium text-ink-950 hover:text-brass-600">
                      {item.product_name}
                    </Link>
                    {item.brand && <p className="text-xs text-ink-900/40">{item.brand}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-ink-900/70">{item.category}</td>
                  <td className="px-5 py-3.5 font-mono-tag text-ink-900/70">{item.compliance_score}/100</td>
                  <td className="px-5 py-3.5"><StatusPill status={item.status} /></td>
                  <td className="px-5 py-3.5 text-ink-900/50">{new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-900/40">
      <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
