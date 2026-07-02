import type {
  AssignDepartmentInput,
  CustomerListFilters,
  CustomerSummary,
  CreateCustomerInput,
  CreateSparePartItemInput,
  CreateVehicleInput,
  CreateWorkOrderStateHistoryInput,
  CreateWorkOrderInput,
  EntityId,
  FinalizeWorkOrderInput,
  MoveWorkOrderToProcessStateInput,
  MoveDepartmentInput,
  OperationalDepartment,
  PaginatedResult,
  RegisterWorkOrderProgressInput,
  SparePartRequest,
  SparePartRequestItem,
  SparePartRequestListFilters,
  UpdateSparePartItemInput,
  UpdateWorkOrderInput,
  VehicleListFilters,
  VehicleSummary,
  WorkOrder,
  WorkOrderListFilters,
  WorkOrderListItem,
} from "../types"
import { notifyUnauthorizedResponse } from "@/features/auth/unauthorized-session"

const API_BASE_PATH = "/api/mecanica"

export const workOrderApiPaths = {
  customers: `${API_BASE_PATH}/clientes`,
  customersActive: `${API_BASE_PATH}/clientes/activos`,
  customerSearch: `${API_BASE_PATH}/clientes/buscar`,
  customerByDocument: (document: string) =>
    `${API_BASE_PATH}/clientepordocumento/${encodeURIComponent(document)}`,
  customer: (customerId: EntityId) => `${API_BASE_PATH}/cliente/${customerId}`,
  createCustomer: `${API_BASE_PATH}/cliente`,
  vehicles: `${API_BASE_PATH}/vehiculos`,
  vehicle: (vehicleId: EntityId) => `${API_BASE_PATH}/vehiculo/${vehicleId}`,
  createVehicle: `${API_BASE_PATH}/vehiculo`,
  departments: `${API_BASE_PATH}/departamentos`,
  workOrders: `${API_BASE_PATH}/ordenes-trabajo`,
  workOrdersByEmpresa: (empresaId: EntityId) =>
    `${API_BASE_PATH}/empresa/${empresaId}/ordenes-trabajo`,
  workOrdersBySucursal: (sucursalId: EntityId) =>
    `${API_BASE_PATH}/sucursal/${sucursalId}/ordenes-trabajo`,
  workOrdersByClienteCedula: (clienteCedula: string) =>
    `${API_BASE_PATH}/cliente-cedula/${encodeURIComponent(clienteCedula)}/ordenes-trabajo`,
  workOrdersByVehicle: (vehicleId: EntityId) =>
    `${API_BASE_PATH}/vehiculo/${vehicleId}/ordenes-trabajo`,
  workOrdersByState: (stateId: EntityId) =>
    `${API_BASE_PATH}/estado/${stateId}/ordenes-trabajo`,
  workOrder: (orderId: EntityId) => `${API_BASE_PATH}/orden-trabajo/${orderId}`,
  createWorkOrder: `${API_BASE_PATH}/orden-trabajo`,
  workOrderStateHistory: `${API_BASE_PATH}/orden-estado-historial`,
  assignDepartment: (orderId: EntityId) =>
    `${API_BASE_PATH}/ordenes-trabajo/${orderId}/departamento`,
  registerProgress: (orderId: EntityId) =>
    `${API_BASE_PATH}/ordenes-trabajo/${orderId}/avance`,
  moveDepartment: (orderId: EntityId) =>
    `${API_BASE_PATH}/ordenes-trabajo/${orderId}/mover-departamento`,
  finalize: (orderId: EntityId) => `${API_BASE_PATH}/ordenes-trabajo/${orderId}/finalizar`,
  sparePartRequests: `${API_BASE_PATH}/solicitudes-repuestos`,
  sparePartRequest: (requestId: EntityId) =>
    `${API_BASE_PATH}/solicitudes-repuestos/${requestId}`,
  sparePartRequestByOrder: (orderId: EntityId) =>
    `${API_BASE_PATH}/orden/${orderId}/solicitud-repuestos`,
  sparePartItems: (requestId: EntityId) =>
    `${API_BASE_PATH}/solicitudes-repuestos/${requestId}/items`,
  sparePartItem: (requestId: EntityId, itemId: EntityId) =>
    `${API_BASE_PATH}/solicitudes-repuestos/${requestId}/items/${itemId}`,
  completeSpareParts: (requestId: EntityId) =>
    `${API_BASE_PATH}/solicitudes-repuestos/${requestId}/completar`,
}

