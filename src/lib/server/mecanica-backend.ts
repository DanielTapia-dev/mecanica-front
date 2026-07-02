import { NextResponse } from "next/server"
import {
  AUTH_TOKEN_COOKIE_NAME,
  AUTH_USER_COOKIE_NAME,
  readCookieHeader,
} from "@/features/auth/session-cookies"

const DEFAULT_BACKEND_URL = "http://localhost:8011"

function getBackendUrl(path: string) {
  const backendUrl = process.env.MECANICA_BACKEND_URL ?? DEFAULT_BACKEND_URL
  return new URL(path, backendUrl).toString()
}

async function parseResponseBody(response: Response) {
  const body = await response.text()

  if (!body) {
    return null
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    return { message: body }
  }
}

export async function proxyToMecanicaBackend(
  request: Request,
  backendPath: string,
  method: "GET" | "POST" | "PUT" | "DELETE"
) {
  const sessionToken = readCookieHeader(
    request.headers.get("cookie"),
    AUTH_TOKEN_COOKIE_NAME
  )
  const authorization =
    request.headers.get("authorization") ??
    (sessionToken ? `Bearer ${sessionToken}` : undefined)
  const hasBody = method === "POST" || method === "PUT"

  let backendResponse: Response

  try {
    backendResponse = await fetch(getBackendUrl(backendPath), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { message: "No fue posible conectar con el backend de mecanica." },
      { status: 502 }
    )
  }

  const payload = await parseResponseBody(backendResponse)

  const response = NextResponse.json(payload, { status: backendResponse.status })

  if (backendResponse.status === 401 || backendResponse.status === 403) {
    response.cookies.delete(AUTH_TOKEN_COOKIE_NAME)
    response.cookies.delete(AUTH_USER_COOKIE_NAME)
  }

  return response
}
