// ── src/components/shared/ErrorBoundary.jsx ──────────────
import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
          <div className="rounded-full bg-red-50 p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={this.handleReset}
            >
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs text-red-600 max-w-lg overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