export interface WorkOrdersRequestOptions extends Omit<RequestInit, "body"> {
  token?: string
  body?: unknown
}

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

function readBoolean(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === "boolean") {
      return value
    }
  }

  return undefined
}

function readNumber(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === "number") {
      return value
    }

    if (typeof value === "string" && value.trim()) {
      const parsedValue = Number(value)

      if (Number.isFinite(parsedValue)) {
        return parsedValue
      }
    }
  }

  return undefined
}

function getErrorMessage(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined
  }

  return readString(payload, ["message", "error", "detail"])
}

function getListData<T>(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (!isRecord(payload)) {
    return []
  }

  const dataRecord = isRecord(payload.data) ? payload.data : undefined
  const candidates = [
    payload.data,
    payload.rows,
    payload.items,
    payload.results,
    payload.resultados,
    payload.clientes,
    payload.vehiculos,
    payload.ordenes,
    payload.ordenes_trabajo,
    payload.ordenesTrabajo,
    payload.ordenes_trabajos,
    payload.orders,
    payload.workOrders,
    payload.work_orders,
    payload.solicitudes,
    payload.departamentos,
    dataRecord?.data,
    dataRecord?.rows,
    dataRecord?.items,
    dataRecord?.results,
    dataRecord?.resultados,
    dataRecord?.clientes,
    dataRecord?.vehiculos,
    dataRecord?.ordenes,
    dataRecord?.ordenes_trabajo,
    dataRecord?.ordenesTrabajo,
    dataRecord?.ordenes_trabajos,
    dataRecord?.orders,
    dataRecord?.workOrders,
    dataRecord?.work_orders,
  ]

  const list = candidates.find(Array.isArray)

  return Array.isArray(list) ? (list as T[]) : []
}

function normalizeCustomer(payload: unknown): CustomerSummary | undefined {
  const customer = normalizeObjectResult<unknown>(payload, ["cliente", "customer"])

  if (!isRecord(customer)) {
    return undefined
  }

  const id = readString(customer, ["id", "cliente_id", "clienteId"])

  if (!id) {
    return undefined
  }

  const documento = readString(customer, [
    "documento",
    "cedula",
    "identificacion",
    "numero_documento",
    "numeroDocumento",
  ])

  return {
    ...(customer as unknown as CustomerSummary),
    id,
    usuario_id: readString(customer, ["usuario_id", "usuarioId"]) ?? null,
    nombre: readString(customer, ["nombre", "name", "nombres"]) ?? "",
    apellido: readString(customer, ["apellido", "lastName", "apellidos"]) ?? null,
    cedula: readString(customer, ["cedula"]) ?? documento ?? null,
    documento: documento ?? null,
    telefono:
      readString(customer, ["telefono", "phone", "celular", "telefono_movil"]) ?? null,
    email: readString(customer, ["email", "correo"]) ?? null,
    direccion: readString(customer, ["direccion", "address"]) ?? null,
    activo: readBoolean(customer, ["activo", "active"]),
  }
}

function normalizeCustomerListResult(payload: unknown): PaginatedResult<CustomerSummary> {
  const result = normalizePaginatedResult<unknown>(payload)

  return {
    ...result,
    data: result.data
      .map((customer) => normalizeCustomer(customer))
      .filter((customer): customer is CustomerSummary => Boolean(customer)),
  }
}

