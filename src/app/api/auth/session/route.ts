import { NextResponse } from "next/server"
import { isAuthUser } from "@/features/auth/auth-validation"
import {
  AUTH_TOKEN_COOKIE_NAME,
  AUTH_USER_COOKIE_NAME,
  decodeAuthUserCookie,
  readCookieHeader,
} from "@/features/auth/session-cookies"

export function GET(request: Request) {
  const token = readCookieHeader(
    request.headers.get("cookie"),
    AUTH_TOKEN_COOKIE_NAME
  )
  const user = decodeAuthUserCookie(
    readCookieHeader(request.headers.get("cookie"), AUTH_USER_COOKIE_NAME)
  )

  if (!token || !isAuthUser(user)) {
    const response = NextResponse.json(
      { message: "No hay una sesion activa." },
      { status: 401 }
    )

    response.cookies.delete(AUTH_TOKEN_COOKIE_NAME)
    response.cookies.delete(AUTH_USER_COOKIE_NAME)
    return response
  }

  return NextResponse.json({ user })
}
