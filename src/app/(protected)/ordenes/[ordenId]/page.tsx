import { RoleGate } from "@/features/auth/components/role-gate"
import { WorkOrderDetailSummary } from "@/features/work-orders/components/work-order-detail-summary"

interface WorkOrderDetailPageProps {
  params: Promise<{
    ordenId: string
  }>
}

export default async function WorkOrderDetailPage({ params }: WorkOrderDetailPageProps) {
  const { ordenId } = await params

  return (
    <RoleGate requireWorkOrdersAccess>
      <WorkOrderDetailSummary orderId={ordenId} />
    </RoleGate>
  )
}