function normalizeVehicle(payload: unknown): VehicleSummary | undefined {
  const vehicle = normalizeObjectResult<unknown>(payload, ["vehiculo", "vehicle"])

  if (!isRecord(vehicle)) {
    return undefined
  }

  const id = readString(vehicle, [
    "id",
    "vehiculo_id",
    "vehiculoId",
    "vehicle_id",
    "vehicleId",
  ])

  if (!id) {
    return undefined
  }

  return {
    ...(vehicle as unknown as VehicleSummary),
    id,
    cliente_id: readString(vehicle, ["cliente_id", "clienteId"]) ?? null,
    cliente_nombre:
      readString(vehicle, ["cliente_nombre", "clienteNombre", "nombre_cliente"]) ?? null,
    cliente_cedula:
      readString(vehicle, [
        "cliente_cedula",
        "clienteCedula",
        "cedula_cliente",
        "cliente_documento",
        "documento_cliente",
      ]) ?? null,
    placa: readString(vehicle, ["placa"]) ?? "",
    vin: readString(vehicle, ["vin", "chasis"]) ?? null,
    marca: readString(vehicle, ["marca"]) ?? "",
    modelo: readString(vehicle, ["modelo"]) ?? "",
    anio: readNumber(vehicle, ["anio", "ano"]) ?? null,
    color: readString(vehicle, ["color"]) ?? null,
    kilometraje: readNumber(vehicle, ["kilometraje"]) ?? null,
  }
}

function normalizeVehicleListResult(payload: unknown): PaginatedResult<VehicleSummary> {
  const result = normalizePaginatedResult<unknown>(payload)

  return {
    ...result,
    data: result.data
      .map((vehicle) => normalizeVehicle(vehicle))
      .filter((vehicle): vehicle is VehicleSummary => Boolean(vehicle)),
  }
}

function normalizeProcessState(payload: unknown) {
  if (!isRecord(payload)) {
    return null
  }

  const id = readString(payload, ["id", "estado_id", "estadoId", "estado_actual_id"])

  if (!id) {
    return null
  }

  return {
    id,
    codigo: readString(payload, ["codigo", "estado_codigo", "estadoCodigo"]),
    nombre: readString(payload, ["nombre", "estado_nombre", "estadoNombre"]),
  }
}

function readRelationId(source: JsonRecord, relationKey: string, idKeys: string[]) {
  const relation = source[relationKey]

  return (
    readString(source, idKeys) ??
    (isRecord(relation) ? readString(relation, ["id", `${relationKey}_id`, `${relationKey}Id`]) : null)
  )
}

function readRelationName(source: JsonRecord, relationKey: string, nameKeys: string[]) {
  const relation = source[relationKey]

  return (
    (isRecord(relation)
      ? readString(relation, ["nombre", "name", "razon_social", "razonSocial"])
      : undefined) ??
    readString(source, nameKeys) ??
    null
  )
}

