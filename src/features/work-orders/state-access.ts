import { getUserRoleCodes, getUserRoleIds, hasAnyRole } from "@/features/auth/permissions"
import { normalizeRoleCode } from "@/features/auth/role-normalization"
import type { AuthUser } from "@/features/auth/types"
import { ESTADO_PROCESO_CODES } from "@/features/estados-proceso/constants"
import { estadosProcesoService } from "@/features/estados-proceso/services/estados-proceso-service"
import type { EstadoProceso } from "@/features/estados-proceso/types"
import { rolEstadosService } from "@/features/rol-estados/services/rol-estados-service"
import { rolesService } from "@/features/roles/services/roles-service"
import type { WorkOrder, WorkOrderListItem } from "@/features/work-orders/types"

export interface ProcessStateAccess {
  allowedProcessStateIds: Set<string>
  processStates: EstadoProceso[]
}

const DIRECT_TRANSITION_SOURCE_CODES = [ESTADO_PROCESO_CODES.ASESOR] as const

const DIRECT_TRANSITION_TARGET_CODES = [ESTADO_PROCESO_CODES.JEFE_TALLER] as const

export interface WorkOrderTransitionTargetOptions {
  allowedTargetStateCodes: string[]
  allowedSourceStateCodes?: string[]
}

type WorkOrderStateSource = Pick<
  WorkOrder | WorkOrderListItem,
  | "actividad_actual"
  | "estado_actual"
  | "estado_actual_id"
  | "estado_actual_codigo"
  | "estado_codigo"
  | "estado_general"
  | "estado_id"
  | "estado_proceso"
  | "estado_proceso_id"
  | "estado_proceso_codigo"
  | "etapa_actual"
>

function normalizeStateToken(value?: string | null) {
  return value
    ? value
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    : ""
}

function getStateTokenAliases(token: string) {
  const aliases: Record<string, string[]> = {
    SELECCION_DE_DEPARTAMENTO: ["SELECCION_DEPARTAMENTO"],
    EN_DEPARTAMENTO: ["EN_BAHIA", "BAHIA"],
    EN_PROCESO: ["PROCESO"],
  }

  return [token, ...(aliases[token] ?? [])].filter(Boolean)
}

function getStateTokens(...values: Array<string | null | undefined>) {
  return new Set(
    values.flatMap((value) => getStateTokenAliases(normalizeStateToken(value)))
  )
}

export function findCurrentProcessState(
  order: WorkOrderStateSource,
  processStates: EstadoProceso[]
) {
  const orderStateIds = new Set(
    [
      order.estado_actual_id,
      order.estado_id,
      order.estado_proceso_id,
      order.estado_actual?.id,
      order.estado_proceso?.id,
    ]
      .filter((value): value is string => Boolean(value))
      .map(String)
  )

  const stateById = processStates.find((state) => orderStateIds.has(String(state.id)))

  if (stateById) {
    return stateById
  }

  const orderStateTokens = getStateTokens(
    order.etapa_actual,
    order.estado_general,
    order.actividad_actual,
    order.estado_codigo,
    order.estado_actual_codigo,
    order.estado_proceso_codigo,
    order.estado_actual?.codigo,
    order.estado_actual?.nombre,
    order.estado_proceso?.codigo,
    order.estado_proceso?.nombre
  )

  return processStates.find((state) => {
    const processStateTokens = getStateTokens(state.codigo, state.nombre)
    return [...processStateTokens].some((token) => orderStateTokens.has(token))
  })
}

export function sortProcessStatesByVisualOrder(processStates: EstadoProceso[]) {
  return [...processStates].sort((left, right) => {
    const leftOrder = Number.isFinite(left.orden_visual)
      ? left.orden_visual
      : Number.MAX_SAFE_INTEGER
    const rightOrder = Number.isFinite(right.orden_visual)
      ? right.orden_visual
      : Number.MAX_SAFE_INTEGER

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return String(left.id).localeCompare(String(right.id), "es")
  })
}

