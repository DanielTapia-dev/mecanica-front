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
import { getDefaultPathForUser, hasAnyRole } from "./permissions"
import {
  createEmptyUserRoleStatePermissions,
  loadUserRoleStatePermissions,
  readEmbeddedRoleStatePermissions,
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

interface ActiveSucursal {
  id: string
  nombre?: string
}

interface AuthContextType {
  user: AuthUser | null
  sessionScope: AuthSessionScope
  login: (username: string, password: string) => Promise<LoginResult>
  logout: () => void
  isLoading: boolean
  roleStatePermissions: UserRoleStatePermissions
  roleStateAccessError: string | null
  canSwitchSucursal: boolean
  switchSucursal: (sucursalId: string, sucursalNombre?: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getRoleStateAccessError(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No fue posible cargar los modulos habilitados para los roles del usuario."
}

async function resolveRoleStatePermissions(user: AuthUser) {
  const embeddedPermissions = readEmbeddedRoleStatePermissions(user)

  if (embeddedPermissions) {
    return {
      permissions: embeddedPermissions,
      error: null,
    }
  }

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
  const [activeSucursal, setActiveSucursal] = useState<ActiveSucursal | null>(null)
  const baseSessionScope = useMemo(() => buildAuthSessionScope(user), [user])
  const canSwitchSucursal = hasAnyRole(user, ["ADMIN"])
  const sessionScope = useMemo<AuthSessionScope>(() => {
    if (!activeSucursal) {
      return baseSessionScope
    }

    return {
      ...baseSessionScope,
      sucursal_id: activeSucursal.id,
      sucursal_nombre: activeSucursal.nombre ?? baseSessionScope.sucursal_nombre,
    }
  }, [baseSessionScope, activeSucursal])

  const switchSucursal = (sucursalId: string, sucursalNombre?: string) => {
    if (!canSwitchSucursal) {
      return
    }

    setActiveSucursal({ id: sucursalId, nombre: sucursalNombre })
  }

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      clearLegacyAuthStorage()

      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "include",
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
            setActiveSucursal(null)
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
      setActiveSucursal(null)
      clearLegacyAuthStorage()
      void fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
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

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const payload = (await response.json()) as {
        message?: string
        user?: AuthUser
      }

      if (!response.ok || !payload.user) {
        return {
          success: false,
          message: payload.message ?? "Usuario o contrasena incorrectos.",
        }
      }

      const roleStateAccess = await resolveRoleStatePermissions(payload.user)

      resetUnauthorizedSessionNotification()
      setRoleStatePermissions(roleStateAccess.permissions)
      setRoleStateAccessError(roleStateAccess.error)
      setActiveSucursal(null)
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
    setActiveSucursal(null)
    clearLegacyAuthStorage()
    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
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
        canSwitchSucursal,
        switchSucursal,
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