function normalizeWorkOrder(payload: unknown): WorkOrder | undefined {
  const order = normalizeObjectResult<unknown>(payload, [
    "orden",
    "orden_trabajo",
    "ordenTrabajo",
    "workOrder",
    "work_order",
  ])

  if (!isRecord(order)) {
    return undefined
  }

  const id = readString(order, ["id", "orden_id", "ordenId"])
  const vehiculoId = readString(order, ["vehiculo_id", "vehiculoId"])

  if (!id || !vehiculoId) {
    return undefined
  }

  const rawEstado =
    order.estado_actual ??
    order.estadoActual ??
    order.estado ??
    order.estado_proceso ??
    order.estadoProceso
  const estadoActual = normalizeProcessState(rawEstado)
  const estadoActualId =
    readString(order, [
      "estado_actual_id",
      "estadoActualId",
      "estado_id",
      "estadoId",
      "estado_proceso_id",
      "estadoProcesoId",
    ]) ?? estadoActual?.id ?? null
  const estadoCodigo =
    readString(order, [
      "estado_codigo",
      "estadoCodigo",
      "estado_actual_codigo",
      "estadoActualCodigo",
      "estado_proceso_codigo",
      "estadoProcesoCodigo",
    ]) ?? estadoActual?.codigo ?? null
  const estadoNombre =
    readString(order, [
      "etapa_actual",
      "etapaActual",
      "estado_nombre",
      "estadoNombre",
      "estado_actual_nombre",
      "estadoActualNombre",
    ]) ?? estadoActual?.nombre ?? "Ingreso"
  const fechaFinalizacion =
    readString(order, ["fecha_finalizacion", "fechaFinalizacion"]) ?? null
  const estadoGeneral =
    readString(order, ["estado_general", "estadoGeneral"]) ??
    (fechaFinalizacion ? "Completado" : "Pendiente")
  const vehicle = normalizeVehicle(order.vehiculo ?? order.vehicle)
  const customer =
    normalizeCustomer(order.cliente ?? order.customer) ??
    (vehicle?.cliente_nombre || vehicle?.cliente_cedula
      ? {
          id: vehicle.cliente_cedula ?? vehicle.cliente_nombre ?? vehiculoId,
          nombre: vehicle.cliente_nombre ?? "Cliente",
          apellido: null,
          cedula: vehicle.cliente_cedula ?? null,
          documento: vehicle.cliente_cedula ?? null,
          telefono: null,
          email: null,
          direccion: null,
        }
      : undefined)
  const departamentoActual = isRecord(order.departamento_actual)
    ? (order.departamento_actual as unknown as OperationalDepartment)
    : isRecord(order.departamentoActual)
      ? (order.departamentoActual as unknown as OperationalDepartment)
      : null
  const estadoProceso =
    normalizeProcessState(order.estado_proceso ?? order.estadoProceso) ?? estadoActual

  return {
    ...(order as unknown as WorkOrder),
    id,
    codigo: readString(order, ["codigo"]) ?? id,
    codigo_seguimiento: readString(order, ["codigo_seguimiento", "codigoSeguimiento"]) ?? null,
    empresa_id: readString(order, ["empresa_id", "empresaId"]) ?? null,
    sucursal_id: readString(order, ["sucursal_id", "sucursalId"]) ?? null,
    broker_id: readRelationId(order, "broker", ["broker_id", "brokerId"]),
    aseguradora_id: readRelationId(order, "aseguradora", [
      "aseguradora_id",
      "aseguradoraId",
      "compania_seguros_id",
      "companiaSegurosId",
    ]),
    broker: readRelationName(order, "broker", [
      "broker",
      "broker_nombre",
      "brokerNombre",
      "intermediario",
    ]),
    aseguradora: readRelationName(order, "aseguradora", [
      "aseguradora",
      "aseguradora_nombre",
      "aseguradoraNombre",
      "compania_seguros",
      "companiaSeguros",
    ]),
    cliente_id: readString(order, ["cliente_id", "clienteId"]) ?? null,
    vehiculo_id: vehiculoId,
    estado_general: estadoGeneral,
    etapa_actual: estadoNombre,
    estado_actual_id: estadoActualId,
    estado_id: readString(order, ["estado_id", "estadoId"]) ?? estadoActualId,
    estado_proceso_id:
      readString(order, ["estado_proceso_id", "estadoProcesoId"]) ?? estadoActualId,
    estado_codigo: estadoCodigo,
    estado_actual_codigo: estadoCodigo,
    estado_proceso_codigo: estadoCodigo,
    sub_estado_actual:
      readString(order, ["sub_estado_actual", "subEstadoActual", "sub_estado", "subEstado"]) ??
      null,
    requiere_repuestos:
      readBoolean(order, ["requiere_repuestos", "requiereRepuestos"]) ?? false,
    repuestos_completos:
      readBoolean(order, ["repuestos_completos", "repuestosCompletos"]) ?? false,
    encuesta_realizada:
      readBoolean(order, ["encuesta_realizada", "encuestaRealizada"]) ?? false,
    fecha_encuesta: readString(order, ["fecha_encuesta", "fechaEncuesta"]) ?? null,
    departamento_actual_id:
      readString(order, ["departamento_actual_id", "departamentoActualId"]) ?? null,
    actividad_actual: readString(order, ["actividad_actual", "actividadActual"]) ?? null,
    observacion_cliente:
      readString(order, ["observacion_cliente", "observacionCliente"]) ?? null,
    observacion_interna:
      readString(order, ["observacion_interna", "observacionInterna"]) ?? null,
    motivo_ingreso: readString(order, ["motivo_ingreso", "motivoIngreso"]) ?? "",
    fecha_creacion:
      readString(order, ["fecha_creacion", "fechaCreacion", "creado_en", "creadoEn"]) ?? "",
    fecha_inicio_proceso:
      readString(order, ["fecha_inicio_proceso", "fechaInicioProceso"]) ?? null,
    fecha_finalizacion: fechaFinalizacion,
    creado_por_usuario_id:
      readString(order, ["creado_por_usuario_id", "creadoPorUsuarioId"]) ?? null,
    actualizado_por_usuario_id:
      readString(order, ["actualizado_por_usuario_id", "actualizadoPorUsuarioId"]) ?? null,
    creado_en: readString(order, ["creado_en", "creadoEn"]) ?? undefined,
    actualizado_en: readString(order, ["actualizado_en", "actualizadoEn"]) ?? undefined,
    cliente: customer,
    vehiculo: vehicle,
    departamento_actual: departamentoActual,
    estado_actual: estadoActual,
    estado_proceso: estadoProceso,
  }
}

