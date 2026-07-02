"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import { AccessDenied } from "@/features/auth/components/access-denied"
import { getDefaultPathForUser } from "@/features/auth/permissions"

export function RoleRedirect() {
  const router = useRouter()
  const { user } = useAuth()
  const redirectTo = getDefaultPathForUser(user)

  useEffect(() => {
    if (!user || !redirectTo) {
      return
    }

    router.replace(redirectTo)
  }, [redirectTo, router, user])

  if (user && !redirectTo) {
    return <AccessDenied />
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <Loader2 className="size-5 animate-spin text-primary" />
    </div>
  )
}
