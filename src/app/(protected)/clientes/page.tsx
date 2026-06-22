import { RoleGate } from "@/features/auth/components/role-gate"
import { ClientesTable } from "@/features/clientes/components/clientes-table"
import { ModuleHeader } from "@/components/layout/module-header"
import { Contact } from "lucide-react"

export default function ClientesPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <ModuleHeader
          title="Clientes"
          description="Administra los clientes registrados en el sistema."
          icon={<Contact className="size-6" />}
          iconClassName="bg-primary text-primary-foreground"
        />

        <ClientesTable />
      </div>
    </RoleGate>
  )
}
