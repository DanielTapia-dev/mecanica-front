import type {
  OperationalDepartmentCode,
  OperationalDepartmentSlug,
  WorkOrder,
  WorkOrderDepartmentHistory,
  WorkOrderGeneralStatus,
  WorkOrderListFilters,
  WorkOrderListItem,
  WorkOrderPrimaryAction,
  WorkOrderStage,
} from "./types"

export interface OperationalDepartmentOption {
  slug: OperationalDepartmentSlug
  codigo: OperationalDepartmentCode
  label: string
  shortLabel: string
  route: string
  roleCode:
    | "DEP_ENDEREZADA"
    | "DEP_REPARACION_PINTURA"
    | "DEP_ENSAMBLAJE"
    | "DEP_MECANICA"
    | "DEP_LAVADO_CALIDAD"
}

export const operationalDepartmentOptions: OperationalDepartmentOption[] = [
  {
    slug: "enderezado",
    codigo: "ENDEREZADA",
    label: "Enderezada",
    shortLabel: "Enderezada",
    route: "/departamentos/enderezado",
    roleCode: "DEP_ENDEREZADA",
  },
  {
    slug: "pintura",
    codigo: "REPARACION_PINTURA",
    label: "Reparacion y pintura",
    shortLabel: "Pintura",
    route: "/departamentos/pintura",
    roleCode: "DEP_REPARACION_PINTURA",
  },
  {
    slug: "ensamblaje",
    codigo: "ENSAMBLAJE",
    label: "Ensamblaje",
    shortLabel: "Ensamblaje",
    route: "/departamentos/ensamblaje",
    roleCode: "DEP_ENSAMBLAJE",
  },
  {
    slug: "mecanica",
    codigo: "MECANICA",
    label: "Mecanica",
    shortLabel: "Mecanica",
    route: "/departamentos/mecanica",
    roleCode: "DEP_MECANICA",
  },
  {
    slug: "lavado",
    codigo: "LAVADO_CALIDAD",
    label: "Lavado y control de calidad",
    shortLabel: "Lavado",
    route: "/departamentos/lavado",
    roleCode: "DEP_LAVADO_CALIDAD",
  },
]

export const workOrderGeneralStatusLabels: Record<WorkOrderGeneralStatus, string> = {
  Pendiente: "Pendiente",
  "En proceso": "En proceso",
  Completado: "Completado",
}

export const workOrderStageLabels: Record<WorkOrderStage, string> = {
  Ingreso: "Ingreso",
  Repuestos: "Repuestos",
  "Seleccion de departamento": "Seleccion de departamento",
  "En departamento": "En departamento",
  Finalizado: "Finalizado",
}

export function getDepartmentOptionBySlug(slug: string) {
  return operationalDepartmentOptions.find((department) => department.slug === slug)
}

export function getDepartmentOptionByCode(code: string) {
  return operationalDepartmentOptions.find(
    (department) => department.codigo === code.toUpperCase()
  )
}

export function getDepartmentLabel(codeOrSlug?: string | null) {
  if (!codeOrSlug) {
    return "Sin departamento"
  }

  return (
    getDepartmentOptionByCode(codeOrSlug)?.label ??
    getDepartmentOptionBySlug(codeOrSlug)?.label ??
    codeOrSlug
  )
}

export function getCustomerDisplayName(
  order: Pick<WorkOrder, "cliente" | "vehiculo" | "cliente_id">
) {
  const customer = order.cliente

  if (!customer) {
    return order.vehiculo?.cliente_nombre ?? order.vehiculo?.cliente_cedula ?? "Cliente sin cargar"
  }

  return [customer.nombre, customer.apellido].filter(Boolean).join(" ")
}

export function getVehicleDisplayName(order: Pick<WorkOrder, "vehiculo" | "vehiculo_id">) {
  const vehicle = order.vehiculo

  if (!vehicle) {
    return `Vehiculo ${order.vehiculo_id}`
  }

  return [vehicle.placa, vehicle.marca, vehicle.modelo].filter(Boolean).join(" ")
}

export function getWorkOrderUpdatedAt(
  order: Pick<
    WorkOrder,
    "actualizado_en" | "fecha_finalizacion" | "fecha_creacion" | "creado_en"
  >
) {
  return (
    order.actualizado_en ??
    order.fecha_finalizacion ??
    order.fecha_creacion ??
    order.creado_en
  )
}

export function isWorkOrderFinished(
  order: Pick<WorkOrder, "estado_general" | "etapa_actual">
) {
  return order.estado_general === "Completado" || order.etapa_actual === "Finalizado"
}

export function isWorkOrderInSpareParts(order: Pick<WorkOrder, "etapa_actual">) {
  return order.etapa_actual === "Repuestos"
}

export function isWorkOrderReadyForDepartmentSelection(
  order: Pick<WorkOrder, "etapa_actual" | "requiere_repuestos" | "repuestos_completos">
) {
  return (
    order.etapa_actual === "Seleccion de departamento" &&
    (!order.requiere_repuestos || order.repuestos_completos)
  )
}

export function getDepartmentSelectionBlockReason(
  order: Pick<WorkOrder, "etapa_actual" | "requiere_repuestos" | "repuestos_completos">
) {
  if (order.etapa_actual !== "Seleccion de departamento") {
    return "La orden aun no esta en seleccion de departamento."
  }

  if (order.requiere_repuestos && !order.repuestos_completos) {
    return "La orden requiere repuestos completos antes de seleccionar departamento."
  }

  return undefined
}

