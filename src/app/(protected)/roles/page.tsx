import { RoleGate } from "@/features/auth/components/role-gate"
import { RolesTable } from "@/features/roles/components/roles-table"
import { ModuleHeader } from "@/components/layout/module-header"
import { ShieldCheck } from "lucide-react"

export default function RolesPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <ModuleHeader
          title="Roles"
          description="Administra los roles y tipos de acceso del sistema."
          icon={<ShieldCheck className="size-6" />}
          iconClassName="bg-primary text-primary-foreground"
        />

        <RolesTable />
      </div>
    </RoleGate>
  )
}