"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import { AccessDenied } from "@/features/auth/components/access-denied"
import {
  getDefaultPathForUser,
  hasAnyRole,
  hasExplicitRole,
} from "@/features/auth/permissions"
import type { RoleCode } from "@/features/auth/types"

interface RoleGateProps {
  allowedRoles: readonly RoleCode[]
  allowAdmin?: boolean
  children: React.ReactNode
}

export function RoleGate({
  allowedRoles,
  allowAdmin = true,
  children,
}: RoleGateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const hasAccess = allowAdmin
    ? hasAnyRole(user, allowedRoles)
    : hasExplicitRole(user, allowedRoles)
  const redirectTo = getDefaultPathForUser(user)

  useEffect(() => {
    if (!user || hasAccess || !redirectTo || redirectTo === pathname) {
      return
    }

    router.replace(redirectTo)
  }, [hasAccess, pathname, redirectTo, router, user])

  if (!user) {
    return null
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (!redirectTo || redirectTo === pathname) {
    return (
      <AccessDenied description="Tu usuario inicio sesion correctamente, pero el rol asignado no tiene una ruta inicial valida para esta pantalla." />
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Loader2 className="size-5 animate-spin text-primary" />
    </div>
  )
}
