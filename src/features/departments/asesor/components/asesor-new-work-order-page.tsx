import { ClipboardPlus } from "lucide-react"
import { ModuleHeader } from "@/components/layout/module-header"
import { AsesorNewWorkOrderForm } from "./asesor-new-work-order-form"

export function AsesorNewWorkOrderPage() {
  return (
    <section className="space-y-6">
      <ModuleHeader
        title="Nueva orden"
        description="Completa los datos requeridos del cliente, vehiculo y aseguradora para crear la orden."
        icon={<ClipboardPlus className="size-6" />}
        iconClassName="bg-primary text-primary-foreground"
      />
      <AsesorNewWorkOrderForm />
    </section>
  )
}
