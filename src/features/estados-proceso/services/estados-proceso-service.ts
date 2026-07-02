import type { CreateEstadoProcesoInput, EstadoProceso, UpdateEstadoProcesoInput } from "../types"
import { notifyUnauthorizedResponse } from "@/features/auth/unauthorized-session"

const API_BASE_PATH = "/api/mecanica"

export const estadosProcesoApiPaths = {
  estadosProceso: `${API_BASE_PATH}/estados-proceso`,
  estadosProcesoActive: `${API_BASE_PATH}/estados-proceso/activos`,
  estadosProcesoByEmpresa: (empresaId: string) =>
    `${API_BASE_PATH}/empresa/${empresaId}/estados-proceso`,
  estadoProceso: (estadoProcesoId: string) => `${API_BASE_PATH}/estado-proceso/${estadoProcesoId}`,
  buscarEstadoProceso: (codigo: string) =>
    `${API_BASE_PATH}/estados-proceso/buscar?codigo=${encodeURIComponent(codigo)}`,
  createEstadoProceso: `${API_BASE_PATH}/estado-proceso`,
}

export interface EstadosProcesoRequestOptions extends Omit<RequestInit, "body"> {
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

function getErrorMessage(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined
  }

  return readString(payload, ["message", "error", "detail"])
}

function getListData<T>(payload: unknown, keys: string[]) {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (!isRecord(payload)) {
    return []
  }

  const dataRecord = isRecord(payload.data) ? payload.data : undefined
  const candidates = [
    ...keys.map((key) => payload[key]),
    ...keys.map((key) => dataRecord?.[key]),
  ]
  const list = candidates.find(Array.isArray)

  return Array.isArray(list) ? (list as T[]) : []
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

export class EstadosProcesoServiceError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown, fallbackMessage: string) {
    super(getErrorMessage(payload) ?? fallbackMessage)
    this.name = "EstadosProcesoServiceError"
    this.status = status
    this.payload = payload
  }
}

export async function requestEstadosProcesoApi<T>(
  path: string,
  options: EstadosProcesoRequestOptions = {}
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
    throw new EstadosProcesoServiceError(
      response.status,
      payload,
      "No fue posible completar la solicitud de estados de proceso."
    )
  }

  return payload as T
}

export const estadosProcesoService = {
  async listEstadosProceso(options?: EstadosProcesoRequestOptions): Promise<EstadoProceso[]> {
    const payload = await requestEstadosProcesoApi<unknown>(
      estadosProcesoApiPaths.estadosProceso,
      options
    )
    return getListData<EstadoProceso>(payload, ["estados_proceso", "estadosProceso", "data"])
  },

  async listEstadosProcesoActivos(
    options?: EstadosProcesoRequestOptions
  ): Promise<EstadoProceso[]> {
    const payload = await requestEstadosProcesoApi<unknown>(
      estadosProcesoApiPaths.estadosProcesoActive,
      options
    )
    return getListData<EstadoProceso>(payload, ["estados_proceso", "estadosProceso", "data"])
  },

  async listEstadosProcesoByEmpresa(
    empresaId: string,
    options?: EstadosProcesoRequestOptions
  ): Promise<EstadoProceso[]> {
    const payload = await requestEstadosProcesoApi<unknown>(
      estadosProcesoApiPaths.estadosProcesoByEmpresa(empresaId),
      options
    )
    return getListData<EstadoProceso>(payload, ["estados_proceso", "estadosProceso", "data"])
  },

  getEstadoProceso(estadoProcesoId: string, options?: EstadosProcesoRequestOptions) {
    return requestEstadosProcesoApi<EstadoProceso>(
      estadosProcesoApiPaths.estadoProceso(estadoProcesoId),
      options
    )
  },

  buscarEstadoProcesoPorCodigo(codigo: string, options?: EstadosProcesoRequestOptions) {
    return requestEstadosProcesoApi<EstadoProceso>(
      estadosProcesoApiPaths.buscarEstadoProceso(codigo),
      options
    )
  },

  createEstadoProceso(
    input: CreateEstadoProcesoInput,
    options?: EstadosProcesoRequestOptions
  ) {
    return requestEstadosProcesoApi<EstadoProceso>(estadosProcesoApiPaths.createEstadoProceso, {
      ...options,
      method: "POST",
      body: input,
    })
  },

  updateEstadoProceso(
    estadoProcesoId: string,
    input: UpdateEstadoProcesoInput,
    options?: EstadosProcesoRequestOptions
  ) {
    return requestEstadosProcesoApi<EstadoProceso>(
      estadosProcesoApiPaths.estadoProceso(estadoProcesoId),
      {
        ...options,
        method: "PUT",
        body: input,
      }
    )
  },

  deleteEstadoProceso(estadoProcesoId: string, options?: EstadosProcesoRequestOptions) {
    return requestEstadosProcesoApi<unknown>(
      estadosProcesoApiPaths.estadoProceso(estadoProcesoId),
      {
        ...options,
        method: "DELETE",
      }
    )
  },
}
