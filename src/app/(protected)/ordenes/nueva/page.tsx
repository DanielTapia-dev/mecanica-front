import { RoleGate } from "@/features/auth/components/role-gate"
import { NewWorkOrderForm } from "@/features/work-orders/components/new-work-order-form"

export default function NewWorkOrderPage() {
  return (
    <RoleGate allowedRoles={["RECEPCION"]}>
      <NewWorkOrderForm />
    </RoleGate>
  )
}
