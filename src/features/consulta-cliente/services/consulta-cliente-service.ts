import type { SeguimientoOrdenResponse } from "../types"

export class ConsultaClienteApiError extends Error {}

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

export async function fetchSeguimientoPorPlaca(placa: string) {
  const response = await fetch(
    `/api/consulta-cliente/${encodeURIComponent(placa)}`,
    { cache: "no-store" }
  )
  const payload = await parseJson(response)

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      "No fue posible consultar el estado del vehículo."
    throw new ConsultaClienteApiError(message)
  }

  return payload as SeguimientoOrdenResponse
}

export async function fetchLogoPublico() {
  try {
    const response = await fetch("/api/consulta-cliente/logo", { cache: "no-store" })
    const payload = await parseJson(response)

    if (!response.ok) {
      return null
    }

    return (payload as { logo_base64?: string | null } | null)?.logo_base64 ?? null
  } catch {
    return null
  }
}