export function getWorkOrderDirectTransitionTargets(
  order: WorkOrderStateSource,
  processStates: EstadoProceso[]
) {
  return getWorkOrderTransitionTargets(order, processStates, {
    allowedSourceStateCodes: [...DIRECT_TRANSITION_SOURCE_CODES],
    allowedTargetStateCodes: [...DIRECT_TRANSITION_TARGET_CODES],
  })
}

export function getWorkOrderTransitionTargets(
  order: WorkOrderStateSource,
  processStates: EstadoProceso[],
  options: WorkOrderTransitionTargetOptions
) {
  const currentState = findCurrentProcessState(order, processStates)
  const sourceCodes = options.allowedSourceStateCodes?.length
    ? new Set(options.allowedSourceStateCodes.map(normalizeStateToken))
    : null
  const targetCodes = new Set(options.allowedTargetStateCodes.map(normalizeStateToken))

  if (targetCodes.size === 0) {
    return []
  }

  if (sourceCodes && (!currentState || !sourceCodes.has(normalizeStateToken(currentState.codigo)))) {
    return []
  }

  return sortProcessStatesByVisualOrder(processStates).filter((state) => {
    if (!state.activo || !targetCodes.has(normalizeStateToken(state.codigo))) {
      return false
    }

    return String(state.id) !== String(currentState?.id)
  })
}

export function canAccessCurrentProcessState(
  user: AuthUser | null | undefined,
  order: WorkOrderStateSource,
  stateAccess: ProcessStateAccess
) {
  if (hasAnyRole(user, ["ADMIN"])) {
    return true
  }

  const orderStateIds = [
    order.estado_actual_id,
    order.estado_id,
    order.estado_proceso_id,
    order.estado_actual?.id,
    order.estado_proceso?.id,
  ]
    .filter((value): value is string => Boolean(value))
    .map(String)

  if (orderStateIds.some((stateId) => stateAccess.allowedProcessStateIds.has(stateId))) {
    return true
  }

  const currentState = findCurrentProcessState(order, stateAccess.processStates)

  return Boolean(
    currentState && stateAccess.allowedProcessStateIds.has(currentState.id)
  )
}

export async function loadProcessStateAccess(
  user: AuthUser,
  token?: string
): Promise<ProcessStateAccess> {
  let roleIds = getUserRoleIds(user)
  const empresaId = user.empresaId ?? user.empresa_id
  const processStates = empresaId
    ? await estadosProcesoService.listEstadosProcesoByEmpresa(empresaId, { token })
    : await estadosProcesoService.listEstadosProceso({ token })
  const activeStates = processStates.filter((state) => state.activo)

  if (hasAnyRole(user, ["ADMIN"])) {
    return {
      processStates: activeStates,
      allowedProcessStateIds: new Set(activeStates.map((state) => state.id)),
    }
  }

  if (roleIds.length === 0) {
    const userRoleCodes = new Set(getUserRoleCodes(user))
    const roles = await rolesService.listRoles({ token })

    roleIds = roles
      .filter((role) => userRoleCodes.has(normalizeRoleCode(role.codigo)))
      .map((role) => role.id)
  }

  if (roleIds.length === 0) {
    return {
      processStates: activeStates,
      allowedProcessStateIds: new Set(),
    }
  }

  const roleStates = empresaId
    ? await rolEstadosService.listRolEstadosByEmpresa(empresaId, { token })
    : (
        await Promise.all(
          roleIds.map((roleId) => rolEstadosService.listEstadosByRol(roleId, { token }))
        )
      ).flat()
  const roleIdSet = new Set(roleIds)
  const allowedProcessStateIds = new Set(
    roleStates
      .filter((roleState) => roleIdSet.has(roleState.rol_id))
      .map((roleState) => roleState.estado_id)
  )

  return {
    processStates: activeStates,
    allowedProcessStateIds,
  }
}
