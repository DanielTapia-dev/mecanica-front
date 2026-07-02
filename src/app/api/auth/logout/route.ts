import { NextResponse } from "next/server"
import {
  AUTH_TOKEN_COOKIE_NAME,
  AUTH_USER_COOKIE_NAME,
  getAuthCookieOptions,
} from "@/features/auth/session-cookies"

export function POST() {
  const response = NextResponse.json({ success: true })

  response.cookies.set(AUTH_TOKEN_COOKIE_NAME, "", getAuthCookieOptions(0))
  response.cookies.set(AUTH_USER_COOKIE_NAME, "", getAuthCookieOptions(0))

  return response
}
