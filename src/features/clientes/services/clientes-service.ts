import type { Cliente } from "../types"
import { notifyUnauthorizedResponse } from "@/features/auth/unauthorized-session"

export class ClientesApiError extends Error {}

interface ClientesListResponse {
  clientes: Cliente[]
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
    throw new ClientesApiError(message)
  }

  return payload as T
}

export function fetchClientes() {
  return request<ClientesListResponse>("/api/clientes")
}
