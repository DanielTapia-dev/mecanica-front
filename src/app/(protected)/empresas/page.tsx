import { RoleGate } from "@/features/auth/components/role-gate"
import { EmpresasTable } from "@/features/empresas/components/empresas-table"

export default function EmpresasPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
          <p className="text-muted-foreground">
            Administra las empresas registradas en el sistema
          </p>
        </div>

        <EmpresasTable />
      </div>
    </RoleGate>
  )
}
