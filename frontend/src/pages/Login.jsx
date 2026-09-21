import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@packcheck.ai')
  const [password, setPassword] = useState('Admin@123')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) navigate('/')
  }

  return (
    <div className="min-h-screen flex bg-ink-950">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-14 text-white bg-[radial-gradient(circle_at_20%_20%,#2B3A5E,transparent_60%),radial-gradient(circle_at_80%_80%,#1F2A44,transparent_55%)]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-brass-500 flex items-center justify-center font-display font-bold text-ink-950 text-lg">P</div>
          <span className="font-display text-lg">PackCheck AI</span>
        </div>

        <div className="max-w-md">
          <p className="text-xs font-mono-tag uppercase tracking-wide text-brass-400 mb-3">
            SIH 2026 · PS #26034 · Dept. of Consumer Affairs
          </p>
          <h1 className="font-display text-4xl leading-tight mb-4">
            Scan the label.<br />Know the law.
          </h1>
          <p className="text-white/60 text-sm leading-relaxed">
            Automated compliance screening for packaged commodities under the
            Legal Metrology (Packaged Commodities) Rules, 2011 — mandatory
            declarations, MRP, net quantity, dates and consumer-care details,
            checked in seconds.
          </p>
        </div>

        <p className="text-white/30 text-xs font-mono-tag">TEAM FORGE</p>
      </div>

      <div className="w-full lg:w-[440px] bg-paper flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h2 className="font-display text-2xl text-ink-950 mb-1">Sign in</h2>
          <p className="text-sm text-ink-900/50 mb-8">Enforcement portal access</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-900/70 mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-ink-950/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brass-500/50"
                placeholder="you@department.gov.in"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-900/70 mb-1 block">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-ink-950/10 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brass-500/50"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-alert-600 bg-alert-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink-950 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-ink-900 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-xs text-ink-900/50 bg-white border border-ink-950/10 rounded-lg px-4 py-3 leading-relaxed">
            <p className="font-semibold text-ink-900/70 mb-1">Demo credentials</p>
            Admin: admin@packcheck.ai / Admin@123<br />
            Inspector: inspector@packcheck.ai / Inspect@123
          </div>
        </div>
      </div>
    </div>
  )
}
