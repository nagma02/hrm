import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToolbarSelectOption {
  label: string
  value: string
}

interface ToolbarSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: ToolbarSelectOption[]
  icon?: React.ReactNode
  ariaLabel: string
  className?: string
}

/** Pill-style toolbar select with a styled popover list (replaces native <select>). */
export function ToolbarSelect({ value, onValueChange, options, icon, ariaLabel, className }: ToolbarSelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger aria-label={ariaLabel} className={cn('toolbar-select', className)}>
        {icon ? <span className="toolbar-select__icon">{icon}</span> : null}
        <span className="toolbar-select__value"><SelectPrimitive.Value /></span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={15} className="toolbar-select__chevron" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content position="popper" sideOffset={6} align="start" className="toolbar-select__content">
          <SelectPrimitive.Viewport className="toolbar-select__viewport">
            {options.map((option) => (
              <SelectPrimitive.Item key={option.value} value={option.value} className="toolbar-select__item">
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="toolbar-select__check">
                  <Check size={14} />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
