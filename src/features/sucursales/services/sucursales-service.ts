import type { Sucursal, SucursalInput } from "../types"
import { notifyUnauthorizedResponse } from "@/features/auth/unauthorized-session"

export class SucursalesApiError extends Error {}

interface SucursalesListResponse {
  sucursales: Sucursal[]
}

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
    notifyUnauthorizedResponse(response.status, payload)
    const message =
      (payload as { message?: string } | null)?.message ??
      "No fue posible completar la solicitud."
    throw new SucursalesApiError(message)
  }

  return payload as T
}

export function fetchSucursales() {
  return request<SucursalesListResponse>("/api/sucursales")
}

export function fetchSucursal(id: string) {
  return request<Sucursal>(`/api/sucursales/${id}`)
}

export function createSucursal(input: SucursalInput) {
  return request<Sucursal>("/api/sucursales", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateSucursal(id: string, input: Partial<SucursalInput>) {
  return request<Sucursal>(`/api/sucursales/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteSucursal(id: string) {
  return request<{ message: string }>(`/api/sucursales/${id}`, {
    method: "DELETE",
  })
}
