import type { Empresa, EmpresaInput } from "../types"

export class EmpresasApiError extends Error {}

interface EmpresasListResponse {
  empresas: Empresa[]
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
    throw new EmpresasApiError(message)
  }

  return payload as T
}

export function fetchEmpresas() {
  return request<EmpresasListResponse>("/api/empresas")
}

export function fetchEmpresa(id: string) {
  return request<Empresa>(`/api/empresas/${id}`)
}

export function createEmpresa(input: EmpresaInput) {
  return request<Empresa>("/api/empresas", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateEmpresa(id: string, input: Partial<EmpresaInput>) {
  return request<Empresa>(`/api/empresas/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function deleteEmpresa(id: string) {
  return request<{ message: string }>(`/api/empresas/${id}`, {
    method: "DELETE",
  })
}
