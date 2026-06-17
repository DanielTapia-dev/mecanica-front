import { RoleGate } from "@/features/auth/components/role-gate"
import { DepartmentView } from "@/features/departments/components/department-view"

export default function LavadoPage() {
  return (
    <RoleGate allowedRoles={["DEP_LAVADO_CALIDAD"]}>
      <DepartmentView department="lavado" />
    </RoleGate>
  )
}
