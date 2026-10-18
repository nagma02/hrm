import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { StatusDotBadge } from './StatusDotBadge'

describe('StatusDotBadge', () => {
  afterEach(cleanup)

  it.each([
    ['Active', 'approved'],
    ['Approved', 'approved'],
    ['Paid', 'approved'],
    ['Inactive', 'rejected'],
    ['Rejected', 'rejected'],
    ['Not approved', 'rejected'],
    ['Pending Approval', 'pending'],
    ['Unpaid', 'pending'],
    ['Simulated', 'info'],
    ['Late', 'pending'],
  ])('maps "%s" to the %s tone', (status, variant) => {
    render(<StatusDotBadge status={status} />)
    expect(screen.getByText(status)).toHaveClass(`status-dot-badge--${variant}`)
  })
})
