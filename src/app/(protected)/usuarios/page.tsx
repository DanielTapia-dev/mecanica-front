import { RoleGate } from "@/features/auth/components/role-gate"
import { UsersTable } from "@/features/users/components/users-table"
import { ModuleHeader } from "@/components/layout/module-header"
import { Users } from "lucide-react"

export default function UsersPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <ModuleHeader
          title="Usuarios"
          description="Administra los usuarios y tecnicos del taller."
          icon={<Users className="size-6" />}
          iconClassName="bg-primary text-primary-foreground"
        />

        <UsersTable />
      </div>
    </RoleGate>
  )
}
