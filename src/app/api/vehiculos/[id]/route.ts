import { proxyToMecanicaBackend } from "@/lib/server/mecanica-backend"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyToMecanicaBackend(request, `/api/mecanica/vehiculo/${id}`, "GET")
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyToMecanicaBackend(request, `/api/mecanica/vehiculo/${id}`, "PUT")
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyToMecanicaBackend(request, `/api/mecanica/vehiculo/${id}`, "DELETE")
}
