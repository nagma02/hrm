import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import { flagUrl, PICKER_COUNTRIES, type DialCountry } from '@/features/auth/utils/dial-codes'

interface CountryDialPickerProps {
  value: DialCountry
  onChange: (country: DialCountry) => void
  disabled?: boolean
}

function Flag({ country }: { country: DialCountry }) {
  return (
    <img
      className="login-country-flag"
      src={flagUrl(country)}
      srcSet={`${flagUrl(country, 80)} 2x`}
      width={22}
      height={16}
      alt=""
      loading="lazy"
    />
  )
}

/** Flag button that opens a country list; selecting one sets the dial code. */
export function CountryDialPicker({ value, onChange, disabled }: CountryDialPickerProps) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        type="button"
        className="login-country-trigger"
        disabled={disabled}
        aria-label={`Country: ${value.name} (+${value.dialCode}). Change country`}
        title={`${value.name} (+${value.dialCode})`}
      >
        <Flag country={value} />
        <ChevronDown size={14} className="login-country-trigger__chevron" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="login-country-menu" align="start" sideOffset={10} collisionPadding={12}>
          {PICKER_COUNTRIES.map((country) => {
            const selected = country.iso === value.iso
            return (
              <DropdownMenu.Item
                key={country.iso}
                className="login-country-option"
                textValue={country.name}
                data-selected={selected ? '' : undefined}
                onSelect={() => onChange(country)}
              >
                <Flag country={country} />
                <span className="login-country-option__name">{country.name}</span>
                <span className="login-country-option__code">+{country.dialCode}</span>
                {selected ? <Check size={14} aria-hidden="true" /> : <span className="login-country-option__spacer" />}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
