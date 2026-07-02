import type { AuthRole, AuthUser } from "./types"

export function isAuthRole(value: unknown): value is AuthRole {
  return (
    typeof value === "object" &&
    value !== null &&
    "codigo" in value &&
    typeof value.codigo === "string" &&
    "nombre" in value &&
    typeof value.nombre === "string"
  )
}

export function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    "username" in value &&
    "name" in value &&
    "roles" in value &&
    Array.isArray(value.roles) &&
    value.roles.every(isAuthRole)
  )
}
