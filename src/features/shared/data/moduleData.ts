export type ModuleRow = { id: string; name: string; department: string; detail: string; date: string; status: string; employeeId?: string; dateKey?: string; checkInAt?: string; checkOutAt?: string; breakMinutes?: number; correctionRequestId?: string; punchLocation?: { latitude: number; longitude: number }; punchPhoto?: string }

export const moduleSeeds: Record<string, ModuleRow[]> = {
  documents: [
    { id: 'DOC-1001', name: 'Employee Handbook', department: 'Company', detail: 'Policy · PDF', date: 'Oct 01, 2026', status: 'Published' },
    { id: 'DOC-1002', name: 'Code of Conduct', department: 'Company', detail: 'Policy · PDF', date: 'Sep 18, 2026', status: 'Published' },
    { id: 'DOC-1003', name: 'Identity Verification', department: 'Employee Records', detail: 'Personal · Restricted', date: 'Sep 12, 2026', status: 'Active' },
  ],
  attendance: [
    { id: 'AT-2401', name: 'Jane Cooper', department: 'Engineering', detail: '09:02 AM — 05:48 PM', date: 'Oct 08, 2026', status: 'Present' },
    { id: 'AT-2402', name: 'John Doe', department: 'Design', detail: '09:18 AM — 06:02 PM', date: 'Oct 08, 2026', status: 'Late' },
    { id: 'AT-2403', name: 'Aisha Khan', department: 'People', detail: 'Paid time off', date: 'Oct 08, 2026', status: 'On Leave' },
    { id: 'AT-2404', name: 'Michael Smith', department: 'Sales', detail: '—', date: 'Oct 08, 2026', status: 'Absent' },
  ],
  leave: [
    { id: 'LV-1024', name: 'Jane Cooper', department: 'Engineering', detail: 'Annual · Family trip', date: 'Oct 10 – Oct 14', status: 'Pending' },
    { id: 'LV-1023', name: 'Aisha Khan', department: 'People', detail: 'Sick · Medical appointment', date: 'Oct 07 – Oct 08', status: 'Approved' },
    { id: 'LV-1022', name: 'Carlos Reyes', department: 'Engineering', detail: 'Casual · Personal', date: 'Oct 03', status: 'Rejected' },
  ],
  shifts: [
    { id: 'SH-01', name: 'General Office', department: '09:00 AM — 06:00 PM', detail: '1 hr break · 5 days/week', date: 'Created Sep 12', status: 'Active' },
    { id: 'SH-02', name: 'Flexible', department: '10:00 AM — 07:00 PM', detail: '1 hr break · 5 days/week', date: 'Created Aug 28', status: 'Active' },
  ],
  departments: [
    { id: 'DP-01', name: 'Engineering', department: 'Priya Sharma', detail: 'San Francisco', date: 'Jan 12, 2024', status: 'Active' },
    { id: 'DP-02', name: 'People & Culture', department: 'Aisha Khan', detail: 'New York', date: 'Feb 04, 2024', status: 'Active' },
    { id: 'DP-03', name: 'Design', department: 'John Doe', detail: 'London', date: 'Mar 19, 2024', status: 'Active' },
    { id: 'DP-04', name: 'Sales', department: 'Unassigned', detail: '—', date: 'Apr 08, 2024', status: 'Active' },
    { id: 'DP-05', name: 'Marketing', department: 'Unassigned', detail: '—', date: 'May 16, 2024', status: 'Active' },
    { id: 'DP-06', name: 'Operations', department: 'Unassigned', detail: '—', date: 'Jun 03, 2024', status: 'Active' },
  ],
  designations: [
    { id: 'DS-01', name: 'Software Engineer', department: 'Engineering', detail: 'Level 3 · 42 employees', date: 'Jan 12, 2024', status: 'Active' },
    { id: 'DS-02', name: 'Product Designer', department: 'Design', detail: 'Level 3 · 14 employees', date: 'Feb 10, 2024', status: 'Active' },
  ],
  payroll: [
    { id: 'PR-1001', name: 'Jane Cooper', department: 'Engineering', detail: '$8,450.00', date: 'Oct 2026', status: 'Processed' },
    { id: 'PR-1002', name: 'John Doe', department: 'Design', detail: '$7,920.00', date: 'Oct 2026', status: 'Processed' },
    { id: 'PR-1003', name: 'Aisha Khan', department: 'People', detail: '$9,120.00', date: 'Oct 2026', status: 'Pending' },
  ],
}

export const payrollTrend = [
  { month: 'May', amount: 218000 },
  { month: 'Jun', amount: 224500 },
  { month: 'Jul', amount: 231200 },
  { month: 'Aug', amount: 236800 },
  { month: 'Sep', amount: 242100 },
  { month: 'Oct', amount: 248650 },
]

export const shiftAssignmentCounts: Record<string, number> = { 'SH-01': 86, 'SH-02': 42 }

export const designationCounts: Record<string, number> = { 'DS-01': 42, 'DS-02': 14 }

export const departmentManagers: Record<string, string> = {
  Engineering: 'Priya Sharma',
  'People & Culture': 'Aisha Khan',
  Design: 'John Doe',
}

export const newDepartmentsThisMonth = 1
