import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ShiftSchedule from './ShiftSchedule'

describe('ShiftSchedule', () => {
  it('renders safely when a shift has no valid time range', () => {
    expect(() =>
      render(
        <ShiftSchedule
          rows={[
            {
              id: 'SH-99',
              name: 'Late shift',
              department: undefined as unknown as string,
              detail: 'Not configured',
              date: 'N/A',
              status: 'Active',
            },
          ]}
        />,
      ),
    ).not.toThrow()

    expect(screen.getByText('Late shift')).toBeInTheDocument()
    expect(screen.getByText('Schedule details needed')).toBeInTheDocument()
  })
})
