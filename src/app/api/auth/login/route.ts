import { NextResponse } from "next/server"
import {
  AUTH_TOKEN_COOKIE_NAME,
  AUTH_USER_COOKIE_NAME,
  encodeAuthUserCookie,
  getAuthCookieOptions,
} from "@/features/auth/session-cookies"
import { normalizeRoleCode } from "@/features/auth/role-normalization"
import type { AuthRole, AuthUser } from "@/features/auth/types"

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

function readNestedField(source: JsonRecord, keys: string[], fields: string[]) {
  for (const key of keys) {
    const value = source[key]

    if (isRecord(value)) {
      const result = readString(value, fields)

      if (result) {
        return result
      }
    }
  }

  return undefined
}

function readJwtPayload(token?: string) {
  if (!token) {
    return undefined
  }

  const [, payload] = token.split(".")

  if (!payload) {
    return undefined
  }

  try {
    const parsedPayload = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as unknown

    return isRecord(parsedPayload) ? parsedPayload : undefined
  } catch {
    return undefined
  }
}

function readSingleRoleObject(source: JsonRecord, key: string): AuthRole | undefined {
  const value = source[key]

  if (!isRecord(value)) {
    return undefined
  }

  const rawCode = readString(value, ["codigo", "code", "role", "rol", "nombre"])

  if (!rawCode) {
    return undefined
  }

  return {
    id: readString(value, ["id", "rol_id", "rolId", "role_id", "roleId"]),
    rol_id: readString(value, ["id", "rol_id", "rolId", "role_id", "roleId"]),
    codigo: normalizeRoleCode(rawCode),
    nombre: readString(value, ["nombre", "name"]) ?? rawCode,
    tipo_rol: readString(value, ["tipo_rol", "type"]),
  }
}

function readRoles(source: JsonRecord): AuthRole[] {
  const roles = [
    source.roles,
    source.usuario_roles,
    source.usuarioRoles,
    source.user_roles,
    source.userRoles,
    source.perfiles,
  ].find(Array.isArray)

  if (Array.isArray(roles)) {
    const normalizedRoles = roles
      .map((role): AuthRole | undefined => {
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
        const roleId =
          readString(role, ["rol_id", "rolId", "role_id", "roleId"]) ??
          readString(roleSource, ["id", "rol_id", "rolId", "role_id", "roleId"])

        if (!rawCode) {
          return undefined
        }

        const codigo = normalizeRoleCode(rawCode)

        return {
          id: roleId,
          rol_id: roleId,
          codigo,
          nombre: readString(roleSource, ["nombre", "name"]) ?? rawCode,
          tipo_rol: readString(roleSource, ["tipo_rol", "type"]),
        }
      })
      .filter((role): role is AuthRole => Boolean(role))

    if (normalizedRoles.length > 0) {
      return normalizedRoles
    }
  }

  const singleRoleObject = readSingleRoleObject(source, "rol") ?? readSingleRoleObject(source, "role")
  if (singleRoleObject) {
    return [singleRoleObject]
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
  const tokenRecord = readJwtPayload(token) ?? {}
  const nombre = readString(userRecord, ["nombre"])
  const apellido = readString(userRecord, ["apellido"])
  const fullName =
    readString(userRecord, ["name", "fullName", "full_name"]) ??
    readString(tokenRecord, ["name", "fullName", "full_name"]) ??
    [nombre, apellido].filter(Boolean).join(" ")
  const empresaId =
    readString(userRecord, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readString(dataRecord, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readString(payloadRecord, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readString(tokenRecord, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readNestedId(userRecord, ["empresa"]) ??
    readNestedId(dataRecord, ["empresa"]) ??
    readNestedId(tokenRecord, ["empresa"])
  const sucursalId =
    readString(userRecord, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readString(dataRecord, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readString(payloadRecord, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readString(tokenRecord, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readNestedId(userRecord, ["sucursal"]) ??
    readNestedId(dataRecord, ["sucursal"]) ??
    readNestedId(tokenRecord, ["sucursal"])
  const roles = [
    readRoles(userRecord),
    readRoles(dataRecord),
    readRoles(payloadRecord),
    readRoles(tokenRecord),
  ].find((items) => items.length > 0) ?? []
  const empresaNombre =
    readNestedField(userRecord, ["empresa"], ["nombre_comercial", "razon_social", "nombre"]) ??
    readNestedField(dataRecord, ["empresa"], ["nombre_comercial", "razon_social", "nombre"])
  const sucursalNombre =
    readNestedField(userRecord, ["sucursal"], ["nombre", "codigo"]) ??
    readNestedField(dataRecord, ["sucursal"], ["nombre", "codigo"])

  const user: AuthUser = {
    id:
      readString(userRecord, ["id", "usuario_id", "usuarioId", "user_id", "userId"]) ??
      readString(dataRecord, ["id", "usuario_id", "usuarioId", "user_id", "userId"]) ??
      readString(payloadRecord, ["id", "usuario_id", "usuarioId", "user_id", "userId"]) ??
      readString(tokenRecord, ["id", "usuario_id", "usuarioId", "user_id", "userId", "sub"]),
    empresaId,
    empresa_id: empresaId,
    sucursalId,
    sucursal_id: sucursalId,
    empresaNombre,
    sucursalNombre,
    email:
      readString(userRecord, ["email", "correo"]) ??
      readString(tokenRecord, ["email", "correo"]) ??
      email,
    username:
      readString(userRecord, ["username", "usuario"]) ??
      readString(tokenRecord, ["username", "usuario"]) ??
      email,
    name: fullName || email,
    roles,
  }
  const response = NextResponse.json({ user })

  if (token) {
    response.cookies.set(AUTH_TOKEN_COOKIE_NAME, token, getAuthCookieOptions())
    response.cookies.set(
      AUTH_USER_COOKIE_NAME,
      encodeAuthUserCookie(user),
      getAuthCookieOptions()
    )
  } else {
    response.cookies.set(AUTH_TOKEN_COOKIE_NAME, "", getAuthCookieOptions(0))
    response.cookies.set(AUTH_USER_COOKIE_NAME, "", getAuthCookieOptions(0))
  }

  return response
}
