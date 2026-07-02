import type { AuthUser } from "./types"

export const AUTH_TOKEN_COOKIE_NAME = "mecanica_auth_token"
export const AUTH_USER_COOKIE_NAME = "mecanica_auth_user"
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12

export function getAuthCookieOptions(maxAge = AUTH_COOKIE_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

export function encodeAuthUserCookie(user: AuthUser) {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url")
}

export function decodeAuthUserCookie(value?: string) {
  if (!value) {
    return undefined
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown
  } catch {
    return undefined
  }
}

export function readCookieHeader(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return undefined
  }

  const prefix = `${name}=`
  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))

  if (!cookie) {
    return undefined
  }

  try {
    return decodeURIComponent(cookie.slice(prefix.length))
  } catch {
    return undefined
  }
}
