import type { CreateEncuestaRespuestaInput, EncuestaFormularioResponse, EncuestaRespuesta } from "../types"

const API_BASE_PATH = "/api/mecanica"

export class EncuestaPublicaApiError extends Error {}

async function parseJson(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      "No fue posible completar la solicitud de la encuesta."
    throw new EncuestaPublicaApiError(message)
  }

  return payload as T
}

export function fetchFormularioPorOrden(ordenId: string) {
  return request<EncuestaFormularioResponse>(
    `${API_BASE_PATH}/encuesta/orden/${encodeURIComponent(ordenId)}/formulario`
  )
}

export function submitEncuestaRespuesta(input: CreateEncuestaRespuestaInput) {
  return request<{ respuesta: EncuestaRespuesta }>(`${API_BASE_PATH}/encuesta/respuesta`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}
