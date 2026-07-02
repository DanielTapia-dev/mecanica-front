import { RoleGate } from "@/features/auth/components/role-gate"
import { WorkOrdersList } from "@/components/work-orders/work-orders-list"

export default function WorkOrdersPage() {
  return (
    <RoleGate
      allowedRoles={[
        "ASESOR",
        "RECEPCION",
        "REPUESTOS",
        "CLIENTE",
        "DEP_ENDEREZADA",
        "DEP_REPARACION_PINTURA",
        "DEP_ENSAMBLAJE",
        "DEP_MECANICA",
        "DEP_LAVADO_CALIDAD",
      ]}
    >
      <WorkOrdersList />
    </RoleGate>
  )
}
