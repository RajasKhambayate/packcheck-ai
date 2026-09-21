import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line,
} from 'recharts'
import AppShell from '../components/AppShell.jsx'
import { PageHeader, StatCard, StatusPill } from '../components/Common.jsx'
import api from '../api/client'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/products', { params: { limit: 6 } }),
    ]).then(([s, p]) => {
      setStats(s.data)
      setRecent(p.data)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          eyebrow="Enforcement Overview"
          title="Compliance Dashboard"
          subtitle="Live monitoring of packaged-commodity scans, violations and inspection activity across your jurisdiction."
          right={
            <Link to="/scan" className="inline-flex items-center gap-2 bg-brass-500 text-ink-950 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-brass-400 transition-colors">
              + New Scan
            </Link>
          }
        />

        {loading ? (
          <SkeletonBlock />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Scans" value={stats.total_scans} />
              <StatCard label="Compliant" value={stats.compliant} accent="leaf" />
              <StatCard label="Non-Compliant" value={stats.non_compliant} accent="alert" />
              <StatCard label="Compliance Rate" value={stats.compliance_rate} suffix="%" accent="brass" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-card border border-ink-950/5 p-5">
                <h3 className="font-display text-lg text-ink-950 mb-4">Scan volume — last 7 days</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={stats.scans_last_7_days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#A87A1F" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-card border border-ink-950/5 p-5">
                <h3 className="font-display text-lg text-ink-950 mb-4">Verdict split</h3>
                <div className="space-y-3">
                  <VerdictBar label="Compliant" value={stats.compliant} total={stats.total_scans} color="bg-leaf-500" />
                  <VerdictBar label="Needs Review" value={stats.needs_review} total={stats.total_scans} color="bg-amberflag-500" />
                  <VerdictBar label="Non-Compliant" value={stats.non_compliant} total={stats.total_scans} color="bg-alert-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <div className="bg-white rounded-xl shadow-card border border-ink-950/5 p-5">
                <h3 className="font-display text-lg text-ink-950 mb-4">Most common violations</h3>
                {stats.top_violations.length === 0 ? (
                  <EmptyNote text="No violations recorded yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.top_violations} layout="vertical" margin={{ left: 10 }}>
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="rule" width={160}
                             tick={{ fontSize: 10 }}
                             tickFormatter={(v) => v.length > 26 ? v.slice(0, 26) + '…' : v} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#C0392B" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-card border border-ink-950/5 p-5">
                <h3 className="font-display text-lg text-ink-950 mb-4">Category breakdown</h3>
                {stats.category_breakdown.length === 0 ? (
                  <EmptyNote text="No scans recorded yet." />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.category_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2B3A5E" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card border border-ink-950/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-ink-950">Recent scans</h3>
                <Link to="/products" className="text-xs font-semibold text-brass-600 hover:underline">View repository →</Link>
              </div>
              {recent.length === 0 ? (
                <EmptyNote text="No products scanned yet. Start with the Scan Product page." />
              ) : (
                <div className="divide-y divide-ink-950/5">
                  {recent.map((r) => (
                    <Link to={`/products/${r.id}`} key={r.id} className="flex items-center justify-between py-3 hover:bg-ink-950/[0.02] -mx-2 px-2 rounded-lg transition-colors">
                      <div>
                        <p className="text-sm font-medium text-ink-950">{r.product_name}</p>
                        <p className="text-xs text-ink-900/50">{r.category} {r.brand ? `· ${r.brand}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono-tag text-ink-900/50">{r.compliance_score}/100</span>
                        <StatusPill status={r.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

function VerdictBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-ink-900/70">{label}</span>
        <span className="font-mono-tag text-ink-900/50">{value} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-ink-950/5 overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EmptyNote({ text }) {
  return <p className="text-sm text-ink-900/40 py-10 text-center">{text}</p>
}

function SkeletonBlock() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-card border border-ink-950/5 h-24 animate-pulse" />
      ))}
    </div>
  )
}
