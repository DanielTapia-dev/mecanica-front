import { NextResponse } from "next/server"
import { isAuthUser } from "@/features/auth/auth-validation"
import {
  AUTH_USER_COOKIE_NAME,
  decodeAuthUserCookie,
  readCookieHeader,
} from "@/features/auth/session-cookies"

export function GET(request: Request) {
  const user = decodeAuthUserCookie(
    readCookieHeader(request.headers.get("cookie"), AUTH_USER_COOKIE_NAME)
  )

  if (!isAuthUser(user)) {
    return NextResponse.json(
      { message: "No hay una sesion activa." },
      { status: 401 }
    )
  }

  return NextResponse.json({ user })
}
