import { RoleGate } from "@/features/auth/components/role-gate"
import { WorkOrdersList } from "@/components/work-orders/work-orders-list"

export default function WorkOrdersPage() {
  return (
    <RoleGate requireWorkOrdersAccess>
      <WorkOrdersList />
    </RoleGate>
  )
}
