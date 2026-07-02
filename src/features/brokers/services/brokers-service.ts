import type { Broker, BrokerInput } from "../types"
import { notifyUnauthorizedResponse } from "@/features/auth/unauthorized-session"

const API_BASE_PATH = "/api/mecanica"

export const brokersApiPaths = {
  brokers: `${API_BASE_PATH}/brokers`,
  brokersActive: `${API_BASE_PATH}/brokers/activos`,
  brokersByEmpresa: (empresaId: string) => `${API_BASE_PATH}/empresa/${empresaId}/brokers`,
  broker: (brokerId: string) => `${API_BASE_PATH}/broker/${brokerId}`,
  createBroker: `${API_BASE_PATH}/broker`,
  brokerActivo: (brokerId: string) => `${API_BASE_PATH}/broker/${brokerId}/activo`,
}

export interface BrokersRequestOptions extends Omit<RequestInit, "body"> {
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
    payload.data,
  ]
  const list = candidates.find(Array.isArray)

  return Array.isArray(list) ? (list as T[]) : []
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

function normalizeBroker(payload: unknown): Broker | undefined {
  const broker = normalizeObjectResult<unknown>(payload, ["broker"])

  if (!isRecord(broker)) {
    return undefined
  }

  const id = readString(broker, ["id", "broker_id", "brokerId"])
  const empresaId = readString(broker, ["empresa_id", "empresaId"])
  const nombre = readString(broker, ["nombre", "name"])

  if (!id || !empresaId || !nombre) {
    return undefined
  }

  return {
    ...(broker as unknown as Broker),
    id,
    empresa_id: empresaId,
    nombre,
    ruc: readString(broker, ["ruc"]) ?? null,
    telefono: readString(broker, ["telefono", "phone"]) ?? null,
    email: readString(broker, ["email", "correo"]) ?? null,
    direccion: readString(broker, ["direccion", "address"]) ?? null,
    activo: readBoolean(broker, ["activo", "active"]) ?? true,
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

export class BrokersServiceError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown, fallbackMessage: string) {
    super(getErrorMessage(payload) ?? fallbackMessage)
    this.name = "BrokersServiceError"
    this.status = status
    this.payload = payload
  }
}

export async function requestBrokersApi<T>(
  path: string,
  options: BrokersRequestOptions = {}
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
    throw new BrokersServiceError(
      response.status,
      payload,
      "No fue posible completar la solicitud de brokers."
    )
  }

  return payload as T
}

export const brokersService = {
  async listBrokers(options?: BrokersRequestOptions): Promise<Broker[]> {
    const payload = await requestBrokersApi<unknown>(brokersApiPaths.brokers, options)
    return getListData<unknown>(payload, ["brokers", "data"])
      .map((broker) => normalizeBroker(broker))
      .filter((broker): broker is Broker => Boolean(broker))
  },

  async listBrokersActivos(options?: BrokersRequestOptions): Promise<Broker[]> {
    const payload = await requestBrokersApi<unknown>(brokersApiPaths.brokersActive, options)
    return getListData<unknown>(payload, ["brokers", "data"])
      .map((broker) => normalizeBroker(broker))
      .filter((broker): broker is Broker => Boolean(broker))
  },

  async listBrokersByEmpresa(
    empresaId: string,
    options?: BrokersRequestOptions
  ): Promise<Broker[]> {
    const payload = await requestBrokersApi<unknown>(
      brokersApiPaths.brokersByEmpresa(empresaId),
      options
    )
    return getListData<unknown>(payload, ["brokers", "data"])
      .map((broker) => normalizeBroker(broker))
      .filter((broker): broker is Broker => Boolean(broker))
  },

  getBroker(brokerId: string, options?: BrokersRequestOptions) {
    return requestBrokersApi<unknown>(brokersApiPaths.broker(brokerId), options).then(
      (payload) => normalizeBroker(payload) ?? normalizeObjectResult<Broker>(payload, ["broker"])
    )
  },

  createBroker(input: BrokerInput, options?: BrokersRequestOptions) {
    return requestBrokersApi<unknown>(brokersApiPaths.createBroker, {
      ...options,
      method: "POST",
      body: input,
    }).then(
      (payload) => normalizeBroker(payload) ?? normalizeObjectResult<Broker>(payload, ["broker"])
    )
  },

  updateBroker(
    brokerId: string,
    input: Partial<BrokerInput>,
    options?: BrokersRequestOptions
  ) {
    return requestBrokersApi<unknown>(brokersApiPaths.broker(brokerId), {
      ...options,
      method: "PUT",
      body: input,
    }).then(
      (payload) => normalizeBroker(payload) ?? normalizeObjectResult<Broker>(payload, ["broker"])
    )
  },

  updateBrokerActivo(
    brokerId: string,
    activo: boolean,
    options?: BrokersRequestOptions
  ) {
    return requestBrokersApi<unknown>(brokersApiPaths.brokerActivo(brokerId), {
      ...options,
      method: "PUT",
      body: { activo },
    }).then(
      (payload) => normalizeBroker(payload) ?? normalizeObjectResult<Broker>(payload, ["broker"])
    )
  },

  deleteBroker(brokerId: string, options?: BrokersRequestOptions) {
    return requestBrokersApi<unknown>(brokersApiPaths.broker(brokerId), {
      ...options,
      method: "DELETE",
    })
  },
}
