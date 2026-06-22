import type { Department } from "@/lib/data/mock-data"
import type { AuthUser, RoleCode } from "./types"

export const roleLabels: Record<RoleCode, string> = {
  ADMIN: "Administrador",
  RECEPCION: "Recepcion",
  REPUESTOS: "Repuestos",
  CLIENTE: "Cliente",
  DEP_ENDEREZADA: "Bahia de enderezada",
  DEP_REPARACION_PINTURA: "Bahia de reparacion y pintura",
  DEP_ENSAMBLAJE: "Bahia de ensamblaje",
  DEP_MECANICA: "Bahia de mecanica",
  DEP_LAVADO_CALIDAD: "Lavado y control de calidad",
}

export const departmentRoleByDepartment: Record<Department, RoleCode> = {
  enderezado: "DEP_ENDEREZADA",
  pintura: "DEP_REPARACION_PINTURA",
  mecanica: "DEP_MECANICA",
  lavado: "DEP_LAVADO_CALIDAD",
}

const departmentByRole: Partial<Record<RoleCode, Department>> = {
  DEP_ENDEREZADA: "enderezado",
  DEP_REPARACION_PINTURA: "pintura",
  DEP_MECANICA: "mecanica",
  DEP_LAVADO_CALIDAD: "lavado",
}

const allDepartments: Department[] = ["enderezado", "pintura", "mecanica", "lavado"]

const defaultPathByRole: Partial<Record<RoleCode, string>> = {
  ADMIN: "/empresas",
  RECEPCION: "/recepcion",
  REPUESTOS: "/ordenes",
  CLIENTE: "/ordenes",
  DEP_ENDEREZADA: "/departamentos/enderezado",
  DEP_REPARACION_PINTURA: "/departamentos/pintura",
  DEP_ENSAMBLAJE: "/ordenes",
  DEP_MECANICA: "/departamentos/mecanica",
  DEP_LAVADO_CALIDAD: "/departamentos/lavado",
}

export interface RoleAccessSummary {
  code: string
  title: string
  description: string
}

const roleAccessSummaries: Record<RoleCode, Omit<RoleAccessSummary, "code">> = {
  ADMIN: {
    title: "Administracion",
    description: "Usuarios, roles, catalogos, ordenes y departamentos.",
  },
  RECEPCION: {
    title: "Recepcion",
    description: "Clientes, vehiculos e ingreso de ordenes de trabajo.",
  },
  REPUESTOS: {
    title: "Repuestos",
    description: "Solicitudes e items de repuestos por orden.",
  },
  CLIENTE: {
    title: "Cliente",
    description: "Consulta del estado visible de sus ordenes.",
  },
  DEP_ENDEREZADA: {
    title: "Enderezada",
    description: "Ordenes ubicadas actualmente en enderezada.",
  },
  DEP_REPARACION_PINTURA: {
    title: "Reparacion y pintura",
    description: "Ordenes ubicadas actualmente en reparacion y pintura.",
  },
  DEP_ENSAMBLAJE: {
    title: "Ensamblaje",
    description: "Ordenes ubicadas actualmente en ensamblaje.",
  },
  DEP_MECANICA: {
    title: "Mecanica",
    description: "Ordenes ubicadas actualmente en mecanica.",
  },
  DEP_LAVADO_CALIDAD: {
    title: "Lavado y calidad",
    description: "Ordenes ubicadas actualmente en lavado y control de calidad.",
  },
}

function normalizeRoleCode(roleCode: string) {
  const normalizedRole = roleCode
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  if (["ADMINISTRADOR", "ADMINISTRACION"].includes(normalizedRole)) {
    return "ADMIN"
  }

  if (["RECEPCION", "RECEPCIONISTA"].includes(normalizedRole)) {
    return "RECEPCION"
  }

  return normalizedRole
}

export function getUserRoleCodes(user: AuthUser | null | undefined) {
  return user?.roles.map((role) => normalizeRoleCode(role.codigo)) ?? []
}

export function getDefaultPathForUser(user: AuthUser | null | undefined) {
  const roleCodes = getUserRoleCodes(user) as RoleCode[]

  for (const roleCode of roleCodes) {
    const path = defaultPathByRole[roleCode]

    if (path) {
      return path
    }
  }

  return "/ordenes"
}

export function hasAnyRole(
  user: AuthUser | null | undefined,
  allowedRoles: readonly string[]
) {
  const roleCodes = getUserRoleCodes(user)

  return (
    roleCodes.includes("ADMIN") ||
    allowedRoles.some((role) => roleCodes.includes(role.toUpperCase()))
  )
}

export function hasExplicitRole(
  user: AuthUser | null | undefined,
  allowedRoles: readonly string[]
) {
  const roleCodes = getUserRoleCodes(user)

  return allowedRoles.some((role) => roleCodes.includes(role.toUpperCase()))
}