function normalizeWorkOrderListResult(payload: unknown): PaginatedResult<WorkOrderListItem> {
  const result = normalizePaginatedResult<unknown>(payload)

  return {
    ...result,
    data: result.data
      .map((order) => normalizeWorkOrder(order))
      .filter((order): order is WorkOrder => Boolean(order)),
  }
}

function normalizePlateForComparison(value: string) {
  return value.trim().replace(/[\s-]+/g, "").toUpperCase()
}

function looksLikeDocumentSearch(query: string) {
  const normalizedQuery = query.trim()
  const compactQuery = normalizedQuery.replace(/[.-]/g, "")

  if (normalizedQuery.length < 5) {
    return false
  }

  return /^\d+$/.test(compactQuery) && !/\s/.test(normalizedQuery)
}

function normalizePaginatedResult<T>(payload: unknown): PaginatedResult<T> {
  if (!isRecord(payload)) {
    return {
      data: getListData<T>(payload),
    }
  }

  const dataRecord = isRecord(payload.data) ? payload.data : undefined

  return {
    data: getListData<T>(payload),
    total:
      readNumber(payload, ["total", "count"]) ??
      (dataRecord ? readNumber(dataRecord, ["total", "count"]) : undefined),
    page:
      readNumber(payload, ["page", "pagina"]) ??
      (dataRecord ? readNumber(dataRecord, ["page", "pagina"]) : undefined),
    pageSize:
      readNumber(payload, ["pageSize", "page_size", "limit", "limite"]) ??
      (dataRecord ? readNumber(dataRecord, ["pageSize", "page_size", "limit", "limite"]) : undefined),
  }
}

function normalizeObjectResult<T>(payload: unknown, keys: string[] = []) {
  if (isRecord(payload) && isRecord(payload.data)) {
    return payload.data as T
  }

  if (isRecord(payload)) {
    for (const key of keys) {
      const value = payload[key]

      if (isRecord(value)) {
        return value as T
      }
    }
  }

  return payload as T
}

function buildUrlWithQuery(path: string, query?: object) {
  if (!query) {
    return path
  }

  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      params.set(key, String(value))
    }
  })

  const queryString = params.toString()

  return queryString ? `${path}?${queryString}` : path
}

