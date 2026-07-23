import { hasAnyRole, hasExplicitRole } from "@/features/auth/permissions"
import type { AuthUser, RoleCode } from "@/features/auth/types"
import {
  ESTADO_PROCESO_CODES,
  OPERATIONAL_ESTADO_PROCESO_CODES,
  OPERATIONAL_TARGET_ESTADO_PROCESO_CODES,
  SCHEDULE_APPOINTMENT_TARGET_ESTADO_PROCESO_CODES,
  SPARE_PARTS_TARGET_ESTADO_PROCESO_CODES,
  WORKSHOP_LEAD_TARGET_ESTADO_PROCESO_CODES,
} from "@/features/estados-proceso/constants"
import type { EstadoProceso } from "@/features/estados-proceso/types"
import { findCurrentProcessState } from "@/features/work-orders/state-access"
import type { WorkOrder, WorkOrderListItem } from "@/features/work-orders/types"

export interface WorkOrderProcessTransitionConfig {
  currentState?: EstadoProceso
  currentStateCode: string
  allowedSourceStateCodes: string[]
  allowedTargetStateCodes: string[]
  canTransition: boolean
  unavailableMessage: string
}

const operationalRoleCodes: RoleCode[] = [
  "DEP_ENDEREZADA",
  "DEP_REPARACION_PINTURA",
  "DEP_ENSAMBLAJE",
  "DEP_MECANICA",
  "DEP_LAVADO_CALIDAD",
]

const operationalStateCodeSet = new Set<string>(OPERATIONAL_ESTADO_PROCESO_CODES)

function normalizeProcessStateCode(value?: string | null) {
  return value?.trim().toUpperCase() ?? ""
}

function getActiveBayStateCodes(processStates: EstadoProceso[]) {
  return processStates
    .filter((state) => state.activo && state.es_bahia)
    .map((state) => normalizeProcessStateCode(state.codigo))
    .filter(Boolean)
}

function excludeRestrictedOperationalTargets(stateCodes: string[]) {
  return stateCodes.filter(
    (stateCode) =>
      stateCode !== ESTADO_PROCESO_CODES.AUTO_INGRESADO &&
      stateCode !== ESTADO_PROCESO_CODES.ENTREGAR_AUTO
  )
}

function buildTransitionConfig({
  currentState,
  sourceCode,
  targetCodes,
  allowedRoles,
  unavailableMessage,
  allowAdmin = true,
  user,
}: {
  currentState?: EstadoProceso
  sourceCode: string
  targetCodes: readonly string[]
  allowedRoles: readonly RoleCode[]
  unavailableMessage: string
  allowAdmin?: boolean
  user: AuthUser | null | undefined
}): WorkOrderProcessTransitionConfig {
  return {
    currentState,
    currentStateCode: sourceCode,
    allowedSourceStateCodes: [sourceCode],
    allowedTargetStateCodes: [...targetCodes],
    canTransition: allowAdmin
      ? hasAnyRole(user, allowedRoles)
      : hasExplicitRole(user, allowedRoles),
    unavailableMessage,
  }
}

