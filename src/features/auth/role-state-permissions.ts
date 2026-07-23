import {
  getUserRoleCodes,
  getUserRoleIds,
} from "@/features/auth/permissions"
import { normalizeRoleCode } from "@/features/auth/role-normalization"
import type { AuthUser } from "@/features/auth/types"
import { rolEstadosService } from "@/features/rol-estados/services/rol-estados-service"
import { rolesService } from "@/features/roles/services/roles-service"
import type { RolEstado } from "@/features/rol-estados/types"

export interface UserRoleStatePermissions {
  allowedProcessStateIds: Set<string>
  hasWorkOrdersAccess: boolean
}

export function createEmptyUserRoleStatePermissions(): UserRoleStatePermissions {
  return {
    allowedProcessStateIds: new Set(),
    hasWorkOrdersAccess: false,
  }
}

export async function loadUserRoleStatePermissions(
  user: AuthUser,
  token?: string
): Promise<UserRoleStatePermissions> {
  let roleIds = getUserRoleIds(user)
  const userRoleCodes = new Set(getUserRoleCodes(user))
  let roleRelations: RolEstado[]

  if (roleIds.length === 0 && userRoleCodes.size > 0) {
    const [roles, relations] = await Promise.all([
      rolesService.listRoles({ token }),
      rolEstadosService.listRolEstados({ token }),
    ])

    roleIds = roles
      .filter((role) => userRoleCodes.has(normalizeRoleCode(role.codigo)))
      .map((role) => role.id)
    roleRelations = relations
  } else {
    roleRelations = await rolEstadosService.listRolEstados({ token })
  }

  if (roleIds.length === 0) {
    return createEmptyUserRoleStatePermissions()
  }

  const userRoleIds = new Set(roleIds.map(String))
  const allowedProcessStateIds = new Set(
    roleRelations
      .filter((relation) => userRoleIds.has(String(relation.rol_id)))
      .map((relation) => String(relation.estado_id))
  )

  return {
    allowedProcessStateIds,
    hasWorkOrdersAccess: allowedProcessStateIds.size > 0,
  }
}
