import React from 'react'
import { navigateTo } from '@/app/router/navigation'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function RecentEmployeesTable() {
  const recentEmployees = useEmployees()
    .slice()
    .sort((first, second) => Date.parse(second.createdAt ?? second.joinDate) - Date.parse(first.createdAt ?? first.joinDate))
    .slice(0, 5)

  return (
    <div className="card recent-employees-card h-auto min-h-0 p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs">
      <div className="flex justify-between items-center mb-3">
        <div>
          <Badge variant="info" className="mb-1">People</Badge>
          <h3 className="section-title text-base font-semibold">Recent Employees</h3>
        </div>
        <div className="text-sm text-muted-foreground">Latest hires</div>
      </div>

      <div className="dashboard-table-scroll w-full overflow-x-auto">
        <Table className="table min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentEmployees.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <button
                    className="recent-employee-link flex items-center gap-3 text-left w-full cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => navigateTo(`/app/employees/${r.id}`)}
                    aria-label={`View ${r.firstName} ${r.lastName}`}
                  >
                    <Avatar className="h-9 w-9 rounded-full border border-[#CFEBD7]">
                      <AvatarFallback className="rounded-full bg-[#E6F4EA] text-[#1B362B] text-xs font-bold">
                        {r.firstName[0]}{r.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{r.firstName} {r.lastName}</div>
                      <div className="text-xs text-muted-foreground">{r.title}</div>
                    </div>
                  </button>
                </TableCell>
                <TableCell className="text-sm">{r.id}</TableCell>
                <TableCell className="text-sm">{r.dept}</TableCell>
                <TableCell className="text-sm">{r.title}</TableCell>
                <TableCell className="text-sm">{r.joinDate}</TableCell>
                <TableCell>
                  <Badge variant={r.status === 'Active' ? 'success' : 'warning'}>
                    {r.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
