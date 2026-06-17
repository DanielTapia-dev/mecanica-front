import { RoleGate } from "@/features/auth/components/role-gate"
import { DepartmentView } from "@/features/departments/components/department-view"

export default function MecanicaPage() {
  return (
    <RoleGate allowedRoles={["DEP_MECANICA"]}>
      <DepartmentView department="mecanica" />
    </RoleGate>
  )
}
