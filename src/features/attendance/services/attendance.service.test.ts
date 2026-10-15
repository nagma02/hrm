import { beforeEach, describe, expect, it } from 'vitest'
import { employeeStore } from '@/features/employees/data/employeeStore'
import { listAttendanceRows, recordEmployeeClockIn } from './attendance.service'

describe('attendanceService shared records', () => {
  beforeEach(() => localStorage.setItem('hrm-attendance', '[]'))

  it('writes a single clock-in record consumed by admin and employee attendance views', () => {
    const employee = employeeStore.getById('E-1001')!
    const time = new Date(2026, 9, 10, 9, 0).getTime()
    recordEmployeeClockIn(employee, time)
    recordEmployeeClockIn(employee, time + 60_000)

    const sharedRows = listAttendanceRows()
    expect(sharedRows).toHaveLength(1)
    expect(sharedRows[0]).toMatchObject({ employeeId: employee.id, dateKey: '2026-10-10' })
    expect(sharedRows[0].checkInAt).toBe(new Date(time).toISOString())
  })
})
