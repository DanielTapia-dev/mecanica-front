import { proxyToMecanicaBackend } from "@/lib/server/mecanica-backend"

export async function GET(request: Request) {
  return proxyToMecanicaBackend(request, "/api/mecanica/clientes", "GET")
}

export async function POST(request: Request) {
  return proxyToMecanicaBackend(request, "/api/mecanica/cliente", "POST")
}
