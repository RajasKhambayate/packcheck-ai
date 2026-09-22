import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AppShell from '../components/AppShell.jsx'
import { StatusPill, SeverityTag } from '../components/Common.jsx'
import api from '../api/client'

export default function ReportDetail() {
  const { id } = useParams()
  const [scan, setScan] = useState(null)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(null)

  const loadScan = () => {
    setError(null)
    api.get(`/products/${id}`)
      .then((res) => setScan(res.data))
      .catch(() => setError('Could not load this report. If the site was idle, the server may still be waking up.'))
  }

  useEffect(() => { loadScan() }, [id])

  const download = async (format) => {
    setDownloading(format)
    try {
      const res = await api.get(`/reports/${id}/${format}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `PackCheck_Report_${id}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      setDownloading(null)
    }
  }

  if (error) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-8 py-16 text-center">
          <p className="text-sm text-ink-900/60 mb-4">{error}</p>
          <button onClick={loadScan} className="bg-ink-950 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-ink-900 transition-colors">
            Retry
          </button>
        </div>
      </AppShell>
    )
  }

  if (!scan) {
    return <AppShell><div className="max-w-5xl mx-auto px-8 py-10 text-sm text-ink-900/40">Loading report…</div></AppShell>
  }

  const declFields = [
    ['Manufacturer / Packer / Importer', scan.manufacturer_name],
    ['Manufacturer Address', scan.manufacturer_address],
    ['Net Quantity', scan.net_quantity],
    ['MRP', scan.mrp],
    ['Mfg / Packing / Import Date', scan.mfg_date],
    ['Consumer Care Details', scan.consumer_care],
    ['Country of Origin', scan.country_of_origin],
  ]

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-8 py-8">
        <Link to="/products" className="text-xs text-brass-600 font-semibold hover:underline">← Back to repository</Link>

        <div className="flex items-start justify-between gap-4 mt-3 mb-6">
          <div>
            <p className="text-xs font-mono-tag uppercase tracking-wide text-brass-600 mb-1">Compliance Report</p>
            <h1 className="font-display text-2xl md:text-3xl text-ink-950">{scan.product_name}</h1>
            <p className="text-sm text-ink-900/50 mt-1">
              {scan.category} {scan.brand ? `· ${scan.brand}` : ''} · Scanned {new Date(scan.created_at).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => download('pdf')} disabled={downloading}
                    className="bg-ink-950 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-ink-900 transition-colors disabled:opacity-60">
              {downloading === 'pdf' ? 'Preparing…' : 'Download PDF'}
            </button>
            <button onClick={() => download('docx')} disabled={downloading}
                    className="bg-white border border-ink-950/10 text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-ink-950/5 transition-colors disabled:opacity-60">
              {downloading === 'docx' ? 'Preparing…' : 'Download DOCX'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-5">
            <img src={scan.image_path} alt={scan.product_name} className="w-full rounded-xl border border-ink-950/10 object-contain bg-white" />
            <div className="bg-white rounded-xl shadow-card border border-ink-950/5 p-5 text-center">
              <p className="text-xs font-mono-tag uppercase text-ink-900/50 mb-1">Compliance Score</p>
              <p className="font-display text-5xl text-ink-950">{scan.compliance_score}</p>
              <p className="text-xs text-ink-900/40 mb-3">out of 100</p>
              <StatusPill status={scan.status} />
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl shadow-card border border-ink-950/5 p-5">
              <h3 className="font-display text-lg text-ink-950 mb-4">Extracted declarations</h3>
              <div className="divide-y divide-ink-950/5">
                {declFields.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between py-2.5 gap-4">
                    <span className="text-sm text-ink-900/60">{label}</span>
                    {value ? (
                      <span className="text-sm font-medium text-ink-950 text-right">{value}</span>
                    ) : (
                      <span className="text-xs font-mono-tag text-alert-600 bg-alert-500/10 px-2 py-0.5 rounded">NOT DETECTED</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card border border-ink-950/5 p-5">
              <h3 className="font-display text-lg text-ink-950 mb-4">Violations & flags ({scan.violations.length})</h3>
              {scan.violations.length === 0 ? (
                <p className="text-sm text-leaf-600">✓ No violations detected on this scan.</p>
              ) : (
                <div className="space-y-3">
                  {scan.violations.map((v) => (
                    <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg bg-ink-950/[0.02] border border-ink-950/5">
                      <SeverityTag severity={v.severity} />
                      <div>
                        <p className="text-sm font-medium text-ink-950">{v.rule_description}</p>
                        <p className="text-xs text-ink-900/50 mt-0.5">{v.details} · Rule {v.rule_code}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
