import type {
  AssignDepartmentInput,
  CustomerListFilters,
  CustomerSummary,
  CreateCustomerInput,
  CreateSparePartItemInput,
  CreateVehicleInput,
  CreateWorkOrderInput,
  EntityId,
  FinalizeWorkOrderInput,
  MoveDepartmentInput,
  OperationalDepartment,
  PaginatedResult,
  RegisterWorkOrderProgressInput,
  SparePartRequest,
  SparePartRequestItem,
  SparePartRequestListFilters,
  UpdateSparePartItemInput,
  VehicleListFilters,
  VehicleSummary,
  WorkOrder,
  WorkOrderListFilters,
  WorkOrderListItem,
} from "../types"

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
  workOrder: (orderId: EntityId) => `${API_BASE_PATH}/orden-trabajo/${orderId}`,
  createWorkOrder: `${API_BASE_PATH}/orden-trabajo`,
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

  const candidates = [
    payload.data,
    payload.items,
    payload.results,
    payload.resultados,
    payload.clientes,
    payload.vehiculos,
    payload.ordenes,
    payload.ordenes_trabajo,
    payload.workOrders,
    payload.work_orders,
    payload.solicitudes,
    payload.departamentos,
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

  return {
    data: getListData<T>(payload),
    total: readNumber(payload, ["total", "count"]),
    page: readNumber(payload, ["page", "pagina"]),
    pageSize: readNumber(payload, ["pageSize", "page_size", "limit", "limite"]),
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

    return normalizePaginatedResult<VehicleSummary>(payload)
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
      normalizeObjectResult<VehicleSummary>(payload, ["vehiculo", "vehicle"])
    )
  },

  async listWorkOrders(
    filters?: WorkOrderListFilters,
    options?: WorkOrdersRequestOptions
  ): Promise<PaginatedResult<WorkOrderListItem>> {
    const payload = await requestWorkOrdersApi<unknown>(
      buildUrlWithQuery(workOrderApiPaths.workOrders, filters),
      options
    )

    return normalizePaginatedResult<WorkOrderListItem>(payload)
  },

  getWorkOrder(orderId: EntityId, options?: WorkOrdersRequestOptions) {
    return requestWorkOrdersApi<unknown>(
      workOrderApiPaths.workOrder(orderId),
      options
    ).then(normalizeObjectResult<WorkOrder>)
  },

  createWorkOrder(input: CreateWorkOrderInput, options?: WorkOrdersRequestOptions) {
    return requestWorkOrdersApi<unknown>(workOrderApiPaths.createWorkOrder, {
      ...options,
      method: "POST",
      body: input,
    }).then((payload) =>
      normalizeObjectResult<WorkOrder>(payload, [
        "orden",
        "orden_trabajo",
        "workOrder",
        "work_order",
      ])
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
