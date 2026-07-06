"use client"

import { useCallback, useEffect, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Loader2, Search, Trash2 } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import {
  EncuestasServiceError,
  encuestasService,
} from "@/features/encuestas/services/encuestas-service"
import type { EncuestaRespuesta } from "@/features/encuestas/types"

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

export function EncuestaRespuestasTable() {
  const { sessionScope } = useAuth()
  const empresaId = sessionScope.empresa_id

  const [respuestas, setRespuestas] = useState<EncuestaRespuesta[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [viewingRespuesta, setViewingRespuesta] = useState<EncuestaRespuesta | null>(null)

  const [deletingRespuesta, setDeletingRespuesta] = useState<EncuestaRespuesta | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadRespuestas = useCallback(async () => {
    if (!empresaId) return

    try {
      const data = await encuestasService.listRespuestasByEmpresa(empresaId)
      setRespuestas(data)
      setLoadError(null)
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible cargar las respuestas de encuesta."))
    }
  }, [empresaId])

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

  const filteredRespuestas = respuestas.filter((respuesta) =>
    respuesta.placa.toLowerCase().includes(search.toLowerCase())
  )

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

  return (
    <Card className="bg-card border-border">
      <CardHeader>
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
      </CardHeader>
      <CardContent>
        {loadError && <p className="mb-4 text-sm text-destructive">{loadError}</p>}

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
                  <TableHead className="text-muted-foreground">Promedio</TableHead>
                  <TableHead className="text-muted-foreground">Comentario</TableHead>
                  <TableHead className="text-muted-foreground w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRespuestas.map((respuesta) => (
                  <TableRow key={respuesta.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{respuesta.placa}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFecha(respuesta.fecha_respuesta)}
                    </TableCell>
                    <TableCell>
                      {calcularPromedio(respuesta) ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          {calcularPromedio(respuesta)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="max-w-sm whitespace-normal text-sm text-muted-foreground"
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
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeletingRespuesta(respuesta)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRespuestas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
