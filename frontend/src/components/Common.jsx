import React from 'react'

const STATUS_STYLES = {
  compliant: 'bg-leaf-500/10 text-leaf-600',
  non_compliant: 'bg-alert-500/10 text-alert-600',
  needs_review: 'bg-amberflag-500/10 text-amberflag-500',
}
const STATUS_LABELS = {
  compliant: 'Compliant',
  non_compliant: 'Non-Compliant',
  needs_review: 'Needs Review',
}
const STATUS_DOT = {
  compliant: 'bg-leaf-500',
  non_compliant: 'bg-alert-500',
  needs_review: 'bg-amberflag-500',
}

export function StatusPill({ status }) {
  return (
    <span className={`status-pill ${STATUS_STYLES[status] || 'bg-ink-100 text-ink-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status] || 'bg-ink-500'}`} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function SeverityTag({ severity }) {
  const styles = {
    critical: 'bg-alert-500 text-white',
    major: 'bg-brass-500 text-ink-950',
    minor: 'bg-ink-700/10 text-ink-700',
  }
  return (
    <span className={`text-[10px] font-mono-tag font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${styles[severity] || ''}`}>
      {severity}
    </span>
  )
}

export function StatCard({ label, value, accent = 'ink', suffix = '' }) {
  const accentClasses = {
    ink: 'text-ink-900',
    leaf: 'text-leaf-600',
    alert: 'text-alert-600',
    amber: 'text-amberflag-500',
    brass: 'text-brass-600',
  }
  return (
    <div className="bg-white rounded-xl shadow-card px-5 py-4 border border-ink-950/5">
      <p className="text-xs font-mono-tag uppercase tracking-wide text-ink-900/50">{label}</p>
      <p className={`font-display text-3xl mt-1.5 ${accentClasses[accent]}`}>{value}{suffix}</p>
    </div>
  )
}

export function PageHeader({ eyebrow, title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="text-xs font-mono-tag uppercase tracking-wide text-brass-600 mb-1">{eyebrow}</p>}
        <h1 className="font-display text-2xl md:text-3xl text-ink-950">{title}</h1>
        {subtitle && <p className="text-sm text-ink-900/60 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