export function getOpenDepartmentHistory(
  history: WorkOrderDepartmentHistory[] | null | undefined
) {
  return history?.find((item) => !item.fecha_salida)
}

export function hasOpenDepartmentHistory(
  history: WorkOrderDepartmentHistory[] | null | undefined
) {
  return Boolean(getOpenDepartmentHistory(history))
}

export function getWorkOrderPrimaryAction(order: WorkOrder): WorkOrderPrimaryAction {
  if (isWorkOrderFinished(order)) {
    return {
      id: "view-finalized",
      label: "Ver orden finalizada",
      allowedRoles: ["ADMIN", "ASESOR", "RECEPCION", "CLIENTE"],
      disabled: false,
    }
  }

  if (order.etapa_actual === "Repuestos") {
    return {
      id: "manage-spare-parts",
      label: "Gestionar repuestos",
      allowedRoles: ["ADMIN", "ASESOR", "REPUESTOS"],
      disabled: false,
    }
  }

  if (order.etapa_actual === "Seleccion de departamento") {
    const reason = getDepartmentSelectionBlockReason(order)

    return {
      id: "select-department",
      label: "Enviar a departamento",
      allowedRoles: ["ADMIN", "ASESOR", "RECEPCION"],
      disabled: Boolean(reason),
      reason,
    }
  }

  if (order.etapa_actual === "En departamento") {
    return {
      id: "register-progress",
      label: "Registrar avance",
      allowedRoles: [
        "ADMIN",
        "ASESOR",
        "DEP_ENDEREZADA",
        "DEP_REPARACION_PINTURA",
        "DEP_ENSAMBLAJE",
        "DEP_MECANICA",
        "DEP_LAVADO_CALIDAD",
      ],
      disabled: false,
    }
  }

  if (order.requiere_repuestos) {
    return {
      id: "manage-spare-parts",
      label: "Crear solicitud de repuestos",
      allowedRoles: ["ADMIN", "ASESOR", "REPUESTOS"],
      disabled: false,
    }
  }

  return {
    id: "select-department",
    label: "Enviar a departamento",
    allowedRoles: ["ADMIN", "ASESOR", "RECEPCION"],
    disabled: false,
  }
}

export function getFinalizeAction(): WorkOrderPrimaryAction {
  return {
    id: "finalize-work-order",
    label: "Finalizar/despachar vehiculo",
    allowedRoles: [
    "ADMIN",
    "ASESOR",
    "DEP_ENDEREZADA",
      "DEP_REPARACION_PINTURA",
      "DEP_ENSAMBLAJE",
      "DEP_MECANICA",
      "DEP_LAVADO_CALIDAD",
    ],
    disabled: false,
  }
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase()
}

function joinSearchParts(parts: Array<number | string | null | undefined>) {
  return parts
    .filter((part): part is number | string => part !== null && part !== undefined)
    .map((part) => String(part))
    .join(" ")
    .toLowerCase()
}

export function getWorkOrderSearchText(order: WorkOrderListItem | WorkOrder) {
  return joinSearchParts([
    order.codigo,
    order.motivo_ingreso,
    order.estado_general,
    order.etapa_actual,
    order.actividad_actual,
    order.observacion_cliente,
    order.cliente?.nombre,
    order.cliente?.apellido,
    order.cliente?.documento,
    order.cliente?.telefono,
    order.cliente?.email,
    order.vehiculo?.placa,
    order.vehiculo?.vin,
    order.vehiculo?.marca,
    order.vehiculo?.modelo,
    order.vehiculo?.color,
    order.departamento_actual?.nombre,
    order.departamento_actual?.codigo,
  ])
}

export function filterWorkOrders<T extends WorkOrderListItem | WorkOrder>(
  orders: T[],
  filters: WorkOrderListFilters
) {
  const query = filters.query ? normalizeSearchText(filters.query) : ""

  return orders.filter((order) => {
    if (query && !getWorkOrderSearchText(order).includes(query)) {
      return false
    }

    if (filters.cliente_id && order.cliente_id !== filters.cliente_id) {
      return false
    }

    if (filters.vehiculo_id && order.vehiculo_id !== filters.vehiculo_id) {
      return false
    }

    if (filters.estado_general && order.estado_general !== filters.estado_general) {
      return false
    }

    if (filters.etapa_actual && order.etapa_actual !== filters.etapa_actual) {
      return false
    }

    if (
      filters.departamento_actual_id &&
      order.departamento_actual_id !== filters.departamento_actual_id
    ) {
      return false
    }

    if (
      filters.departamento_codigo &&
      order.departamento_actual?.codigo !== filters.departamento_codigo
    ) {
      return false
    }

    if (
      typeof filters.requiere_repuestos === "boolean" &&
      order.requiere_repuestos !== filters.requiere_repuestos
    ) {
      return false
    }

    if (
      typeof filters.repuestos_completos === "boolean" &&
      order.repuestos_completos !== filters.repuestos_completos
    ) {
      return false
    }

    return true
  })
}

export function sortWorkOrdersByUpdatedAt<T extends WorkOrderListItem | WorkOrder>(
  orders: T[]
) {
  return [...orders].sort((left, right) => {
    const leftTime = new Date(getWorkOrderUpdatedAt(left) ?? 0).getTime()
    const rightTime = new Date(getWorkOrderUpdatedAt(right) ?? 0).getTime()

    return rightTime - leftTime
  })
}
