"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  departmentConfig,
  getDepartmentStats,
  mockJobs,
  mockUsers,
  statusConfig,
  type Department,
} from "@/lib/data/mock-data"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Wrench,
} from "lucide-react"

interface ScopedDashboardProps {
  departments?: readonly Department[]
}

interface DashboardStatsProps extends ScopedDashboardProps {
  showUsersMetric?: boolean
}

function getScopedJobs(departments?: readonly Department[]) {
  if (!departments) {
    return mockJobs
  }

  return mockJobs.filter((job) => departments.includes(job.department))
}

export function DashboardStats({
  departments,
  showUsersMetric = false,
}: DashboardStatsProps) {
  const jobs = getScopedJobs(departments)
  const totalJobs = jobs.length
  const inProgress = jobs.filter((job) => job.status === "en_progreso").length
  const completed = jobs.filter((job) => job.status === "completado").length
  const highPriority = jobs.filter(
    (job) => job.priority === "alta" || job.priority === "urgente"
  ).length
  const activeUsers = mockUsers.filter((user) => user.status === "activo").length
  const inProgressPercentage = totalJobs > 0 ? (inProgress / totalJobs) * 100 : 0
  const completedPercentage = totalJobs > 0 ? (completed / totalJobs) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Trabajos
          </CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{totalJobs}</div>
          <p className="text-xs text-muted-foreground">Trabajos visibles</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            En Progreso
          </CardTitle>
          <Clock className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{inProgress}</div>
          <Progress value={inProgressPercentage} className="mt-2 h-1" />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Completados
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{completed}</div>
          <Progress value={completedPercentage} className="mt-2 h-1" />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {showUsersMetric ? "Tecnicos Activos" : "Prioridad Alta"}
          </CardTitle>
          {showUsersMetric ? (
            <Users className="h-4 w-4 text-muted-foreground" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-400" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {showUsersMetric ? activeUsers : highPriority}
          </div>
          <p className="text-xs text-muted-foreground">
            {showUsersMetric ? `de ${mockUsers.length} usuarios` : "ordenes visibles"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export function DepartmentCards({ departments }: ScopedDashboardProps) {
  const stats = getDepartmentStats()
  const visibleDepartments = departments ?? (Object.keys(departmentConfig) as Department[])

  if (visibleDepartments.length === 0) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {visibleDepartments.map((dept) => {
        const config = departmentConfig[dept]
        const deptStats = stats[dept]
        const progress =
          deptStats.total > 0
            ? Math.round((deptStats.completados / deptStats.total) * 100)
            : 0

        return (
          <Card
            key={dept}
            className="bg-card border-border hover:border-primary/50 transition-colors"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${config.color}`} />
                  <CardTitle className="text-base font-medium text-foreground">
                    {config.label}
                  </CardTitle>
                </div>
                <span className="text-xl">{config.icon}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">En progreso</span>
                <span className="font-medium text-foreground">{deptStats.enProgreso}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium text-foreground">{deptStats.total}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Completados</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function RecentJobsEmptyState() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Trabajos Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          No hay trabajos visibles para los roles actuales.
        </p>
      </CardContent>
    </Card>
  )
}

export function RecentJobs({ departments }: ScopedDashboardProps) {
  const recentJobs = getScopedJobs(departments)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  if (recentJobs.length === 0) {
    return <RecentJobsEmptyState />
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Trabajos Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`${departmentConfig[job.department].color} flex h-10 w-10 items-center justify-center rounded-lg text-lg`}
                >
                  {departmentConfig[job.department].icon}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {job.vehicle.brand} {job.vehicle.model}
                  </p>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <Badge className={statusConfig[job.status].color}>
                    {statusConfig[job.status].label}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.vehicle.plate}
                  </p>
                </div>
                <div className="w-16">
                  <div className="text-right text-sm font-medium text-foreground">
                    {job.progress}%
                  </div>
                  <Progress value={job.progress} className="mt-1 h-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
