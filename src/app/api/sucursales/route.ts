import { proxyToMecanicaBackend } from "@/lib/server/mecanica-backend"

export async function GET(request: Request) {
  return proxyToMecanicaBackend(request, "/api/mecanica/sucursales", "GET")
}

export async function POST(request: Request) {
  return proxyToMecanicaBackend(request, "/api/mecanica/sucursal", "POST")
}
