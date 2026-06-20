"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
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
  const { user } = useAuth()

  const hasAccess = allowAdmin
    ? hasAnyRole(user, allowedRoles)
    : hasExplicitRole(user, allowedRoles)
  const redirectTo = getDefaultPathForUser(user)

  useEffect(() => {
    if (!user || hasAccess) {
      return
    }

    router.replace(redirectTo)
  }, [hasAccess, redirectTo, router, user])

  if (!user) {
    return null
  }

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Loader2 className="size-5 animate-spin text-primary" />
    </div>
  )
}
