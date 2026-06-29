import type { CreateRolEstadoInput, RolEstado } from "../types"

const API_BASE_PATH = "/api/mecanica"

export const rolEstadosApiPaths = {
  rolEstados: `${API_BASE_PATH}/rol-estados`,
  rolEstado: (rolEstadoId: string) => `${API_BASE_PATH}/rol-estado/${rolEstadoId}`,
  createRolEstado: `${API_BASE_PATH}/rol-estado`,
  rolEstadosByEmpresa: (empresaId: string) =>
    `${API_BASE_PATH}/empresa/${empresaId}/rol-estados`,
  estadosByRol: (rolId: string) => `${API_BASE_PATH}/rol/${rolId}/estados`,
  rolesByEstado: (estadoId: string) => `${API_BASE_PATH}/estado/${estadoId}/roles`,
}

export interface RolEstadosRequestOptions extends Omit<RequestInit, "body"> {
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

function readNestedId(source: JsonRecord, key: string) {
  const value = source[key]
  return isRecord(value) ? readString(value, ["id"]) : undefined
}

function normalizeRolEstado(raw: unknown): RolEstado | undefined {
  if (!isRecord(raw)) {
    return undefined
  }

  const id = readString(raw, ["id"])
  const rolId = readString(raw, ["rol_id", "rolId"]) ?? readNestedId(raw, "rol")
  const estadoId = readString(raw, ["estado_id", "estadoId"]) ?? readNestedId(raw, "estado")

  if (!id || !rolId || !estadoId) {
    return undefined
  }

  return {
    id,
    empresa_id: readString(raw, ["empresa_id", "empresaId"]) ?? "",
    rol_id: rolId,
    estado_id: estadoId,
    creado_en: readString(raw, ["creado_en"]) ?? "",
  }
}

function getErrorMessage(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined
  }

  return readString(payload, ["message", "error", "detail"])
}

function getListData(payload: unknown, keys: string[]) {
  const list = Array.isArray(payload)
    ? payload
    : isRecord(payload)
      ? keys.map((key) => payload[key]).find(Array.isArray)
      : undefined

  return Array.isArray(list)
    ? list.map(normalizeRolEstado).filter((item): item is RolEstado => Boolean(item))
    : []
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

export class RolEstadosServiceError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown, fallbackMessage: string) {
    super(getErrorMessage(payload) ?? fallbackMessage)
    this.name = "RolEstadosServiceError"
    this.status = status
    this.payload = payload
  }
}

export async function requestRolEstadosApi<T>(
  path: string,
  options: RolEstadosRequestOptions = {}
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
    throw new RolEstadosServiceError(
      response.status,
      payload,
      "No fue posible completar la solicitud de estados por rol."
    )
  }

  return payload as T
}

export const rolEstadosService = {
  async listRolEstados(options?: RolEstadosRequestOptions): Promise<RolEstado[]> {
    const payload = await requestRolEstadosApi<unknown>(rolEstadosApiPaths.rolEstados, options)
    return getListData(payload, ["rol_estados", "data"])
  },

  async listRolEstadosByEmpresa(
    empresaId: string,
    options?: RolEstadosRequestOptions
  ): Promise<RolEstado[]> {
    const payload = await requestRolEstadosApi<unknown>(
      rolEstadosApiPaths.rolEstadosByEmpresa(empresaId),
      options
    )
    return getListData(payload, ["rol_estados", "data"])
  },

  async listEstadosByRol(
    rolId: string,
    options?: RolEstadosRequestOptions
  ): Promise<RolEstado[]> {
    const payload = await requestRolEstadosApi<unknown>(
      rolEstadosApiPaths.estadosByRol(rolId),
      options
    )
    return getListData(payload, ["estados", "rol_estados", "data"])
  },

  async listRolesByEstado(
    estadoId: string,
    options?: RolEstadosRequestOptions
  ): Promise<RolEstado[]> {
    const payload = await requestRolEstadosApi<unknown>(
      rolEstadosApiPaths.rolesByEstado(estadoId),
      options
    )
    return getListData(payload, ["roles", "rol_estados", "data"])
  },

  createRolEstado(input: CreateRolEstadoInput, options?: RolEstadosRequestOptions) {
    return requestRolEstadosApi<unknown>(rolEstadosApiPaths.createRolEstado, {
      ...options,
      method: "POST",
      body: input,
    })
  },

  deleteRolEstado(rolEstadoId: string, options?: RolEstadosRequestOptions) {
    return requestRolEstadosApi<unknown>(rolEstadosApiPaths.rolEstado(rolEstadoId), {
      ...options,
      method: "DELETE",
    })
  },
}
