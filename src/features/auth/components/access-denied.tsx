"use client"

import { LogOut, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"

interface AccessDeniedProps {
  description?: string
  title?: string
}

export function AccessDenied({
  description = "Tu usuario no tiene roles habilitados para abrir modulos del sistema. Revisa la asignacion de roles con el administrador.",
  title = "Sin acceso configurado",
}: AccessDeniedProps) {
  const { logout } = useAuth()

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut className="size-4" />
          Cerrar sesion
        </Button>
      </div>
    </div>
  )
}
