import { RoleGate } from "@/features/auth/components/role-gate"
import { AsesorNewWorkOrderPage } from "@/features/departments/asesor/components/asesor-new-work-order-page"

export default function AsesorNewWorkOrderRoute() {
  return (
    <RoleGate allowedRoles={["ASESOR"]} allowAdmin={false}>
      <AsesorNewWorkOrderPage />
    </RoleGate>
  )
}