function getWorkOrdersListRequest(filters?: WorkOrderListFilters) {
  if (!filters) {
    return {
      path: workOrderApiPaths.workOrders,
      query: undefined,
    }
  }

  const {
    empresa_id,
    sucursal_id,
    cliente_cedula,
    vehiculo_id,
    estado_actual_id,
    ...query
  } = filters

  if (sucursal_id) {
    return {
      path: workOrderApiPaths.workOrdersBySucursal(sucursal_id),
      query,
    }
  }

  if (empresa_id) {
    return {
      path: workOrderApiPaths.workOrdersByEmpresa(empresa_id),
      query,
    }
  }

  if (cliente_cedula) {
    return {
      path: workOrderApiPaths.workOrdersByClienteCedula(cliente_cedula),
      query,
    }
  }

  if (vehiculo_id) {
    return {
      path: workOrderApiPaths.workOrdersByVehicle(vehiculo_id),
      query,
    }
  }

  if (estado_actual_id) {
    return {
      path: workOrderApiPaths.workOrdersByState(estado_actual_id),
      query,
    }
  }

  return {
    path: workOrderApiPaths.workOrders,
    query,
  }
}

async function parseResponseBody(response: Response) {
  const body = await response.text()

  if (!body) {
    return undefined
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    return { message: body }
  }
}

export class WorkOrdersServiceError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown, fallbackMessage: string) {
    super(getErrorMessage(payload) ?? fallbackMessage)
    this.name = "WorkOrdersServiceError"
    this.status = status
    this.payload = payload
  }
}

export async function requestWorkOrdersApi<T>(
  path: string,
  options: WorkOrdersRequestOptions = {}
) {
  const { body, headers, token, ...init } = options
  const requestHeaders = new Headers(headers)

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json")
  }

  if (token && !requestHeaders.has("Authorization")) {
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(path, {
    ...init,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: init.cache ?? "no-store",
  })
  const payload = await parseResponseBody(response)

  if (!response.ok) {
    notifyUnauthorizedResponse(response.status, payload)
    throw new WorkOrdersServiceError(
      response.status,
      payload,
      "No fue posible completar la solicitud de ordenes."
    )
  }

  return payload as T
}

