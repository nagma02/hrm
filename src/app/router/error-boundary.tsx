import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/feedback/error-state'

type Props = {
  children: ReactNode
  /** When this value changes (e.g. the route pathname) a caught error is cleared. */
  resetKey?: string
  title?: string
  message?: string
}
type State = { hasError: boolean; resetKey?: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { hasError: false, resetKey: props.resetKey }
    return null
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Application error boundary caught an error', {
        error,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  private readonly retry = () => this.setState({ hasError: false })

  override render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={this.props.title ?? 'Application error'}
          message={this.props.message ?? 'The application shell failed to render.'}
          onRetry={this.retry}
        />
      )
    }

    return this.props.children
  }
}
