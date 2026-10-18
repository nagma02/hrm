import { describe, expect, it } from 'vitest'
import { detectDialCountry, detectDialCountryFromDigits } from './dial-codes'

describe('dial code detection', () => {
  it.each([
    ['+971501234567', 'ae'],
    ['00447911123456', 'gb'],
    ['+12425551234', 'bs'],
    ['+15551234567', 'us'],
    ['+2348012345678', 'ng'],
    ['+9779812345678', 'np'],
  ])('detects %s as %s', (value, iso) => {
    expect(detectDialCountry(value)?.iso).toBe(iso)
  })

  it('defaults numbers without a prefix to India', () => {
    expect(detectDialCountry('9876543210')?.iso).toBe('in')
  })

  it('reads the country code from long numbers typed without +', () => {
    expect(detectDialCountryFromDigits('966570490448')?.iso).toBe('sa')
    expect(detectDialCountryFromDigits('447911123456')?.iso).toBe('gb')
  })

  it('leaves 10-digit and 0-prefixed numbers alone', () => {
    expect(detectDialCountryFromDigits('9876543210')).toBeNull()
    expect(detectDialCountryFromDigits('09876543210')).toBeNull()
  })
})
