import { proxyToMecanicaBackend } from "@/lib/server/mecanica-backend"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyToMecanicaBackend(request, `/api/mecanica/cliente/${id}`, "GET")
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyToMecanicaBackend(request, `/api/mecanica/cliente/${id}`, "PUT")
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyToMecanicaBackend(request, `/api/mecanica/clientes/${id}`, "DELETE")
}
