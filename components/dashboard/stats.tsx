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
} from "@/lib/mock-data"
import { Wrench, Users, Clock, CheckCircle2 } from "lucide-react"

export function DashboardStats() {
  const stats = getDepartmentStats()
  const totalJobs = mockJobs.length
  const inProgress = mockJobs.filter((j) => j.status === "en_progreso").length
  const completed = mockJobs.filter((j) => j.status === "completado").length
  const activeUsers = mockUsers.filter((u) => u.status === "activo").length

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
          <p className="text-xs text-muted-foreground">Trabajos activos en el sistema</p>
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
          <Progress value={(inProgress / totalJobs) * 100} className="mt-2 h-1" />
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
          <Progress value={(completed / totalJobs) * 100} className="mt-2 h-1" />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Técnicos Activos
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{activeUsers}</div>
          <p className="text-xs text-muted-foreground">de {mockUsers.length} usuarios</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function DepartmentCards() {
  const stats = getDepartmentStats()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {(Object.keys(departmentConfig) as Department[]).map((dept) => {
        const config = departmentConfig[dept]
        const deptStats = stats[dept]
        const progress = deptStats.total > 0 
          ? Math.round((deptStats.completados / deptStats.total) * 100) 
          : 0

        return (
          <Card key={dept} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
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

export function RecentJobs() {
  const recentJobs = [...mockJobs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

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
                <div className={`h-10 w-10 rounded-lg ${departmentConfig[job.department].color} flex items-center justify-center text-lg`}>
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
