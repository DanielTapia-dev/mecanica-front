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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
            resetUnauthorizedSessionNotification()
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

      resetUnauthorizedSessionNotification()
      setUser(payload.user)
      clearLegacyAuthStorage()

      return {
        success: true,
        redirectTo: getDefaultPathForUser(payload.user) ?? undefined,
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
    clearLegacyAuthStorage()
    void fetch("/api/auth/logout", {
      method: "POST",
    })
  }

  return (
    <AuthContext.Provider value={{ user, sessionScope, login, logout, isLoading }}>
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
