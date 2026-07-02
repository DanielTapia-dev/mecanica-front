import type { Aseguradora, AseguradoraInput } from "../types"
import { notifyUnauthorizedResponse } from "@/features/auth/unauthorized-session"

const API_BASE_PATH = "/api/mecanica"

export const aseguradorasApiPaths = {
  aseguradoras: `${API_BASE_PATH}/aseguradoras`,
  aseguradorasActive: `${API_BASE_PATH}/aseguradoras/activas`,
  aseguradorasByEmpresa: (empresaId: string) =>
    `${API_BASE_PATH}/empresa/${empresaId}/aseguradoras`,
  aseguradora: (aseguradoraId: string) => `${API_BASE_PATH}/aseguradora/${aseguradoraId}`,
  createAseguradora: `${API_BASE_PATH}/aseguradora`,
  aseguradoraActivo: (aseguradoraId: string) =>
    `${API_BASE_PATH}/aseguradora/${aseguradoraId}/activo`,
}

export interface AseguradorasRequestOptions extends Omit<RequestInit, "body"> {
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

function normalizeAseguradora(payload: unknown): Aseguradora | undefined {
  const aseguradora = normalizeObjectResult<unknown>(payload, ["aseguradora"])

  if (!isRecord(aseguradora)) {
    return undefined
  }

  const id = readString(aseguradora, [
    "id",
    "aseguradora_id",
    "aseguradoraId",
    "compania_seguros_id",
    "companiaSegurosId",
  ])
  const empresaId = readString(aseguradora, ["empresa_id", "empresaId"])
  const nombre = readString(aseguradora, ["nombre", "name"])

  if (!id || !empresaId || !nombre) {
    return undefined
  }

  return {
    ...(aseguradora as unknown as Aseguradora),
    id,
    empresa_id: empresaId,
    nombre,
    ruc: readString(aseguradora, ["ruc"]) ?? null,
    telefono: readString(aseguradora, ["telefono", "phone"]) ?? null,
    email: readString(aseguradora, ["email", "correo"]) ?? null,
    direccion: readString(aseguradora, ["direccion", "address"]) ?? null,
    activo: readBoolean(aseguradora, ["activo", "active"]) ?? true,
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

export class AseguradorasServiceError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown, fallbackMessage: string) {
    super(getErrorMessage(payload) ?? fallbackMessage)
    this.name = "AseguradorasServiceError"
    this.status = status
    this.payload = payload
  }
}

export async function requestAseguradorasApi<T>(
  path: string,
  options: AseguradorasRequestOptions = {}
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
    throw new AseguradorasServiceError(
      response.status,
      payload,
      "No fue posible completar la solicitud de aseguradoras."
    )
  }

  return payload as T
}

export const aseguradorasService = {
  async listAseguradoras(options?: AseguradorasRequestOptions): Promise<Aseguradora[]> {
    const payload = await requestAseguradorasApi<unknown>(
      aseguradorasApiPaths.aseguradoras,
      options
    )
    return getListData<unknown>(payload, ["aseguradoras", "data"])
      .map((aseguradora) => normalizeAseguradora(aseguradora))
      .filter((aseguradora): aseguradora is Aseguradora => Boolean(aseguradora))
  },

  async listAseguradorasActivas(
    options?: AseguradorasRequestOptions
  ): Promise<Aseguradora[]> {
    const payload = await requestAseguradorasApi<unknown>(
      aseguradorasApiPaths.aseguradorasActive,
      options
    )
    return getListData<unknown>(payload, ["aseguradoras", "data"])
      .map((aseguradora) => normalizeAseguradora(aseguradora))
      .filter((aseguradora): aseguradora is Aseguradora => Boolean(aseguradora))
  },

  async listAseguradorasByEmpresa(
    empresaId: string,
    options?: AseguradorasRequestOptions
  ): Promise<Aseguradora[]> {
    const payload = await requestAseguradorasApi<unknown>(
      aseguradorasApiPaths.aseguradorasByEmpresa(empresaId),
      options
    )
    return getListData<unknown>(payload, ["aseguradoras", "data"])
      .map((aseguradora) => normalizeAseguradora(aseguradora))
      .filter((aseguradora): aseguradora is Aseguradora => Boolean(aseguradora))
  },

  getAseguradora(aseguradoraId: string, options?: AseguradorasRequestOptions) {
    return requestAseguradorasApi<unknown>(
      aseguradorasApiPaths.aseguradora(aseguradoraId),
      options
    ).then(
      (payload) =>
        normalizeAseguradora(payload) ??
        normalizeObjectResult<Aseguradora>(payload, ["aseguradora"])
    )
  },

  createAseguradora(input: AseguradoraInput, options?: AseguradorasRequestOptions) {
    return requestAseguradorasApi<unknown>(aseguradorasApiPaths.createAseguradora, {
      ...options,
      method: "POST",
      body: input,
    }).then(
      (payload) =>
        normalizeAseguradora(payload) ??
        normalizeObjectResult<Aseguradora>(payload, ["aseguradora"])
    )
  },

  updateAseguradora(
    aseguradoraId: string,
    input: Partial<AseguradoraInput>,
    options?: AseguradorasRequestOptions
  ) {
    return requestAseguradorasApi<unknown>(
      aseguradorasApiPaths.aseguradora(aseguradoraId),
      {
        ...options,
        method: "PUT",
        body: input,
      }
    ).then(
      (payload) =>
        normalizeAseguradora(payload) ??
        normalizeObjectResult<Aseguradora>(payload, ["aseguradora"])
    )
  },

  updateAseguradoraActivo(
    aseguradoraId: string,
    activo: boolean,
    options?: AseguradorasRequestOptions
  ) {
    return requestAseguradorasApi<unknown>(
      aseguradorasApiPaths.aseguradoraActivo(aseguradoraId),
      {
        ...options,
        method: "PUT",
        body: { activo },
      }
    ).then(
      (payload) =>
        normalizeAseguradora(payload) ??
        normalizeObjectResult<Aseguradora>(payload, ["aseguradora"])
    )
  },

  deleteAseguradora(aseguradoraId: string, options?: AseguradorasRequestOptions) {
    return requestAseguradorasApi<unknown>(
      aseguradorasApiPaths.aseguradora(aseguradoraId),
      {
        ...options,
        method: "DELETE",
      }
    )
  },
}
