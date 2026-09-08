"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, FileDown, Loader2, Search, Trash2 } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import { hasAnyRole } from "@/features/auth/permissions"
import {
  EncuestasServiceError,
  encuestasService,
} from "@/features/encuestas/services/encuestas-service"
import type { EncuestaRespuesta } from "@/features/encuestas/types"
import {
  generateEncuestaListadoPdf,
  generateEncuestaPdf,
} from "@/features/encuestas/lib/generate-encuesta-pdf"
import { workOrdersService } from "@/features/work-orders/services/work-orders-service"
import { usersService } from "@/features/users/services/users-service"
import { fetchEmpresa } from "@/features/empresas/services/empresas-service"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof EncuestasServiceError ? error.message : fallback
}

function formatFecha(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function calcularPromedio(respuesta: EncuestaRespuesta) {
  const items = respuesta.items ?? []
  if (items.length === 0) return null
  const suma = items.reduce((total, item) => total + item.calificacion, 0)
  return (suma / items.length).toFixed(1)
}

function getPromedioBadgeClass(promedio: string) {
  return Number(promedio) < 3
    ? "bg-red-600 text-white"
    : "bg-emerald-500/20 text-emerald-400"
}

const TODOS_ASESORES_VALUE = "TODOS"

interface AsesorInfo {
  id: string
  nombre: string
}

interface EncuestaRespuestasTableProps {
  soloPropias?: boolean
}

export function EncuestaRespuestasTable({ soloPropias = false }: EncuestaRespuestasTableProps) {
  const { user, sessionScope } = useAuth()
  const empresaId = sessionScope.empresa_id
  const sucursalId = sessionScope.sucursal_id
  const usuarioId = sessionScope.user_id
  const isAdmin = hasAnyRole(user, ["ADMIN"])

  const [respuestas, setRespuestas] = useState<EncuestaRespuesta[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [viewingRespuesta, setViewingRespuesta] = useState<EncuestaRespuesta | null>(null)

  const [deletingRespuesta, setDeletingRespuesta] = useState<EncuestaRespuesta | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const [asesorPorOrden, setAsesorPorOrden] = useState<Record<string, AsesorInfo>>({})
  const [asesorFilter, setAsesorFilter] = useState(TODOS_ASESORES_VALUE)
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  const [isGeneratingListado, setIsGeneratingListado] = useState(false)
  const [listadoError, setListadoError] = useState<string | null>(null)

  const loadAsesores = useCallback(async (items: EncuestaRespuesta[]) => {
    const ordenIds = [...new Set(items.map((item) => item.orden_id))]

    if (ordenIds.length === 0) {
      setAsesorPorOrden({})
      return
    }

    const ordenes = await Promise.all(
      ordenIds.map((ordenId) => workOrdersService.getWorkOrder(ordenId).catch(() => null))
    )
    const usuarioIdPorOrden = new Map<string, string>()
    ordenes.forEach((orden, index) => {
      if (orden?.creado_por_usuario_id) {
        usuarioIdPorOrden.set(ordenIds[index], orden.creado_por_usuario_id)
      }
    })

    const usuarioIds = [...new Set(usuarioIdPorOrden.values())]
    const usuarios = await Promise.all(
      usuarioIds.map((idUsuario) => usersService.getUsuario(idUsuario).catch(() => null))
    )
    const nombrePorUsuarioId = new Map<string, string>()
    usuarios.forEach((usuario, index) => {
      if (usuario) {
        nombrePorUsuarioId.set(
          usuarioIds[index],
          [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || "-"
        )
      }
    })

    const resultado: Record<string, AsesorInfo> = {}
    usuarioIdPorOrden.forEach((idUsuario, ordenId) => {
      resultado[ordenId] = { id: idUsuario, nombre: nombrePorUsuarioId.get(idUsuario) ?? "-" }
    })
    setAsesorPorOrden(resultado)
  }, [])

  const loadRespuestas = useCallback(async () => {
    if (!empresaId || !sucursalId) return

    try {
      const data = await encuestasService.listRespuestasBySucursal(sucursalId)
      let finalRespuestas = data

      if (soloPropias && usuarioId) {
        const ordenes = await workOrdersService.listWorkOrders({ empresa_id: empresaId })
        const propiasOrdenIds = new Set(
          ordenes.data
            .filter((orden) => String(orden.creado_por_usuario_id ?? "") === String(usuarioId))
            .map((orden) => String(orden.id))
        )
        finalRespuestas = data.filter((respuesta) =>
          propiasOrdenIds.has(String(respuesta.orden_id))
        )
      }

      setRespuestas(finalRespuestas)
      setLoadError(null)

      if (isAdmin) {
        void loadAsesores(finalRespuestas)
      }
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible cargar las respuestas de encuesta."))
    }
  }, [empresaId, sucursalId, soloPropias, usuarioId, isAdmin, loadAsesores])

  useEffect(() => {
    let isMounted = true

    async function loadInitial() {
      await loadRespuestas()
      if (isMounted) setIsLoading(false)
    }

    void loadInitial()

    return () => {
      isMounted = false
    }
  }, [loadRespuestas])

  const asesoresDisponibles = useMemo(() => {
    const nombrePorId = new Map<string, string>()

    Object.values(asesorPorOrden).forEach((asesor) => {
      if (!nombrePorId.has(asesor.id)) {
        nombrePorId.set(asesor.id, asesor.nombre)
      }
    })

    return [...nombrePorId.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((left, right) => left.nombre.localeCompare(right.nombre, "es"))
  }, [asesorPorOrden])

  const filteredRespuestas = respuestas.filter((respuesta) => {
    const matchesSearch = respuesta.placa.toLowerCase().includes(search.toLowerCase())
    const matchesAsesor =
      !isAdmin || asesorFilter === TODOS_ASESORES_VALUE
        ? true
        : asesorPorOrden[respuesta.orden_id]?.id === asesorFilter

    let matchesFecha = true

    if (fechaDesde || fechaHasta) {
      const fechaRespuesta = new Date(respuesta.fecha_respuesta)

      if (!Number.isNaN(fechaRespuesta.getTime())) {
        const fechaSolo = fechaRespuesta.toISOString().slice(0, 10)

        if (fechaDesde && fechaSolo < fechaDesde) {
          matchesFecha = false
        }

        if (fechaHasta && fechaSolo > fechaHasta) {
          matchesFecha = false
        }
      }
    }

    return matchesSearch && matchesAsesor && matchesFecha
  })

  const handleDeleteRespuesta = async () => {
    if (!deletingRespuesta) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await encuestasService.deleteRespuesta(deletingRespuesta.id)
      await loadRespuestas()
      setDeletingRespuesta(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, "No fue posible eliminar la respuesta de encuesta."))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGenerarPdf = async (respuesta: EncuestaRespuesta) => {
    setGeneratingPdfId(respuesta.id)
    setPdfError(null)

    try {
      const orden = await workOrdersService.getWorkOrder(respuesta.orden_id)
      const [empresa, asesor] = await Promise.all([
        fetchEmpresa(respuesta.empresa_id).catch(() => null),
        orden.creado_por_usuario_id
          ? usersService.getUsuario(orden.creado_por_usuario_id).catch(() => null)
          : Promise.resolve(null),
      ])

      const clienteNombre =
        [orden.cliente?.nombre, orden.cliente?.apellido].filter(Boolean).join(" ") || "-"
      const asesorNombre = asesor
        ? [asesor.nombre, asesor.apellido].filter(Boolean).join(" ") || "-"
        : "-"

      const doc = generateEncuestaPdf({
        empresaLogoBase64: empresa?.logobase64 ?? null,
        clienteNombre,
        asesorNombre,
        placa: respuesta.placa,
        aseguradora: orden.aseguradora || "-",
        preguntas: (respuesta.items ?? []).map((item) => ({
          texto: item.pregunta?.texto_pregunta ?? "Pregunta",
          calificacion: item.calificacion,
        })),
        comentarioGeneral: respuesta.comentario_general,
      })

      doc.save(`encuesta-satisfaccion-${respuesta.placa || respuesta.id}.pdf`)
    } catch (error) {
      setPdfError(getErrorMessage(error, "No fue posible generar el PDF de la encuesta."))
    } finally {
      setGeneratingPdfId(null)
    }
  }

  const handleGenerarListadoPdf = async () => {
    setIsGeneratingListado(true)
    setListadoError(null)

    try {
      const empresa = empresaId ? await fetchEmpresa(empresaId).catch(() => null) : null

      const filas = filteredRespuestas.map((respuesta) => ({
        placa: respuesta.placa,
        fecha: formatFecha(respuesta.fecha_respuesta),
        asesor: isAdmin ? asesorPorOrden[respuesta.orden_id]?.nombre ?? "-" : undefined,
        promedio: calcularPromedio(respuesta),
        comentario: respuesta.comentario_general,
      }))

      const filtroAsesorNombre =
        isAdmin && asesorFilter !== TODOS_ASESORES_VALUE
          ? asesoresDisponibles.find((asesor) => asesor.id === asesorFilter)?.nombre ?? "Todos"
          : "Todos"

      const doc = generateEncuestaListadoPdf({
        empresaLogoBase64: empresa?.logobase64 ?? null,
        filtroAsesor: isAdmin ? filtroAsesorNombre : null,
        fechaDesde: fechaDesde || null,
        fechaHasta: fechaHasta || null,
        incluirAsesor: isAdmin,
        filas,
      })

      doc.save(`listado-encuestas-satisfaccion-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (error) {
      setListadoError(getErrorMessage(error, "No fue posible generar el listado en PDF."))
    } finally {
      setIsGeneratingListado(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-foreground">Respuestas de Encuesta</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-input border-border"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {isAdmin && (
              <Select
                value={asesorFilter}
                onValueChange={(value) => setAsesorFilter(value ?? TODOS_ASESORES_VALUE)}
              >
                <SelectTrigger className="w-full bg-input border-border sm:w-56">
                  <SelectValue placeholder="Filtrar por asesor">
                    {(value: string) =>
                      value === TODOS_ASESORES_VALUE
                        ? "Todos los asesores"
                        : asesoresDisponibles.find((asesor) => asesor.id === value)?.nombre ??
                          "Todos los asesores"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS_ASESORES_VALUE}>Todos los asesores</SelectItem>
                  {asesoresDisponibles.map((asesor) => (
                    <SelectItem key={asesor.id} value={asesor.id}>
                      {asesor.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full bg-input border-border sm:w-40"
                aria-label="Fecha desde"
              />
              <span className="text-sm text-muted-foreground">a</span>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full bg-input border-border sm:w-40"
                aria-label="Fecha hasta"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2 sm:ml-auto"
              disabled={isGeneratingListado}
              onClick={() => void handleGenerarListadoPdf()}
            >
              {isGeneratingListado ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Generar listado PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadError && <p className="mb-4 text-sm text-destructive">{loadError}</p>}
        {pdfError && <p className="mb-4 text-sm text-destructive">{pdfError}</p>}
        {listadoError && <p className="mb-4 text-sm text-destructive">{listadoError}</p>}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando respuestas de encuesta...
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Placa</TableHead>
                  <TableHead className="text-muted-foreground">Fecha</TableHead>
                  {isAdmin && (
                    <TableHead className="text-muted-foreground">Asesor</TableHead>
                  )}
                  <TableHead className="text-muted-foreground">Promedio</TableHead>
                  <TableHead className="text-muted-foreground">Comentario</TableHead>
                  <TableHead className="text-muted-foreground w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRespuestas.map((respuesta) => {
                  const promedio = calcularPromedio(respuesta)
                  const esBajo = promedio !== null && Number(promedio) < 3

                  return (
                    <TableRow key={respuesta.id} className="border-border hover:bg-muted/50">
                      <TableCell
                        className={esBajo ? "font-medium text-red-600" : "font-medium text-foreground"}
                      >
                        {respuesta.placa}
                      </TableCell>
                      <TableCell className={esBajo ? "text-red-600" : "text-muted-foreground"}>
                        {formatFecha(respuesta.fecha_respuesta)}
                      </TableCell>
                      {isAdmin && (
                        <TableCell
                          className={esBajo ? "text-red-600" : "text-muted-foreground"}
                        >
                          {asesorPorOrden[respuesta.orden_id]?.nombre ?? "-"}
                        </TableCell>
                      )}
                      <TableCell>
                        {promedio ? (
                          <Badge className={getPromedioBadgeClass(promedio)}>{promedio}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell
                        className={
                          esBajo
                            ? "max-w-sm whitespace-normal text-sm text-red-600"
                            : "max-w-sm whitespace-normal text-sm text-muted-foreground"
                        }
                        title={respuesta.comentario_general ?? undefined}
                      >
                        <span className="line-clamp-2">{respuesta.comentario_general || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setViewingRespuesta(respuesta)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Generar PDF"
                            disabled={generatingPdfId === respuesta.id}
                            onClick={() => handleGenerarPdf(respuesta)}
                          >
                            {generatingPdfId === respuesta.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeletingRespuesta(respuesta)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredRespuestas.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 6 : 5}
                      className="text-center text-muted-foreground py-8"
                    >
                      No se encontraron respuestas de encuesta.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* View Detail Dialog */}
      <Dialog
        open={!!viewingRespuesta}
        onOpenChange={(open) => {
          if (!open) setViewingRespuesta(null)
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Encuesta de {viewingRespuesta?.placa}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {viewingRespuesta ? formatFecha(viewingRespuesta.fecha_respuesta) : ""}
            </DialogDescription>
          </DialogHeader>
          {viewingRespuesta && (
            <div className="space-y-3">
              {(viewingRespuesta.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <p className="text-sm text-foreground">
                    {item.pregunta?.texto_pregunta ?? `Pregunta ${item.pregunta_id}`}
                  </p>
                  <Badge className="bg-emerald-500/20 text-emerald-400">{item.calificacion}</Badge>
                </div>
              ))}
              {viewingRespuesta.comentario_general && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                  {viewingRespuesta.comentario_general}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewingRespuesta(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingRespuesta}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRespuesta(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Eliminar Respuesta de Encuesta</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas eliminar la encuesta de {deletingRespuesta?.placa}? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingRespuesta(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteRespuesta}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
