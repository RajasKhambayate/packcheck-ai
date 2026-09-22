import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('PackCheck AI crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-paper px-6">
          <div className="max-w-sm text-center">
            <p className="font-display text-2xl text-ink-950 mb-2">Something went wrong</p>
            <p className="text-sm text-ink-900/60 mb-6">
              This can happen if the server was briefly waking up. Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-ink-950 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-ink-900 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
