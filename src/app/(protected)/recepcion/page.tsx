import { RoleGate } from "@/features/auth/components/role-gate"
import { ReceptionDashboard } from "@/features/dashboard/components/role-dashboard"

export default function ReceptionPage() {
  return (
    <RoleGate allowedRoles={["RECEPCION"]} allowAdmin={false}>
      <ReceptionDashboard />
    </RoleGate>
  )
}
