import type { Cliente, ClienteInput } from "../types"

export class ClientesApiError extends Error {}

interface ClientesListResponse {
  clientes: Cliente[]
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
    throw new ClientesApiError(message)
  }

  return payload as T
}

export function fetchClientes() {
  return request<ClientesListResponse>("/api/clientes")
}

export function fetchCliente(id: string) {
  return request<Cliente>(`/api/clientes/${id}`)
}

export function createCliente(input: ClienteInput) {
  return request<Cliente>("/api/clientes", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateCliente(id: string, input: Partial<ClienteInput>) {
  return request<Cliente>(`/api/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteCliente(id: string) {
  return request<{ message: string }>(`/api/clientes/${id}`, {
    method: "DELETE",
  })
}
