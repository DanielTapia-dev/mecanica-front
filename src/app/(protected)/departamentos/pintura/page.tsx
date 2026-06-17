import { RoleGate } from "@/features/auth/components/role-gate"
import { DepartmentView } from "@/features/departments/components/department-view"

export default function PinturaPage() {
  return (
    <RoleGate allowedRoles={["DEP_REPARACION_PINTURA"]}>
      <DepartmentView department="pintura" />
    </RoleGate>
  )
}
