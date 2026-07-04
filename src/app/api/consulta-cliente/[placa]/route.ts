import { proxyToMecanicaBackend } from "@/lib/server/mecanica-backend"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ placa: string }> }
) {
  const { placa } = await params
  return proxyToMecanicaBackend(
    request,
    `/api/mecanica/seguimiento-orden/placa/${encodeURIComponent(placa)}`,
    "GET"
  )
}
