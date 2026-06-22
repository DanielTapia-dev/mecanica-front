import { RoleGate } from "@/features/auth/components/role-gate"
import { VehiculosTable } from "@/features/vehiculos/components/vehiculos-table"
import { ModuleHeader } from "@/components/layout/module-header"
import { Car } from "lucide-react"

export default function VehiculosPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <ModuleHeader
          title="Vehículos"
          description="Administra los vehículos registrados por cliente."
          icon={<Car className="size-6" />}
          iconClassName="bg-primary text-primary-foreground"
        />

        <VehiculosTable />
      </div>
    </RoleGate>
  )
}
