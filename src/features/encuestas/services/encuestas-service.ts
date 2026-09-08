import type {
  CreateEncuestaPlantillaInput,
  CreateEncuestaPreguntaInput,
  EncuestaPlantilla,
  EncuestaPregunta,
  EncuestaRespuesta,
  UpdateEncuestaPlantillaInput,
  UpdateEncuestaPreguntaInput,
} from "../types"
import { notifyUnauthorizedResponse } from "@/features/auth/unauthorized-session"

const API_BASE_PATH = "/api/mecanica"

export const encuestasApiPaths = {
  plantillas: `${API_BASE_PATH}/encuesta/plantillas`,
  plantillasByEmpresa: (empresaId: string) =>
    `${API_BASE_PATH}/empresa/${empresaId}/encuesta/plantillas`,
  plantillasByEmpresaSucursal: (empresaId: string, sucursalId: string) =>
    `${API_BASE_PATH}/empresa/${empresaId}/sucursal/${sucursalId}/encuesta/plantillas`,
  plantillaActivaByEmpresa: (empresaId: string) =>
    `${API_BASE_PATH}/empresa/${empresaId}/encuesta/plantilla-activa`,
  plantilla: (plantillaId: string) => `${API_BASE_PATH}/encuesta/plantilla/${plantillaId}`,
  createPlantilla: `${API_BASE_PATH}/encuesta/plantilla`,

  preguntas: `${API_BASE_PATH}/encuesta/preguntas`,
  preguntasByPlantilla: (plantillaId: string) =>
    `${API_BASE_PATH}/encuesta/plantilla/${plantillaId}/preguntas`,
  preguntasByEmpresaSucursal: (empresaId: string, sucursalId: string) =>
    `${API_BASE_PATH}/empresa/${empresaId}/sucursal/${sucursalId}/encuesta/preguntas`,
  pregunta: (preguntaId: string) => `${API_BASE_PATH}/encuesta/pregunta/${preguntaId}`,
  createPregunta: `${API_BASE_PATH}/encuesta/pregunta`,

  respuestas: `${API_BASE_PATH}/encuesta/respuestas`,
  respuestasByEmpresa: (empresaId: string) =>
    `${API_BASE_PATH}/empresa/${empresaId}/encuesta/respuestas`,
  respuestasBySucursal: (sucursalId: string) =>
    `${API_BASE_PATH}/sucursal/${sucursalId}/encuesta/respuestas`,
  respuestasByEmpresaSucursal: (empresaId: string, sucursalId: string) =>
    `${API_BASE_PATH}/empresa/${empresaId}/sucursal/${sucursalId}/encuesta/respuestas`,
  respuestasByPlaca: (placa: string) =>
    `${API_BASE_PATH}/encuesta/placa/${encodeURIComponent(placa)}/respuestas`,
  respuesta: (respuestaId: string) => `${API_BASE_PATH}/encuesta/respuesta/${respuestaId}`,
}

export interface EncuestasRequestOptions extends Omit<RequestInit, "body"> {
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

export class EncuestasServiceError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown, fallbackMessage: string) {
    super(getErrorMessage(payload) ?? fallbackMessage)
    this.name = "EncuestasServiceError"
    this.status = status
    this.payload = payload
  }
}

export async function requestEncuestasApi<T>(
  path: string,
  options: EncuestasRequestOptions = {}
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
    credentials: "include",
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: init.cache ?? "no-store",
  })
  const payload = await parseResponseBody(response)

  if (!response.ok) {
    notifyUnauthorizedResponse(response.status, payload)
    throw new EncuestasServiceError(
      response.status,
      payload,
      "No fue posible completar la solicitud de encuestas."
    )
  }

  return payload as T
}

