import { RoleGate } from "@/features/auth/components/role-gate"
import { UsersTable } from "@/features/users/components/users-table"

export default function UsersPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios y tecnicos del taller
          </p>
        </div>

        <UsersTable />
      </div>
    </RoleGate>
  )
}
