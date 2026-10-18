import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './error-boundary'

let shouldThrow = true
function Flaky() {
  if (shouldThrow) throw new Error('boom')
  return <p>Page content</p>
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    cleanup()
    shouldThrow = true
    vi.restoreAllMocks()
  })

  it('keeps a crashed page contained and recovers on retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<ErrorBoundary title="This page couldn't load"><Flaky /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toHaveTextContent("This page couldn't load")

    shouldThrow = false
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }))
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })

  it('clears the error when the reset key (route) changes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender } = render(<ErrorBoundary resetKey="/app/a"><Flaky /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    shouldThrow = false
    rerender(<ErrorBoundary resetKey="/app/b"><Flaky /></ErrorBoundary>)
    expect(screen.getByText('Page content')).toBeInTheDocument()
  })
})
