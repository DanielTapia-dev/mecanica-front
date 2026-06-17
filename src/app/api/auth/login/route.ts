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

function readRoles(source: JsonRecord) {
  const roles = source.roles

  if (Array.isArray(roles)) {
    const normalizedRoles = roles
      .map((role): JsonRecord | undefined => {
        if (typeof role === "string" && role.trim()) {
          return {
            codigo: role.trim().toUpperCase(),
            nombre: role.trim(),
          }
        }

        if (!isRecord(role)) {
          return undefined
        }

        const codigo = readString(role, ["codigo", "code", "role", "rol"])

        if (!codigo) {
          return undefined
        }

        return {
          codigo: codigo.toUpperCase(),
          nombre: readString(role, ["nombre", "name"]) ?? codigo,
          tipo_rol: readString(role, ["tipo_rol", "type"]),
        }
      })
      .filter((role): role is JsonRecord => Boolean(role))

    if (normalizedRoles.length > 0) {
      return normalizedRoles
    }
  }

  const singleRole = readString(source, ["role", "rol", "perfil"])
  if (singleRole) {
    return [
      {
        codigo: singleRole.toUpperCase(),
        nombre: singleRole,
      },
    ]
  }

  return []
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
  const nombre = readString(userRecord, ["nombre"])
  const apellido = readString(userRecord, ["apellido"])
  const fullName =
    readString(userRecord, ["name", "fullName", "full_name"]) ??
    [nombre, apellido].filter(Boolean).join(" ")

  return NextResponse.json({
    token,
    user: {
      id: readString(userRecord, ["id"]),
      empresaId: readString(userRecord, ["empresa_id", "empresaId"]),
      sucursalId: readString(userRecord, ["sucursal_id", "sucursalId"]),
      email: readString(userRecord, ["email", "correo"]) ?? email,
      username: readString(userRecord, ["username", "usuario"]) ?? email,
      name: fullName || email,
      roles: readRoles(userRecord),
    },
  })
}
