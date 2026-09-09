import type { ReactNode } from "react"
import { ThemeProvider } from "@/lib/theme/theme-context"

export default function ConsultaClienteLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" storageKey="consulta_cliente_theme">
      {children}
    </ThemeProvider>
  )
}
