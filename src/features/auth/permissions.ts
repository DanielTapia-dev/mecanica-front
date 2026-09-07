import type { Department } from "@/lib/data/mock-data"
import { normalizeRoleCode } from "./role-normalization"
import type { AuthUser, RoleCode } from "./types"

export const roleLabels: Record<RoleCode, string> = {
  ADMIN: "Administrador",
  ASESOR: "Asesor",
  JEFE_TALLER: "Jefe de taller",
  RECEPCION: "Recepcion",
  REPUESTOS: "Repuestos",
  CONTROL_CALIDAD: "Control de calidad",
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
  ASESOR: {
    title: "Asesor",
    description: "Seguimiento operativo de ordenes segun estados asignados.",
  },
  JEFE_TALLER: {
    title: "Jefe de taller",
    description: "Revision y direccion de ordenes hacia repuestos o bahias.",
  },
  RECEPCION: {
    title: "Recepcion",
    description: "Clientes, vehiculos e ingreso de ordenes de trabajo.",
  },
  REPUESTOS: {
    title: "Repuestos",
    description: "Solicitudes e items de repuestos por orden.",
  },
  CONTROL_CALIDAD: {
    title: "Control de calidad",
    description: "Revision final y envio del vehiculo al proceso de entrega.",
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

export function getUserRoleCodes(user: AuthUser | null | undefined) {
  return user?.roles.map((role) => normalizeRoleCode(role.codigo)) ?? []
}

export function getUserRoleIds(user: AuthUser | null | undefined) {
  const roleIds = user?.roles
    .map((role) => role.id ?? role.rol_id)
    .filter((roleId): roleId is string => Boolean(roleId)) ?? []

  return [...new Set(roleIds)]
}

export function getDefaultPathForUser(
  user: AuthUser | null | undefined,
  hasWorkOrdersAccess = false
) {
  const roleCodes = getUserRoleCodes(user)

  if (roleCodes.includes("ADMIN")) {
    return "/empresas"
  }

  if (roleCodes.includes("RECEPCION")) {
    return "/recepcion"
  }

  if (hasWorkOrdersAccess) {
    return "/ordenes"
  }

  return null
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

export function canAccessEstadosProceso(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["ADMIN"])
}

export function canAccessSucursales(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["ADMIN"])
}

export function canAccessVehiculos(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["ADMIN"])
}

export function canAccessConsultaCliente(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["ADMIN"])
}

export function canAccessEncuestas(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["ADMIN", "ASESOR"])
}

export function canCreateWorkOrders(user: AuthUser | null | undefined) {
  return hasAnyRole(user, ["RECEPCION"])
}

export function canAccessAsesor(user: AuthUser | null | undefined) {
  return hasExplicitRole(user, ["ASESOR"])
}

export function canAccessWorkOrders(
  user: AuthUser | null | undefined,
  hasWorkOrdersAccess = false
) {
  return Boolean(user) && hasWorkOrdersAccess
}

export function canAccessPath(
  user: AuthUser | null | undefined,
  path: string,
  hasWorkOrdersAccess = false
) {
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

  if (path === "/estados-proceso") {
    return canAccessEstadosProceso(user)
  }

  if (path === "/sucursales") {
    return canAccessSucursales(user)
  }

  if (path === "/vehiculos") {
    return canAccessVehiculos(user)
  }

  if (path === "/consulta-cliente") {
    return canAccessConsultaCliente(user)
  }

  if (path === "/encuestas") {
    return canAccessEncuestas(user)
  }

  if (path === "/ordenes/nueva") {
    return canCreateWorkOrders(user)
  }

  if (path === "/ordenes" || path.startsWith("/ordenes/")) {
    return canAccessWorkOrders(user, hasWorkOrdersAccess)
  }

  if (path === "/departamentos/asesor" || path.startsWith("/departamentos/asesor/")) {
    return canAccessAsesor(user)
  }

  return false
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

  if (hasAnyRole(user, ["ASESOR"])) {
    return {
      title: "Panel de asesor",
      description: "Acceso enfocado en ordenes habilitadas por estado.",
    }
  }

  if (hasAnyRole(user, ["JEFE_TALLER"])) {
    return {
      title: "Panel de jefe de taller",
      description: "Ordenes pendientes de revision y direccion tecnica.",
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
