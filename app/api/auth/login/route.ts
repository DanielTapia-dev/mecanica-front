import { NextResponse } from "next/server"

const DEFAULT_BACKEND_URL = "http://localhost:8011"
const LOGIN_PATH = "/api/mecanica/login"

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

function normalizeRole(role: string | undefined) {
  const normalizedRole = role?.toLowerCase()

  if (normalizedRole === "admin" || normalizedRole === "administrador") {
    return "admin"
  }

  if (normalizedRole === "supervisor") {
    return "supervisor"
  }

  return "tecnico"
}

function getBackendLoginUrl() {
  const backendUrl = process.env.MECANICA_BACKEND_URL ?? DEFAULT_BACKEND_URL
  return new URL(LOGIN_PATH, backendUrl).toString()
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

function getMessage(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined
  }

  return readString(payload, ["message", "error", "detail"])
}

export async function POST(request: Request) {
  let credentials: unknown

  try {
    credentials = await request.json()
  } catch {
    return NextResponse.json(
      { message: "La solicitud no tiene un JSON valido." },
      { status: 400 }
    )
  }

  if (!isRecord(credentials)) {
    return NextResponse.json(
      { message: "La solicitud no tiene credenciales validas." },
      { status: 400 }
    )
  }

  const email = readString(credentials, ["email"])
  const password = readString(credentials, ["password"])

  if (!email || !password) {
    return NextResponse.json(
      { message: "Ingresa correo y contrasena." },
      { status: 400 }
    )
  }

  let backendResponse: Response

  try {
    backendResponse = await fetch(getBackendLoginUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { message: "No fue posible conectar con el backend de pruebas." },
      { status: 502 }
    )
  }

  const payload = await parseResponseBody(backendResponse)

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: getMessage(payload) ?? "Correo o contrasena incorrectos." },
      { status: backendResponse.status }
    )
  }

  const payloadRecord = isRecord(payload) ? payload : {}
  const dataRecord = isRecord(payloadRecord.data) ? payloadRecord.data : payloadRecord
  const userRecord = isRecord(dataRecord.user)
    ? dataRecord.user
    : isRecord(dataRecord.usuario)
      ? dataRecord.usuario
      : dataRecord
  const token =
    readString(dataRecord, ["token", "accessToken", "access_token", "jwt"]) ??
    readString(payloadRecord, ["token", "accessToken", "access_token", "jwt"])

  return NextResponse.json({
    token,
    user: {
      email: readString(userRecord, ["email", "correo"]) ?? email,
      username: readString(userRecord, ["username", "usuario"]) ?? email,
      name:
        readString(userRecord, ["name", "nombre", "fullName", "full_name"]) ??
        email,
      role: normalizeRole(readString(userRecord, ["role", "rol", "perfil"])),
    },
  })
}
