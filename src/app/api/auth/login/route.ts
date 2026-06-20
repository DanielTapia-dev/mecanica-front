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

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }
  return undefined
}

function readNestedId(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]

    if (isRecord(value)) {
      const id = readString(value, ["id", "uuid", "codigo"])

      if (id) {
        return id
      }
    }
  }

  return undefined
}

function normalizeRoleCode(roleCode: string) {
  const normalizedRole = roleCode
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  if (["ADMINISTRADOR", "ADMINISTRACION"].includes(normalizedRole)) {
    return "ADMIN"
  }

  if (["RECEPCION", "RECEPCIONISTA"].includes(normalizedRole)) {
    return "RECEPCION"
  }

  return normalizedRole
}

function readRoles(source: JsonRecord) {
  const roles = source.roles

  if (Array.isArray(roles)) {
    const normalizedRoles = roles
      .map((role): JsonRecord | undefined => {
        if (typeof role === "string" && role.trim()) {
          const codigo = normalizeRoleCode(role)

          return {
            codigo,
            nombre: role.trim(),
          }
        }

        if (!isRecord(role)) {
          return undefined
        }

        const roleSource = isRecord(role.rol)
          ? role.rol
          : isRecord(role.role)
            ? role.role
            : role
        const rawCode = readString(roleSource, ["codigo", "code", "role", "rol", "nombre"])

        if (!rawCode) {
          return undefined
        }

        const codigo = normalizeRoleCode(rawCode)

        return {
          codigo,
          nombre: readString(roleSource, ["nombre", "name"]) ?? rawCode,
          tipo_rol: readString(roleSource, ["tipo_rol", "type"]),
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
        codigo: normalizeRoleCode(singleRole),
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
  const empresaId =
    readString(userRecord, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readString(dataRecord, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readString(payloadRecord, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readNestedId(userRecord, ["empresa"]) ??
    readNestedId(dataRecord, ["empresa"])
  const sucursalId =
    readString(userRecord, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readString(dataRecord, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readString(payloadRecord, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readNestedId(userRecord, ["sucursal"]) ??
    readNestedId(dataRecord, ["sucursal"])
  const roles = [
    readRoles(userRecord),
    readRoles(dataRecord),
    readRoles(payloadRecord),
  ].find((items) => items.length > 0) ?? []

  return NextResponse.json({
    token,
    user: {
      id: readString(userRecord, ["id"]),
      empresaId,
      empresa_id: empresaId,
      sucursalId,
      sucursal_id: sucursalId,
      email: readString(userRecord, ["email", "correo"]) ?? email,
      username: readString(userRecord, ["username", "usuario"]) ?? email,
      name: fullName || email,
      roles,
    },
  })
}
