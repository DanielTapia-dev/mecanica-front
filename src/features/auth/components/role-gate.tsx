"use client"

import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { getUserRoleLabel, hasAnyRole } from "@/features/auth/permissions"
import type { RoleCode } from "@/features/auth/types"

interface RoleGateProps {
  allowedRoles: readonly RoleCode[]
  children: React.ReactNode
}

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  if (hasAnyRole(user, allowedRoles)) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <section className="w-full max-w-lg rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Acceso no habilitado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu rol actual es {getUserRoleLabel(user)} y no tiene permiso para esta vista.
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-5" })}>
          Volver al dashboard
        </Link>
      </section>
    </div>
  )
}
