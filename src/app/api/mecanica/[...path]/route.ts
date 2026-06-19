import { NextResponse } from "next/server"

const DEFAULT_BACKEND_URL = "http://localhost:8011"
const BACKEND_API_PREFIX = "/api/mecanica"

interface ProxyRouteContext {
  params: Promise<{
    path: string[]
  }>
}

function getBackendUrl(path: string[], search: string) {
  const backendUrl = process.env.MECANICA_BACKEND_URL ?? DEFAULT_BACKEND_URL
  const targetUrl = new URL(
    `${BACKEND_API_PREFIX}/${path.map(encodeURIComponent).join("/")}`,
    backendUrl
  )
  targetUrl.search = search

  return targetUrl.toString()
}

function getForwardHeaders(request: Request) {
  const headers = new Headers(request.headers)

  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")

  return headers
}

async function proxyMecanicaRequest(request: Request, context: ProxyRouteContext) {
  const { path } = await context.params
  const requestUrl = new URL(request.url)
  const method = request.method.toUpperCase()
  const hasBody = method !== "GET" && method !== "HEAD"

  let backendResponse: Response

  try {
    backendResponse = await fetch(getBackendUrl(path, requestUrl.search), {
      method,
      headers: getForwardHeaders(request),
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { message: "No fue posible conectar con el backend de mecanica." },
      { status: 502 }
    )
  }

  const responseHeaders = new Headers(backendResponse.headers)
  responseHeaders.delete("content-encoding")
  responseHeaders.delete("transfer-encoding")

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  })
}

export function GET(request: Request, context: ProxyRouteContext) {
  return proxyMecanicaRequest(request, context)
}

export function POST(request: Request, context: ProxyRouteContext) {
  return proxyMecanicaRequest(request, context)
}

export function PATCH(request: Request, context: ProxyRouteContext) {
  return proxyMecanicaRequest(request, context)
}

export function PUT(request: Request, context: ProxyRouteContext) {
  return proxyMecanicaRequest(request, context)
}

export function DELETE(request: Request, context: ProxyRouteContext) {
  return proxyMecanicaRequest(request, context)
}