export const workOrdersService = {
  async listCustomers(
    filters?: CustomerListFilters,
    options?: WorkOrdersRequestOptions
  ): Promise<PaginatedResult<CustomerSummary>> {
    const query = filters?.query?.trim()
    const hasQuery = Boolean(query)

    if (query && looksLikeDocumentSearch(query)) {
      try {
        const payload = await requestWorkOrdersApi<unknown>(
          workOrderApiPaths.customerByDocument(query),
          options
        )
        const customer = normalizeCustomer(payload)

        if (customer) {
          return {
            data: [customer],
            total: 1,
          }
        }
      } catch {
        // Fall through to the general search endpoint because the backend may
        // return an error when the document does not exist.
      }
    }

    const payload = await requestWorkOrdersApi<unknown>(
      buildUrlWithQuery(
        hasQuery ? workOrderApiPaths.customerSearch : workOrderApiPaths.customersActive,
        filters
      ),
      options
    )

    return normalizeCustomerListResult(payload)
  },

  async listVehicles(
    filters?: VehicleListFilters,
    options?: WorkOrdersRequestOptions
  ): Promise<PaginatedResult<VehicleSummary>> {
    const payload = await requestWorkOrdersApi<unknown>(
      buildUrlWithQuery(workOrderApiPaths.vehicles, filters),
      options
    )

    return normalizeVehicleListResult(payload)
  },

  async findVehicleByPlate(
    plate: string,
    options?: WorkOrdersRequestOptions
  ): Promise<VehicleSummary | null> {
    const normalizedPlate = normalizePlateForComparison(plate)

    if (!normalizedPlate) {
      return null
    }

    const result = await this.listVehicles({ query: plate.trim() }, options)
    const vehicle = result.data.find(
      (item) => normalizePlateForComparison(item.placa) === normalizedPlate
    )

    return vehicle ?? null
  },

  createCustomer(input: CreateCustomerInput, options?: WorkOrdersRequestOptions) {
    return requestWorkOrdersApi<unknown>(workOrderApiPaths.createCustomer, {
      ...options,
      method: "POST",
      body: input,
    }).then((payload) => normalizeCustomer(payload) ?? normalizeObjectResult<CustomerSummary>(payload))
  },

  createVehicle(input: CreateVehicleInput, options?: WorkOrdersRequestOptions) {
    return requestWorkOrdersApi<unknown>(workOrderApiPaths.createVehicle, {
      ...options,
      method: "POST",
      body: input,
    }).then((payload) =>
      normalizeVehicle(payload) ??
      normalizeObjectResult<VehicleSummary>(payload, ["vehiculo", "vehicle"])
    )
  },

  async listWorkOrders(
    filters?: WorkOrderListFilters,
    options?: WorkOrdersRequestOptions
  ): Promise<PaginatedResult<WorkOrderListItem>> {
    const request = getWorkOrdersListRequest(filters)
    const payload = await requestWorkOrdersApi<unknown>(
      buildUrlWithQuery(request.path, request.query),
      options
    )

    return normalizeWorkOrderListResult(payload)
  },

  getWorkOrder(orderId: EntityId, options?: WorkOrdersRequestOptions) {
    return requestWorkOrdersApi<unknown>(
      workOrderApiPaths.workOrder(orderId),
      options
    ).then((payload) => normalizeWorkOrder(payload) ?? normalizeObjectResult<WorkOrder>(payload))
  },

  createWorkOrder(input: CreateWorkOrderInput, options?: WorkOrdersRequestOptions) {
    return requestWorkOrdersApi<unknown>(workOrderApiPaths.createWorkOrder, {
      ...options,
      method: "POST",
      body: input,
    }).then((payload) =>
      normalizeWorkOrder(payload) ??
      normalizeObjectResult<WorkOrder>(payload, [
        "orden",
        "orden_trabajo",
        "ordenTrabajo",
        "workOrder",
        "work_order",
      ])
    )
  },

  async updateWorkOrder(
    orderId: EntityId,
    input: UpdateWorkOrderInput,
    options?: WorkOrdersRequestOptions
  ) {
    const payload = await requestWorkOrdersApi<unknown>(
      workOrderApiPaths.workOrder(orderId),
      {
        ...options,
        method: "PUT",
        body: input,
      }
    )
    const updatedOrder = normalizeWorkOrder(payload)

    if (updatedOrder) {
      return updatedOrder
    }

    return requestWorkOrdersApi<unknown>(workOrderApiPaths.workOrder(orderId), {
      token: options?.token,
      headers: options?.headers,
    }).then((refreshedPayload) =>
      normalizeWorkOrder(refreshedPayload) ??
      normalizeObjectResult<WorkOrder>(refreshedPayload)
    )
  },

  createWorkOrderStateHistory(
    input: CreateWorkOrderStateHistoryInput,
    options?: WorkOrdersRequestOptions
  ) {
    return requestWorkOrdersApi<unknown>(workOrderApiPaths.workOrderStateHistory, {
      ...options,
      method: "POST",
      body: input,
    })
  },

  moveWorkOrderToProcessState(
    input: MoveWorkOrderToProcessStateInput,
    options?: WorkOrdersRequestOptions
  ) {
    return this.updateWorkOrder(
      input.orden_id,
      {
        estado_actual_id: input.estado_actual_id,
        sub_estado_actual: input.sub_estado_actual ?? null,
      },
      options
    )
  },

  assignDepartment(
    orderId: EntityId,
    input: AssignDepartmentInput,
    options?: WorkOrdersRequestOptions
  ) {
    return requestWorkOrdersApi<unknown>(workOrderApiPaths.assignDepartment(orderId), {
      ...options,
      method: "POST",
      body: input,
    }).then(normalizeObjectResult<WorkOrder>)
  },

  registerProgress(
    orderId: EntityId,
    input: RegisterWorkOrderProgressInput,
    options?: WorkOrdersRequestOptions
  ) {
    return requestWorkOrdersApi<unknown>(workOrderApiPaths.registerProgress(orderId), {
      ...options,
      method: "PATCH",
      body: input,
    }).then(normalizeObjectResult<WorkOrder>)
  },

  moveDepartment(
    orderId: EntityId,
    input: MoveDepartmentInput,
    options?: WorkOrdersRequestOptions
  ) {
    return requestWorkOrdersApi<unknown>(workOrderApiPaths.moveDepartment(orderId), {
      ...options,
      method: "POST",
      body: input,
    }).then(normalizeObjectResult<WorkOrder>)
  },

  finalizeWorkOrder(
    orderId: EntityId,
    input: FinalizeWorkOrderInput = {},
    options?: WorkOrdersRequestOptions
  ) {
    return requestWorkOrdersApi<unknown>(workOrderApiPaths.finalize(orderId), {
      ...options,
      method: "POST",
      body: input,
    }).then(normalizeObjectResult<WorkOrder>)
  },

  async listDepartments(
    options?: WorkOrdersRequestOptions
  ): Promise<PaginatedResult<OperationalDepartment>> {
    const payload = await requestWorkOrdersApi<unknown>(
      workOrderApiPaths.departments,
      options
    )

    return normalizePaginatedResult<OperationalDepartment>(payload)
  },

  async listSparePartRequests(
    filters?: SparePartRequestListFilters,
    options?: WorkOrdersRequestOptions
  ): Promise<PaginatedResult<SparePartRequest>> {
    const payload = await requestWorkOrdersApi<unknown>(
      buildUrlWithQuery(workOrderApiPaths.sparePartRequests, filters),
      options
    )

    return normalizePaginatedResult<SparePartRequest>(payload)
  },

  getSparePartRequest(requestId: EntityId, options?: WorkOrdersRequestOptions) {
    return requestWorkOrdersApi<unknown>(
      workOrderApiPaths.sparePartRequest(requestId),
      options
    ).then(normalizeObjectResult<SparePartRequest>)
  },

  getSparePartRequestByOrder(orderId: EntityId, options?: WorkOrdersRequestOptions) {
    return requestWorkOrdersApi<unknown>(
      workOrderApiPaths.sparePartRequestByOrder(orderId),
      options
    ).then(normalizeObjectResult<SparePartRequest>)
  },

  addSparePartItem(
    requestId: EntityId,
    input: CreateSparePartItemInput,
    options?: WorkOrdersRequestOptions
  ) {
    return requestWorkOrdersApi<unknown>(
      workOrderApiPaths.sparePartItems(requestId),
      {
        ...options,
        method: "POST",
        body: input,
      }
    ).then(normalizeObjectResult<SparePartRequestItem>)
  },

  updateSparePartItem(
    requestId: EntityId,
    itemId: EntityId,
    input: UpdateSparePartItemInput,
    options?: WorkOrdersRequestOptions
  ) {
    return requestWorkOrdersApi<unknown>(
      workOrderApiPaths.sparePartItem(requestId, itemId),
      {
        ...options,
        method: "PATCH",
        body: input,
      }
    ).then(normalizeObjectResult<SparePartRequestItem>)
  },

  completeSpareParts(requestId: EntityId, options?: WorkOrdersRequestOptions) {
    return requestWorkOrdersApi<unknown>(
      workOrderApiPaths.completeSpareParts(requestId),
      {
        ...options,
        method: "POST",
      }
    ).then(normalizeObjectResult<SparePartRequest>)
  },
}