export const encuestasService = {
  async listPlantillasByEmpresa(
    empresaId: string,
    options?: EncuestasRequestOptions
  ): Promise<EncuestaPlantilla[]> {
    const payload = await requestEncuestasApi<unknown>(
      encuestasApiPaths.plantillasByEmpresa(empresaId),
      options
    )
    return getListData<EncuestaPlantilla>(payload, ["plantillas", "data"])
  },

  async listPlantillasByEmpresaSucursal(
    empresaId: string,
    sucursalId: string,
    options?: EncuestasRequestOptions
  ): Promise<EncuestaPlantilla[]> {
    const payload = await requestEncuestasApi<unknown>(
      encuestasApiPaths.plantillasByEmpresaSucursal(empresaId, sucursalId),
      options
    )
    return getListData<EncuestaPlantilla>(payload, ["plantillas", "data"])
  },

  getPlantilla(plantillaId: string, options?: EncuestasRequestOptions) {
    return requestEncuestasApi<EncuestaPlantilla>(
      encuestasApiPaths.plantilla(plantillaId),
      options
    )
  },

  async createPlantilla(input: CreateEncuestaPlantillaInput, options?: EncuestasRequestOptions) {
    const payload = await requestEncuestasApi<{ plantilla: EncuestaPlantilla }>(
      encuestasApiPaths.createPlantilla,
      { ...options, method: "POST", body: input }
    )
    return payload.plantilla
  },

  async updatePlantilla(
    plantillaId: string,
    input: UpdateEncuestaPlantillaInput,
    options?: EncuestasRequestOptions
  ) {
    const payload = await requestEncuestasApi<{ plantilla: EncuestaPlantilla }>(
      encuestasApiPaths.plantilla(plantillaId),
      { ...options, method: "PUT", body: input }
    )
    return payload.plantilla
  },

  deletePlantilla(plantillaId: string, options?: EncuestasRequestOptions) {
    return requestEncuestasApi<unknown>(encuestasApiPaths.plantilla(plantillaId), {
      ...options,
      method: "DELETE",
    })
  },

  async listPreguntasByPlantilla(
    plantillaId: string,
    options?: EncuestasRequestOptions
  ): Promise<EncuestaPregunta[]> {
    const payload = await requestEncuestasApi<unknown>(
      encuestasApiPaths.preguntasByPlantilla(plantillaId),
      options
    )
    return getListData<EncuestaPregunta>(payload, ["preguntas", "data"])
  },

  async listPreguntasByEmpresaSucursal(
    empresaId: string,
    sucursalId: string,
    options?: EncuestasRequestOptions
  ): Promise<EncuestaPregunta[]> {
    const payload = await requestEncuestasApi<unknown>(
      encuestasApiPaths.preguntasByEmpresaSucursal(empresaId, sucursalId),
      options
    )
    return getListData<EncuestaPregunta>(payload, ["preguntas", "data"])
  },

  async createPregunta(input: CreateEncuestaPreguntaInput, options?: EncuestasRequestOptions) {
    const payload = await requestEncuestasApi<{ pregunta: EncuestaPregunta }>(
      encuestasApiPaths.createPregunta,
      { ...options, method: "POST", body: input }
    )
    return payload.pregunta
  },

  async updatePregunta(
    preguntaId: string,
    input: UpdateEncuestaPreguntaInput,
    options?: EncuestasRequestOptions
  ) {
    const payload = await requestEncuestasApi<{ pregunta: EncuestaPregunta }>(
      encuestasApiPaths.pregunta(preguntaId),
      { ...options, method: "PUT", body: input }
    )
    return payload.pregunta
  },

  deletePregunta(preguntaId: string, options?: EncuestasRequestOptions) {
    return requestEncuestasApi<unknown>(encuestasApiPaths.pregunta(preguntaId), {
      ...options,
      method: "DELETE",
    })
  },

  async listRespuestasByEmpresa(
    empresaId: string,
    options?: EncuestasRequestOptions
  ): Promise<EncuestaRespuesta[]> {
    const payload = await requestEncuestasApi<unknown>(
      encuestasApiPaths.respuestasByEmpresa(empresaId),
      options
    )
    return getListData<EncuestaRespuesta>(payload, ["respuestas", "data"])
  },

  async listRespuestasBySucursal(
    sucursalId: string,
    options?: EncuestasRequestOptions
  ): Promise<EncuestaRespuesta[]> {
    const payload = await requestEncuestasApi<unknown>(
      encuestasApiPaths.respuestasBySucursal(sucursalId),
      options
    )
    return getListData<EncuestaRespuesta>(payload, ["respuestas", "data"])
  },

  async listRespuestasByEmpresaSucursal(
    empresaId: string,
    sucursalId: string,
    options?: EncuestasRequestOptions
  ): Promise<EncuestaRespuesta[]> {
    const payload = await requestEncuestasApi<unknown>(
      encuestasApiPaths.respuestasByEmpresaSucursal(empresaId, sucursalId),
      options
    )
    return getListData<EncuestaRespuesta>(payload, ["respuestas", "data"])
  },

  getRespuesta(respuestaId: string, options?: EncuestasRequestOptions) {
    return requestEncuestasApi<EncuestaRespuesta>(
      encuestasApiPaths.respuesta(respuestaId),
      options
    )
  },

  deleteRespuesta(respuestaId: string, options?: EncuestasRequestOptions) {
    return requestEncuestasApi<unknown>(encuestasApiPaths.respuesta(respuestaId), {
      ...options,
      method: "DELETE",
    })
  },
}
