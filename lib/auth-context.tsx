"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AuthUser {
  email: string
  username: string
  name: string
  role: "admin" | "supervisor" | "tecnico"
}

interface LoginResult {
  success: boolean
  message?: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    "username" in value &&
    "name" in value &&
    "role" in value
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as unknown
        if (isAuthUser(parsedUser)) {
          setUser(parsedUser)
        }
      } catch {
        localStorage.removeItem("auth_user")
        localStorage.removeItem("auth_token")
      }
    }
    setIsLoading(false)
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
        token?: string
        user?: AuthUser
      }

      if (!response.ok || !payload.user) {
        return {
          success: false,
          message: payload.message ?? "Correo o contrasena incorrectos.",
        }
      }

      setUser(payload.user)
      localStorage.setItem("auth_user", JSON.stringify(payload.user))

      if (payload.token) {
        localStorage.setItem("auth_token", payload.token)
      } else {
        localStorage.removeItem("auth_token")
      }

      return { success: true }
    } catch {
      return {
        success: false,
        message: "No fue posible conectar con el servicio de login.",
      }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_user")
    localStorage.removeItem("auth_token")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