export function getWorkOrderProcessTransitionConfig(
  order: WorkOrder | WorkOrderListItem,
  processStates: EstadoProceso[],
  user: AuthUser | null | undefined
): WorkOrderProcessTransitionConfig {
  const currentState = findCurrentProcessState(order, processStates)
  const currentStateCode = normalizeProcessStateCode(currentState?.codigo)
  const activeBayStateCodes = getActiveBayStateCodes(processStates)
  const generallyAssignableBayStateCodes =
    excludeRestrictedOperationalTargets(activeBayStateCodes)

  if (currentStateCode === ESTADO_PROCESO_CODES.ASESOR) {
    return buildTransitionConfig({
      currentState,
      sourceCode: ESTADO_PROCESO_CODES.ASESOR,
      targetCodes: [ESTADO_PROCESO_CODES.JEFE_TALLER],
      allowedRoles: ["ASESOR"],
      unavailableMessage:
        "Esta orden solo se puede enviar desde Asesoria / Ingreso hacia Jefe de Taller.",
      user,
    })
  }

  if (currentStateCode === ESTADO_PROCESO_CODES.JEFE_TALLER) {
    return buildTransitionConfig({
      currentState,
      sourceCode: ESTADO_PROCESO_CODES.JEFE_TALLER,
      targetCodes: WORKSHOP_LEAD_TARGET_ESTADO_PROCESO_CODES,
      allowedRoles: ["JEFE_TALLER"],
      unavailableMessage:
        "Esta orden solo se puede enviar desde Jefe de Taller hacia Programar cita, Repuestos o una bahia.",
      user,
    })
  }

  if (currentStateCode === ESTADO_PROCESO_CODES.REPUESTOS) {
    return buildTransitionConfig({
      currentState,
      sourceCode: ESTADO_PROCESO_CODES.REPUESTOS,
      targetCodes: SPARE_PARTS_TARGET_ESTADO_PROCESO_CODES,
      allowedRoles: ["REPUESTOS", "JEFE_TALLER"],
      unavailableMessage:
        "Esta orden solo se puede enviar desde Solicitud de Repuestos hacia Programar cita o una bahia.",
      user,
    })
  }

  if (currentStateCode === ESTADO_PROCESO_CODES.PROGRAMAR_CITA) {
    return buildTransitionConfig({
      currentState,
      sourceCode: ESTADO_PROCESO_CODES.PROGRAMAR_CITA,
      targetCodes: SCHEDULE_APPOINTMENT_TARGET_ESTADO_PROCESO_CODES,
      allowedRoles: ["ASESOR"],
      unavailableMessage:
        "Esta orden solo se puede enviar desde Programar cita hacia Auto Ingresado.",
      user,
    })
  }

  if (currentStateCode === ESTADO_PROCESO_CODES.AUTO_INGRESADO) {
    return buildTransitionConfig({
      currentState,
      sourceCode: ESTADO_PROCESO_CODES.AUTO_INGRESADO,
      targetCodes: generallyAssignableBayStateCodes,
      allowedRoles: ["JEFE_TALLER"],
      unavailableMessage:
        "Esta orden solo se puede asignar desde Auto Ingresado hacia una bahia activa.",
      user,
    })
  }

  if (currentStateCode === ESTADO_PROCESO_CODES.CONTROL_CALIDAD) {
    return buildTransitionConfig({
      currentState,
      sourceCode: ESTADO_PROCESO_CODES.CONTROL_CALIDAD,
      targetCodes: [
        ...new Set([
          ...generallyAssignableBayStateCodes,
          ESTADO_PROCESO_CODES.ENTREGAR_AUTO,
        ]),
      ],
      allowedRoles: ["CONTROL_CALIDAD", "DEP_LAVADO_CALIDAD"],
      unavailableMessage:
        "Solo Control de Calidad puede enviar esta orden a Entregar Auto.",
      allowAdmin: false,
      user,
    })
  }

  if (currentStateCode === ESTADO_PROCESO_CODES.ENTREGAR_AUTO) {
    return buildTransitionConfig({
      currentState,
      sourceCode: ESTADO_PROCESO_CODES.ENTREGAR_AUTO,
      targetCodes: [ESTADO_PROCESO_CODES.FINALIZADO],
      allowedRoles: ["ASESOR"],
      unavailableMessage:
        "Solo el Asesor puede finalizar por completo esta orden de trabajo.",
      allowAdmin: false,
      user,
    })
  }

  if (currentState?.es_bahia || operationalStateCodeSet.has(currentStateCode)) {
    return buildTransitionConfig({
      currentState,
      sourceCode: currentStateCode,
      targetCodes: [
        ...new Set([
          ...generallyAssignableBayStateCodes,
          ...OPERATIONAL_TARGET_ESTADO_PROCESO_CODES,
        ]),
      ],
      allowedRoles: operationalRoleCodes,
      unavailableMessage:
        "Esta orden se puede enviar a otra bahia operativa.",
      user,
    })
  }

  return {
    currentState,
    currentStateCode,
    allowedSourceStateCodes: currentStateCode ? [currentStateCode] : [],
    allowedTargetStateCodes: [],
    canTransition: false,
    unavailableMessage:
      "Este estado no tiene transiciones configuradas desde la tabla de ordenes.",
  }
}
