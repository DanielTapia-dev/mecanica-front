import { normalizeRoleCode } from "./role-normalization"
import type { AuthSessionScope, AuthUser } from "./types"

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
      const id = readString(value, ["id", "uuid", "codigo", "empresa_id", "sucursal_id"])

      if (id) {
        return id
      }
    }
  }

  return undefined
}

export function buildAuthSessionScope(
  user: AuthUser | null | undefined
): AuthSessionScope {
  const userRecord: JsonRecord = isRecord(user) ? user : {}
  const roles = user?.roles ?? []
  const roleCodes = roles.map((role) => normalizeRoleCode(role.codigo))
  const roleIds = roles
    .map((role) => role.id ?? role.rol_id)
    .filter((roleId): roleId is string => Boolean(roleId))

  return {
    user_id: readString(userRecord, [
      "id",
      "usuario_id",
      "usuarioId",
      "user_id",
      "userId",
      "sub",
    ]),
    empresa_id:
      readString(userRecord, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
      readNestedId(userRecord, ["empresa"]),
    sucursal_id:
      readString(userRecord, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
      readNestedId(userRecord, ["sucursal"]),
    empresa_nombre: readString(userRecord, ["empresaNombre", "empresa_nombre"]),
    sucursal_nombre: readString(userRecord, ["sucursalNombre", "sucursal_nombre"]),
    roles,
    role_codes: [...new Set(roleCodes)],
    role_ids: [...new Set(roleIds)],
  }
}
