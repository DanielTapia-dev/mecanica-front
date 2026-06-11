import { DashboardStats, DepartmentCards, RecentJobs } from "@/components/dashboard/stats"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del taller y estado de los trabajos
        </p>
      </div>

      <DashboardStats />

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Departamentos</h2>
        <DepartmentCards />
      </div>

      <RecentJobs />
    </div>
  )
}
