import { RoleGate } from "@/features/auth/components/role-gate"
import { SucursalesTable } from "@/features/sucursales/components/sucursales-table"
import { ModuleHeader } from "@/components/layout/module-header"
import { MapPin } from "lucide-react"

export default function SucursalesPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <ModuleHeader
          title="Sucursales"
          description="Administra las sucursales registradas por empresa."
          icon={<MapPin className="size-6" />}
          iconClassName="bg-primary text-primary-foreground"
        />

        <SucursalesTable />
      </div>
    </RoleGate>
  )
}
