import { lazy, Suspense } from 'react'
import StatsGrid from '@/features/dashboard/components/StatsGrid'
import LeaveOverview from '@/features/dashboard/components/LeaveOverview'
import DepartmentDistribution from '@/features/dashboard/components/DepartmentDistribution'
import RecentEmployeesTable from '@/features/dashboard/components/RecentEmployeesTable'
import UpcomingEvents from '@/features/dashboard/components/UpcomingEvents'
import HRInsights from '@/features/dashboard/components/HRInsights'
import RecentActivity from '@/features/dashboard/components/RecentActivity'
import PayrollSummary from '@/features/dashboard/components/PayrollSummary'
import { navigateTo } from '@/app/router/navigation'
import { Plus, RotateCw, Search } from 'lucide-react'
import { useAuth } from '@/app/providers/use-auth'
import { ChartCardSkeleton } from '@/components/ui/skeleton'

const AttendanceOverview = lazy(() => import('@/features/dashboard/components/AttendanceOverview'))
const EmployeeGrowth = lazy(() => import('@/features/dashboard/components/EmployeeGrowth'))
const AttendanceBreakdown = lazy(() => import('@/features/dashboard/components/AttendanceBreakdown'))
const MonthlyAttendanceTrends = lazy(() => import('@/features/dashboard/components/MonthlyAttendanceTrends'))
const DepartmentGoalGauge = lazy(() => import('@/features/dashboard/components/DepartmentGoalGauge'))

export default function DashboardPage() {
  const { user } = useAuth()
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  return (
    <div className="dashboard-page">
      <section className="page-hero dashboard-hero">
        <div className="page-hero__copy">
          <span className="page-hero__eyebrow">{todayLabel}</span>
          <h1 className="page-hero__title">Welcome back, {user?.name ?? 'there'}</h1>
          <p className="page-hero__subtitle">Here's your organization at a glance — attendance, leave, payroll and people, all in one place.</p>
        </div>

        <div className="page-hero__actions dashboard-actions">
          <label className="dashboard-search"><Search size={15}/><input placeholder="Search employees..." aria-label="Search employees" onKeyDown={(e) => { if(e.key==='Enter'&&e.currentTarget.value.trim()) navigateTo(`/app/employees?search=${encodeURIComponent(e.currentTarget.value.trim())}`) }}/></label>
          <button className="button header__ghost-button" onClick={() => window.location.reload()}><RotateCw size={14}/> Refresh</button>
          <button className="button header__primary-button" onClick={() => navigateTo('/app/employees/create')}><Plus size={15}/> Add Employee</button>
        </div>
      </section>

      <StatsGrid />

      <div className="dashboard-visual-grid">
        <Suspense fallback={<ChartCardSkeleton label="Loading attendance chart" />}><AttendanceBreakdown /></Suspense>
        <Suspense fallback={<ChartCardSkeleton label="Loading monthly trends" />}><MonthlyAttendanceTrends /></Suspense>
      </div>

      <div className="dashboard-pair dashboard-pair-wide dashboard-secondary-analytics">
        <DepartmentDistribution />
        <Suspense fallback={<ChartCardSkeleton label="Loading weekly view" />}><AttendanceOverview /></Suspense>
      </div>

      <div className="dashboard-pair">
        <LeaveOverview />
        <Suspense fallback={<ChartCardSkeleton label="Loading workforce trend" />}><EmployeeGrowth /></Suspense>
      </div>

      <div className="dashboard-pair dashboard-pair-wide">
        <div style={{ display: 'grid', alignContent: 'start', gap: 14 }}>
          <RecentEmployeesTable />
          <RecentActivity />
          <Suspense fallback={<ChartCardSkeleton label="Loading goal progress" />}><DepartmentGoalGauge /></Suspense>
        </div>
        <div style={{ display: 'grid', alignContent: 'start', gap: 16 }}>
          <UpcomingEvents />
          <PayrollSummary />
          <HRInsights />
        </div>
      </div>
    </div>
  )
}
