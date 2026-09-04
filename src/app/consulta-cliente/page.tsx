import { ThemeToggle } from "@/components/layout/theme-toggle"
import { ConsultaClienteForm } from "@/features/consulta-cliente/components/consulta-cliente-form"

export const metadata = {
  title: "Consulta de estado del vehículo - AutoTaller Pro",
}

export default function ConsultaClientePage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-green-50 via-background to-background pb-12 dark:from-green-950/20">
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <ConsultaClienteForm />
    </div>
  )
}
