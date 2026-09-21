import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell.jsx'
import { PageHeader, StatusPill, SeverityTag } from '../components/Common.jsx'
import api from '../api/client'

const CATEGORIES = ['Food', 'Cosmetic', 'Garment', 'Electronics', 'FMCG', 'Pharma', 'Other']
const SOURCES = ['Retail', 'E-commerce', 'Warehouse', 'Manufacturing Unit']

export default function ScanProduct() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    product_name: '', category: 'Food', brand: '', source: 'Retail',
  })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please attach a product/label image to scan.'); return }
    setError(null)
    setSubmitting(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      data.append('image', file)
      const res = await api.post('/scan', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data)
    } catch (e2) {
      setError(e2.response?.data?.detail || 'Scan failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setForm({ product_name: '', category: 'Food', brand: '', source: 'Retail' })
    setFile(null); setPreview(null); setResult(null); setError(null)
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <PageHeader
          eyebrow="Product Scanning"
          title="Scan a product label"
          subtitle="Upload a clear photo of the product's principal display panel. PackCheck AI will extract mandatory declarations and screen them against the Legal Metrology (Packaged Commodities) Rules, 2011."
        />

        {!result ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
                className={`flex flex-col items-center justify-center h-72 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  dragging ? 'border-brass-500 bg-brass-500/5' : 'border-ink-950/15 bg-white'
                }`}
              >
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-contain rounded-xl p-2" />
                ) : (
                  <div className="text-center px-6">
                    <UploadIcon />
                    <p className="text-sm font-medium text-ink-900 mt-3">Drag & drop a label image</p>
                    <p className="text-xs text-ink-900/50 mt-1">or click to browse — JPG, PNG, WEBP up to 15MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </label>
              {preview && (
                <button type="button" onClick={() => fileInputRef.current.click()}
                        className="mt-2 text-xs text-brass-600 font-semibold hover:underline">
                  Replace image
                </button>
              )}
              <label onClick={() => !preview && fileInputRef.current.click()} className="sr-only" />
            </div>

            <div className="bg-white rounded-xl shadow-card border border-ink-950/5 p-6 space-y-4">
              <Field label="Product name">
                <input required value={form.product_name}
                       onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                       placeholder="e.g. Sunrise Refined Sunflower Oil 1L"
                       className="input" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Source">
                  <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="input">
                    {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Brand (optional)">
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                       placeholder="e.g. Sunrise" className="input" />
              </Field>

              {error && <p className="text-sm text-alert-600 bg-alert-500/10 rounded-lg px-3 py-2">{error}</p>}

              <button type="submit" disabled={submitting}
                      className="w-full bg-ink-950 text-white text-sm font-semibold py-3 rounded-lg hover:bg-ink-900 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? (<><Spinner /> Running OCR & compliance checks…</>) : 'Run compliance scan'}
              </button>
              <p className="text-[11px] text-ink-900/40 text-center leading-relaxed">
                Pipeline: Preprocessing → OCR extraction → Declaration parsing →
                Presence / Format / Readability checks → Rule engine verdict
              </p>
            </div>
          </form>
        ) : (
          <ResultView result={result} preview={preview} onNewScan={reset} onOpenReport={() => navigate(`/products/${result.id}`)} />
        )}
      </div>

      <style>{`.input { width:100%; padding:0.6rem 0.85rem; border-radius:0.5rem; border:1px solid rgba(15,21,36,0.1); font-size:0.875rem; background:white; } .input:focus{ outline:none; box-shadow:0 0 0 2px rgba(198,146,42,0.4); }`}</style>
    </AppShell>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-900/70 mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function ResultView({ result, preview, onNewScan, onOpenReport }) {
  const declFields = [
    ['Manufacturer / Packer / Importer', result.manufacturer_name],
    ['Manufacturer Address', result.manufacturer_address],
    ['Net Quantity', result.net_quantity],
    ['MRP', result.mrp],
    ['Mfg / Packing / Import Date', result.mfg_date],
    ['Consumer Care Details', result.consumer_care],
    ['Country of Origin', result.country_of_origin],
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <img src={preview} alt="scanned" className="w-full rounded-xl border border-ink-950/10 object-contain bg-white" />
        <div className="mt-4 bg-white rounded-xl shadow-card border border-ink-950/5 p-5 text-center">
          <p className="text-xs font-mono-tag uppercase text-ink-900/50 mb-1">Compliance Score</p>
          <p className={`font-display text-5xl ${scoreColor(result.compliance_score)}`}>{result.compliance_score}</p>
          <p className="text-xs text-ink-900/40 mb-3">out of 100</p>
          <StatusPill status={result.status} />
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
          <h3 className="font-display text-lg text-ink-950 mb-4">Violations & flags ({result.violations.length})</h3>
          {result.violations.length === 0 ? (
            <p className="text-sm text-leaf-600 flex items-center gap-2">✓ No violations detected on this scan.</p>
          ) : (
            <div className="space-y-3">
              {result.violations.map((v) => (
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

        <div className="flex gap-3">
          <button onClick={onOpenReport} className="bg-ink-950 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-ink-900 transition-colors">
            Open full report
          </button>
          <button onClick={onNewScan} className="bg-white border border-ink-950/10 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-ink-950/5 transition-colors">
            Scan another product
          </button>
        </div>
      </div>
    </div>
  )
}

function scoreColor(score) {
  if (score >= 80) return 'text-leaf-600'
  if (score >= 50) return 'text-amberflag-500'
  return 'text-alert-600'
}

function UploadIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#A87A1F" strokeWidth="1.6" className="mx-auto">
      <path d="M12 16V4m0 0L7 9m5-5l5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function Spinner() {
  return <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
}