export function getRoleLabel(roleCode: string) {
  const normalizedRole = roleCode.toUpperCase() as RoleCode
  return roleLabels[normalizedRole] ?? roleCode
}

export function getUserRoleLabel(user: AuthUser | null | undefined) {
  const roles = user?.roles ?? []

  if (roles.length === 0) {
    return "Sin rol"
  }

  if (roles.length === 1) {
    return roles[0].nombre || getRoleLabel(roles[0].codigo)
  }

  return `${roles[0].nombre || getRoleLabel(roles[0].codigo)} + ${roles.length - 1}`
}

export function getAuthorizedDepartments(user: AuthUser | null | undefined) {
  const roleCodes = getUserRoleCodes(user) as RoleCode[]

  if (roleCodes.includes("ADMIN")) {
    return allDepartments
  }

  const departments = roleCodes
    .map((roleCode) => departmentByRole[roleCode])
    .filter((department): department is Department => Boolean(department))

  return [...new Set(departments)]
}

export function canAccessDepartment(
  user: AuthUser | null | undefined,
  department: Department
) {
  return hasAnyRole(user, [departmentRoleByDepartment[department]])
}

export function canAccessUsers(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["ADMIN"])
}

export function canAccessEmpresas(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["ADMIN"])
}

export function canAccessRoles(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["ADMIN"])
}

export function canAccessSucursales(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["ADMIN"])
}

export function canCreateWorkOrders(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["RECEPCION"])
}

export function canAccessWorkOrders(user: AuthUser | null | undefined) {
  return hasAnyRole(user, [
    "RECEPCION",
    "REPUESTOS",
    "CLIENTE",
    "DEP_ENDEREZADA",
    "DEP_REPARACION_PINTURA",
    "DEP_ENSAMBLAJE",
    "DEP_MECANICA",
    "DEP_LAVADO_CALIDAD",
  ])
}

export function canAccessPath(user: AuthUser | null | undefined, path: string) {
  if (path === "/") {
    return Boolean(user)
  }

  if (path === "/recepcion") {
    return hasExplicitRole(user, ["RECEPCION"])
  }

  if (path === "/usuarios") {
    return canAccessUsers(user)
  }

  if (path === "/empresas") {
    return canAccessEmpresas(user)
  }

  if (path === "/roles") {
    return canAccessRoles(user)
  }

  if (path === "/sucursales") {
    return canAccessSucursales(user)
  }

  if (path === "/ordenes/nueva") {
    return canCreateWorkOrders(user)
  }

  if (path === "/ordenes" || path.startsWith("/ordenes/")) {
    return canAccessWorkOrders(user)
  }

  const departmentPath = path.match(/^\/departamentos\/([^/]+)/)
  if (!departmentPath) {
    return false
  }

  const department = departmentPath[1] as Department

  if (!allDepartments.includes(department)) {
    return false
  }

  return canAccessDepartment(user, department)
}

export function getRoleAccessSummaries(user: AuthUser | null | undefined) {
  const roleCodes = getUserRoleCodes(user) as RoleCode[]
  const summaries: RoleAccessSummary[] = []

  for (const roleCode of roleCodes) {
    const summary = roleAccessSummaries[roleCode]

    if (!summary) {
      continue
    }

    summaries.push({
      code: roleCode,
      ...summary,
    })
  }

  return summaries
}

export function getDashboardCopy(user: AuthUser | null | undefined) {
  if (hasAnyRole(user, ["ADMIN"])) {
    return {
      title: "Dashboard administrativo",
      description: "Resumen general del taller y estado de los trabajos.",
    }
  }

  const departments = getAuthorizedDepartments(user)
  if (departments.length === 1) {
    return {
      title: `Panel de ${getRoleLabel(departmentRoleByDepartment[departments[0]])}`,
      description: "Ordenes y actividad visibles para tu rol operativo.",
    }
  }

  if (departments.length > 1) {
    return {
      title: "Panel operativo",
      description: "Ordenes visibles para tus departamentos asignados.",
    }
  }

  if (hasAnyRole(user, ["RECEPCION"])) {
    return {
      title: "Panel de recepcion",
      description: "Acceso enfocado en clientes, vehiculos e ingreso de ordenes.",
    }
  }

  if (hasAnyRole(user, ["REPUESTOS"])) {
    return {
      title: "Panel de repuestos",
      description: "Acceso enfocado en solicitudes y estado de repuestos.",
    }
  }

  if (hasAnyRole(user, ["CLIENTE"])) {
    return {
      title: "Estado de ordenes",
      description: "Informacion visible para seguimiento de trabajos.",
    }
  }

  return {
    title: "Dashboard",
    description: "No hay modulos habilitados para los roles actuales.",
  }
}
