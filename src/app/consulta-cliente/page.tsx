import { ThemeToggle } from "@/components/layout/theme-toggle"
import { ConsultaClienteForm } from "@/features/consulta-cliente/components/consulta-cliente-form"

export const metadata = {
  title: "Consulta de estado del vehículo - AutoTaller Pro",
}

export default function ConsultaClientePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 py-12">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <ConsultaClienteForm />
    </div>
  )
}
