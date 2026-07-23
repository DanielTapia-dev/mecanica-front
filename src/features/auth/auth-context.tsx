"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { isAuthUser } from "./auth-validation"
import { getDefaultPathForUser } from "./permissions"
import {
  createEmptyUserRoleStatePermissions,
  loadUserRoleStatePermissions,
  type UserRoleStatePermissions,
} from "./role-state-permissions"
import { buildAuthSessionScope } from "./session-scope"
import type { AuthSessionScope, AuthUser } from "./types"
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearLegacyAuthStorage,
  resetUnauthorizedSessionNotification,
} from "./unauthorized-session"

interface LoginResult {
  success: boolean
  message?: string
  redirectTo?: string
}

interface AuthContextType {
  user: AuthUser | null
  sessionScope: AuthSessionScope
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  isLoading: boolean
  roleStatePermissions: UserRoleStatePermissions
  roleStateAccessError: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getRoleStateAccessError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No fue posible cargar los modulos habilitados para los roles del usuario."
}

async function resolveRoleStatePermissions(user: AuthUser) {
  try {
    return {
      permissions: await loadUserRoleStatePermissions(user),
      error: null,
    }
  } catch (error) {
    return {
      permissions: createEmptyUserRoleStatePermissions(),
      error: getRoleStateAccessError(error),
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [roleStatePermissions, setRoleStatePermissions] =
    useState<UserRoleStatePermissions>(() =>
      createEmptyUserRoleStatePermissions()
    )
  const [roleStateAccessError, setRoleStateAccessError] = useState<string | null>(
    null
  )
  const sessionScope = useMemo(() => buildAuthSessionScope(user), [user])

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      clearLegacyAuthStorage()

      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        })

        if (!isMounted) {
          return
        }

        if (response.ok) {
          const payload = (await response.json()) as { user?: unknown }

          if (isAuthUser(payload.user)) {
            const roleStateAccess = await resolveRoleStatePermissions(payload.user)

            if (!isMounted) {
              return
            }

            resetUnauthorizedSessionNotification()
            setRoleStatePermissions(roleStateAccess.permissions)
            setRoleStateAccessError(roleStateAccess.error)
            setUser(payload.user)
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSession()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    function handleUnauthorizedSession() {
      setUser(null)
      setRoleStatePermissions(createEmptyUserRoleStatePermissions())
      setRoleStateAccessError(null)
      clearLegacyAuthStorage()
      void fetch("/api/auth/logout", {
        method: "POST",
      }).finally(() => {
        if (window.location.pathname !== "/") {
          window.location.assign("/")
        }
      })
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorizedSession)

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorizedSession)
    }
  }, [])

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const payload = (await response.json()) as {
        message?: string
        user?: AuthUser
      }

      if (!response.ok || !payload.user) {
        return {
          success: false,
          message: payload.message ?? "Correo o contrasena incorrectos.",
        }
      }

      const roleStateAccess = await resolveRoleStatePermissions(payload.user)

      resetUnauthorizedSessionNotification()
      setRoleStatePermissions(roleStateAccess.permissions)
      setRoleStateAccessError(roleStateAccess.error)
      setUser(payload.user)
      clearLegacyAuthStorage()

      return {
        success: true,
        redirectTo:
          getDefaultPathForUser(
            payload.user,
            roleStateAccess.permissions.hasWorkOrdersAccess
          ) ?? undefined,
      }
    } catch {
      return {
        success: false,
        message: "No fue posible conectar con el servicio de login.",
      }
    }
  }

  const logout = () => {
    setUser(null)
    setRoleStatePermissions(createEmptyUserRoleStatePermissions())
    setRoleStateAccessError(null)
    clearLegacyAuthStorage()
    void fetch("/api/auth/logout", {
      method: "POST",
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionScope,
        login,
        logout,
        isLoading,
        roleStatePermissions,
        roleStateAccessError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
