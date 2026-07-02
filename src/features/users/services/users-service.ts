import type { CreateUsuarioInput, Role, UpdateUsuarioInput, Usuario } from "../types"
import { notifyUnauthorizedResponse } from "@/features/auth/unauthorized-session"

const API_BASE_PATH = "/api/mecanica"

export const usersApiPaths = {
  usuarios: `${API_BASE_PATH}/usuarios`,
  usuario: (usuarioId: string) => `${API_BASE_PATH}/usuario/${usuarioId}`,
  createUsuario: `${API_BASE_PATH}/usuario`,
  roles: `${API_BASE_PATH}/roles`,
}

export interface UsersRequestOptions extends Omit<RequestInit, "body"> {
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

export class UsersServiceError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown, fallbackMessage: string) {
    super(getErrorMessage(payload) ?? fallbackMessage)
    this.name = "UsersServiceError"
    this.status = status
    this.payload = payload
  }
}

export async function requestUsersApi<T>(path: string, options: UsersRequestOptions = {}) {
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
    throw new UsersServiceError(
      response.status,
      payload,
      "No fue posible completar la solicitud de usuarios."
    )
  }

  return payload as T
}

export const usersService = {
  async listUsuarios(options?: UsersRequestOptions): Promise<Usuario[]> {
    const payload = await requestUsersApi<unknown>(usersApiPaths.usuarios, options)
    return getListData<Usuario>(payload, ["usuarios", "data"])
  },

  getUsuario(usuarioId: string, options?: UsersRequestOptions) {
    return requestUsersApi<Usuario>(usersApiPaths.usuario(usuarioId), options)
  },

  createUsuario(input: CreateUsuarioInput, options?: UsersRequestOptions) {
    return requestUsersApi<Usuario>(usersApiPaths.createUsuario, {
      ...options,
      method: "POST",
      body: input,
    })
  },

  updateUsuario(usuarioId: string, input: UpdateUsuarioInput, options?: UsersRequestOptions) {
    return requestUsersApi<Usuario>(usersApiPaths.usuario(usuarioId), {
      ...options,
      method: "PUT",
      body: input,
    })
  },

  deleteUsuario(usuarioId: string, options?: UsersRequestOptions) {
    return requestUsersApi<unknown>(usersApiPaths.usuario(usuarioId), {
      ...options,
      method: "DELETE",
    })
  },

  async listRoles(options?: UsersRequestOptions): Promise<Role[]> {
    const payload = await requestUsersApi<unknown>(usersApiPaths.roles, options)
    return getListData<Role>(payload, ["roles", "data"])
  },
}
