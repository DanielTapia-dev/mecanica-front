import type { Vehiculo, VehiculoInput } from "../types"

export class VehiculosApiError extends Error {}

interface VehiculosListResponse {
  vehiculos: Vehiculo[]
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
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
      ...getAuthHeaders(),
    },
    cache: "no-store",
  })

  const payload = await parseJson(response)

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ??
      "No fue posible completar la solicitud."
    throw new VehiculosApiError(message)
  }

  return payload as T
}

export function fetchVehiculos() {
  return request<VehiculosListResponse>("/api/vehiculos")
}

export function fetchVehiculo(id: string) {
  return request<Vehiculo>(`/api/vehiculos/${id}`)
}

export function createVehiculo(input: VehiculoInput) {
  return request<Vehiculo>("/api/vehiculos", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateVehiculo(id: string, input: Partial<VehiculoInput>) {
  return request<Vehiculo>(`/api/vehiculos/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteVehiculo(id: string) {
  return request<{ message: string }>(`/api/vehiculos/${id}`, {
    method: "DELETE",
  })
}
