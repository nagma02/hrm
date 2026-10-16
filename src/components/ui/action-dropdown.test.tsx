import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ActionDropdown } from './action-dropdown'

describe('ActionDropdown', () => {
  it('opens the menu and calls the selected action', async () => {
    const user = userEvent.setup()
    const onView = vi.fn()

    render(
      <ActionDropdown
        actions={[
          { label: 'View details', onClick: onView },
          { label: 'Delete', onClick: vi.fn(), destructive: true },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /more actions/i }))
    await user.click(screen.getByRole('menuitem', { name: /view details/i }))

    expect(onView).toHaveBeenCalledTimes(1)
  })
})
