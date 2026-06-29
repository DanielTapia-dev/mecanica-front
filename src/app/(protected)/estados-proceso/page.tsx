import { RoleGate } from "@/features/auth/components/role-gate"
import { EstadosProcesoTable } from "@/features/estados-proceso/components/estados-proceso-table"
import { ModuleHeader } from "@/components/layout/module-header"
import { ListOrdered } from "lucide-react"

export default function EstadosProcesoPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <ModuleHeader
          title="Estados de Proceso"
          description="Administra los estados del flujo de trabajo del taller."
          icon={<ListOrdered className="size-6" />}
          iconClassName="bg-primary text-primary-foreground"
        />

        <EstadosProcesoTable />
      </div>
    </RoleGate>
  )
}
