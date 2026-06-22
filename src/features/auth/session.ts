import type { AuthUser } from "./types"

export const AUTH_TOKEN_KEY = "auth_token"
export const AUTH_USER_KEY = "auth_user"

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return undefined
}

function readNestedId(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]

    if (isRecord(value)) {
      const id = readString(value, ["id", "uuid", "codigo"])

      if (id) {
        return id
      }
    }
  }

  return undefined
}

function readTokenPayload(token?: string) {
  if (!token) {
    return undefined
  }

  const [, payload] = token.split(".")

  if (!payload) {
    return undefined
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "="
    )
    const decodedPayload = atob(paddedPayload)
    const parsedPayload = JSON.parse(decodedPayload) as unknown

    return isRecord(parsedPayload) ? parsedPayload : undefined
  } catch {
    return undefined
  }
}

export function getAuthToken(): string | undefined {
  if (typeof window === "undefined") {
    return undefined
  }

  return localStorage.getItem(AUTH_TOKEN_KEY) ?? undefined
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null
  }

  const storedUser = localStorage.getItem(AUTH_USER_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    return null
  }
}

/**
 * Empresa/sucursal del usuario autenticado, leyendo primero el usuario
 * guardado en localStorage y usando el JWT como respaldo (algunos backends
 * solo incluyen estos campos en el payload del token).
 */
export function getSessionScope() {
  const token = getAuthToken()
  const userRecord = (getStoredUser() as unknown as JsonRecord | null) ?? {}
  const tokenPayload = readTokenPayload(token) ?? {}

  const empresaId =
    readString(userRecord, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readString(tokenPayload, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readNestedId(userRecord, ["empresa"]) ??
    readNestedId(tokenPayload, ["empresa"])
  const sucursalId =
    readString(userRecord, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readString(tokenPayload, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readNestedId(userRecord, ["sucursal"]) ??
    readNestedId(tokenPayload, ["sucursal"])

  return { empresa_id: empresaId, sucursal_id: sucursalId }
}

export function getEmpresaId(): string | undefined {
  return getSessionScope().empresa_id
}

export function getSucursalId(): string | undefined {
  return getSessionScope().sucursal_id
}