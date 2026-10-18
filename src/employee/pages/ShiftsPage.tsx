import { Clock3 } from 'lucide-react'
import { useCurrentEmployee } from '@/features/employees/utils/employee-identity'
import PageContainer from '@/features/shared/PageContainer'
import PageHeader from '@/features/shared/PageHeader'
import { moduleSeeds, type ModuleRow } from '@/features/shared/data/moduleData'
import { AccentCell, EntityCell, StatusDotBadge } from '@/components/tables'
import { useHRMDataChange } from '@/hooks/useHRMDataChange'
import { readStorageValue } from '@/utils/storage'

/** Shift definitions as managed in the admin Shifts module (`department` holds the timing, `detail` the break pattern). */
function findShift(name: string): ModuleRow | undefined {
  const shifts = readStorageValue<ModuleRow[] | null>('hrm-shifts', null) ?? moduleSeeds.shifts ?? []
  return shifts.find((shift) => shift.name === name)
}

export default function ShiftsPage() {
  useHRMDataChange()
  const employee = useCurrentEmployee()
  const shiftName = employee?.shift?.trim() ?? ''
  const shift = shiftName ? findShift(shiftName) : undefined
  const department = employee?.dept || '—'

  return (
    <PageContainer>
      <PageHeader title="My shifts" subtitle="Your assigned schedule and working pattern." />
      <section className="card" style={{ marginTop: 20 }}>
        <div className="table-scroll">
          <table className="hr-table">
            <thead><tr><th>Shift</th><th>Timing</th><th>Department</th><th>Status</th></tr></thead>
            <tbody>
              <tr>
                <td>
                  <EntityCell
                    avatar={<span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#E6F4EA] text-[#1B362B]"><Clock3 size={17} /></span>}
                    title={shiftName || 'No shift assigned'}
                    subtitle={shift?.id ?? (shiftName ? 'Custom schedule' : 'Ask HR to assign a shift')}
                  />
                </td>
                <td><AccentCell title={shift?.department || (shiftName ? 'Timing not set' : '—')} subtitle={shift?.detail} /></td>
                <td>{department}</td>
                <td><StatusDotBadge status={shiftName ? 'Assigned' : 'Unassigned'} variant={shiftName ? 'active' : 'pending'} /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  )
}
