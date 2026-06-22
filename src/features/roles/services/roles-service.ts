import type { CreateRoleInput, Role, UpdateRoleInput } from "../types"

const API_BASE_PATH = "/api/mecanica"

export const rolesApiPaths = {
  roles: `${API_BASE_PATH}/roles`,
  rol: (rolId: string) => `${API_BASE_PATH}/rol/${rolId}`,
  createRol: `${API_BASE_PATH}/rol`,
}

export interface RolesRequestOptions extends Omit<RequestInit, "body"> {
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

  const candidates = keys.map((key) => payload[key])
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

export class RolesServiceError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown, fallbackMessage: string) {
    super(getErrorMessage(payload) ?? fallbackMessage)
    this.name = "RolesServiceError"
    this.status = status
    this.payload = payload
  }
}

export async function requestRolesApi<T>(path: string, options: RolesRequestOptions = {}) {
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
    throw new RolesServiceError(
      response.status,
      payload,
      "No fue posible completar la solicitud de roles."
    )
  }

  return payload as T
}

export const rolesService = {
  async listRoles(options?: RolesRequestOptions): Promise<Role[]> {
    const payload = await requestRolesApi<unknown>(rolesApiPaths.roles, options)
    return getListData<Role>(payload, ["roles", "data"])
  },

  getRole(rolId: string, options?: RolesRequestOptions) {
    return requestRolesApi<Role>(rolesApiPaths.rol(rolId), options)
  },

  createRole(input: CreateRoleInput, options?: RolesRequestOptions) {
    return requestRolesApi<Role>(rolesApiPaths.createRol, {
      ...options,
      method: "POST",
      body: input,
    })
  },

  updateRole(rolId: string, input: UpdateRoleInput, options?: RolesRequestOptions) {
    return requestRolesApi<Role>(rolesApiPaths.rol(rolId), {
      ...options,
      method: "PUT",
      body: input,
    })
  },

  deleteRole(rolId: string, options?: RolesRequestOptions) {
    return requestRolesApi<unknown>(rolesApiPaths.rol(rolId), {
      ...options,
      method: "DELETE",
    })
  },
}