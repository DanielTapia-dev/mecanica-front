"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import {
  canAccessUsers,
  getAuthorizedDepartments,
  getDashboardCopy,
  getRoleAccessSummaries,
} from "@/features/auth/permissions"
import { DepartmentCards, DashboardStats, RecentJobs } from "./stats"

export function RoleBasedDashboard() {
  const { user } = useAuth()
  const departments = getAuthorizedDepartments(user)
  const canManageUsers = canAccessUsers(user)
  const dashboardCopy = getDashboardCopy(user)
  const roleAccess = getRoleAccessSummaries(user)
  const showOperationalData = canManageUsers || departments.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{dashboardCopy.title}</h1>
        <p className="text-muted-foreground">{dashboardCopy.description}</p>
      </div>

      {roleAccess.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Accesos habilitados</h2>
            <Badge variant="secondary">{roleAccess.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roleAccess.map((access) => (
              <Card key={access.code} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-foreground">
                    {access.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{access.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {showOperationalData ? (
        <>
          <DashboardStats
            departments={canManageUsers ? undefined : departments}
            showUsersMetric={canManageUsers}
          />

          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">Departamentos</h2>
            <DepartmentCards departments={canManageUsers ? undefined : departments} />
          </section>

          <RecentJobs departments={canManageUsers ? undefined : departments} />
        </>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              No hay trabajos de departamento visibles para los roles actuales.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
