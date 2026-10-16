export const leaveBalanceTypes = [
  { key: 'casual', label: 'Casual leave used', used: 4, total: 12, color: 'var(--chart-present)' },
  { key: 'sick', label: 'Sick leave remaining', used: 8, total: 10, color: 'var(--chart-leave)' },
  { key: 'paid', label: 'Paid leave available', used: 15, total: 20, color: 'var(--chart-late)' },
] as const
