import { RoleGate } from "@/features/auth/components/role-gate"
import { DepartmentView } from "@/features/departments/components/department-view"

export default function EnderezadoPage() {
  return (
    <RoleGate allowedRoles={["DEP_ENDEREZADA"]}>
      <DepartmentView department="enderezado" />
    </RoleGate>
  )
}
