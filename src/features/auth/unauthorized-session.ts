export const AUTH_UNAUTHORIZED_EVENT = "mecanica:auth-unauthorized"

let hasNotifiedUnauthorizedSession = false

function getPayloadMessage(payload: unknown) {
  if (typeof payload === "string") {
    return payload
  }

  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return ""
  }

  const record = payload as Record<string, unknown>
  const value = record.message ?? record.error ?? record.detail

  return typeof value === "string" ? value : ""
}

export function isUnauthorizedStatus(status: number, payload?: unknown) {
  if (status === 401) {
    return true
  }

  if (status !== 403) {
    return false
  }

  const message = getPayloadMessage(payload).toLowerCase()

  if (!message) {
    return true
  }

  return /token|jwt|sesion|session|auth|autoriz|credencial|expir/.test(message)
}

export function clearLegacyAuthStorage() {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem("auth_user")
  localStorage.removeItem("auth_token")
}

export function resetUnauthorizedSessionNotification() {
  hasNotifiedUnauthorizedSession = false
}

export function notifyUnauthorizedResponse(status: number, payload?: unknown) {
  if (!isUnauthorizedStatus(status, payload) || typeof window === "undefined") {
    return
  }

  if (hasNotifiedUnauthorizedSession) {
    return
  }

  hasNotifiedUnauthorizedSession = true
  window.dispatchEvent(
    new CustomEvent(AUTH_UNAUTHORIZED_EVENT, {
      detail: { status },
    })
  )
}
