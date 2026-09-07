import { proxyToMecanicaBackend } from "@/lib/server/mecanica-backend"

export async function GET(request: Request) {
  return proxyToMecanicaBackend(request, "/api/mecanica/empresa/logo-publico", "GET")
}
