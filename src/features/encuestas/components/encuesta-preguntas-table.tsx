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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import {
  EncuestasServiceError,
  encuestasService,
} from "@/features/encuestas/services/encuestas-service"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type {
  CreateEncuestaPreguntaInput,
  EncuestaPregunta,
  UpdateEncuestaPreguntaInput,
} from "@/features/encuestas/types"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof EncuestasServiceError ? error.message : fallback
}

function readCreateInput(
  formData: FormData,
  plantillaId: string,
  empresaId: string
): CreateEncuestaPreguntaInput {
  return {
    plantilla_id: plantillaId,
    empresa_id: empresaId,
    texto_pregunta: (formData.get("texto_pregunta") as string).trim(),
    descripcion_ayuda: (formData.get("descripcion_ayuda") as string)?.trim() || undefined,
    escala_min: Number(formData.get("escala_min")) || 1,
    escala_max: Number(formData.get("escala_max")) || 5,
    etiqueta_min: (formData.get("etiqueta_min") as string)?.trim() || undefined,
    etiqueta_max: (formData.get("etiqueta_max") as string)?.trim() || undefined,
    orden_visual: Number(formData.get("orden_visual")) || 0,
    activo: formData.get("activo") === "activo",
  }
}

function readUpdateInput(formData: FormData): UpdateEncuestaPreguntaInput {
  return {
    texto_pregunta: (formData.get("texto_pregunta") as string).trim(),
    descripcion_ayuda: (formData.get("descripcion_ayuda") as string)?.trim() || undefined,
    escala_min: Number(formData.get("escala_min")) || 1,
    escala_max: Number(formData.get("escala_max")) || 5,
    etiqueta_min: (formData.get("etiqueta_min") as string)?.trim() || undefined,
    etiqueta_max: (formData.get("etiqueta_max") as string)?.trim() || undefined,
    orden_visual: Number(formData.get("orden_visual")) || 0,
    activo: formData.get("activo") === "activo",
  }
}

interface EncuestaPreguntasTableProps {
  plantillaId: string
  empresaId: string
}

export function EncuestaPreguntasTable({ plantillaId, empresaId }: EncuestaPreguntasTableProps) {
  const [preguntas, setPreguntas] = useState<EncuestaPregunta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [editingPregunta, setEditingPregunta] = useState<EncuestaPregunta | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingPregunta, setDeletingPregunta] = useState<EncuestaPregunta | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadPreguntas = useCallback(async () => {
    try {
      const data = await encuestasService.listPreguntasByPlantilla(plantillaId)
      setPreguntas(data)
      setLoadError(null)
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible cargar las preguntas."))
    }
  }, [plantillaId])

  useEffect(() => {
    let isMounted = true

    async function loadInitial() {
      await loadPreguntas()
      if (isMounted) setIsLoading(false)
    }

    void loadInitial()

    return () => {
      isMounted = false
    }
  }, [loadPreguntas])

  const handleAddPregunta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setIsSavingAdd(true)
    setAddError(null)

    try {
      await encuestasService.createPregunta(readCreateInput(formData, plantillaId, empresaId))
      await loadPreguntas()
      setIsAddOpen(false)
    } catch (error) {
      setAddError(getErrorMessage(error, "No fue posible crear la pregunta."))
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleEditPregunta = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingPregunta) return
    const formData = new FormData(e.currentTarget)
    setIsSavingEdit(true)
    setEditError(null)

    try {
      await encuestasService.updatePregunta(editingPregunta.id, readUpdateInput(formData))
      await loadPreguntas()
      setEditingPregunta(null)
    } catch (error) {
      setEditError(getErrorMessage(error, "No fue posible actualizar la pregunta."))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeletePregunta = async () => {
    if (!deletingPregunta) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await encuestasService.deletePregunta(deletingPregunta.id)
      await loadPreguntas()
      setDeletingPregunta(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, "No fue posible eliminar la pregunta."))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Preguntas de calificación (escala numérica) de esta plantilla.
        </p>
        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            setIsAddOpen(open)
            if (!open) setAddError(null)
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar Pregunta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <form onSubmit={handleAddPregunta}>
              <DialogHeader>
                <DialogTitle className="text-foreground">Nueva Pregunta</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Complete la información de la nueva pregunta
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="texto_pregunta">Pregunta</Label>
                  <Input
                    id="texto_pregunta"
                    name="texto_pregunta"
                    required
                    maxLength={300}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descripcion_ayuda">Texto de ayuda</Label>
                  <Input id="descripcion_ayuda" name="descripcion_ayuda" className="bg-input border-border" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="escala_min">Escala mínima</Label>
                    <Input
                      id="escala_min"
                      name="escala_min"
                      type="number"
                      defaultValue={1}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="escala_max">Escala máxima</Label>
                    <Input
                      id="escala_max"
                      name="escala_max"
                      type="number"
                      defaultValue={5}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="etiqueta_min">Etiqueta mínima</Label>
                    <Input
                      id="etiqueta_min"
                      name="etiqueta_min"
                      defaultValue="Muy insatisfecho"
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="etiqueta_max">Etiqueta máxima</Label>
                    <Input
                      id="etiqueta_max"
                      name="etiqueta_max"
                      defaultValue="Muy satisfecho"
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="orden_visual">Orden visual</Label>
                    <Input
                      id="orden_visual"
                      name="orden_visual"
                      type="number"
                      defaultValue={0}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="activo">Estado</Label>
                    <Select name="activo" defaultValue="activo">
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {addError && <p className="text-sm text-destructive">{addError}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSavingAdd}>
                  {isSavingAdd ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loadError && <p className="text-sm text-destructive">{loadError}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando preguntas...
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground w-[1%]">Orden</TableHead>
                <TableHead className="text-muted-foreground">Pregunta</TableHead>
                <TableHead className="text-muted-foreground w-[160px]">Escala</TableHead>
                <TableHead className="text-muted-foreground w-[110px]">Estado</TableHead>
                <TableHead className="text-muted-foreground w-[1%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preguntas.map((pregunta) => (
                <TableRow key={pregunta.id} className="border-border hover:bg-muted/50">
                  <TableCell className="text-muted-foreground">{pregunta.orden_visual}</TableCell>
                  <TableCell className="max-w-sm whitespace-normal">
                    <p className="font-medium text-foreground">{pregunta.texto_pregunta}</p>
                    {pregunta.descripcion_ayuda && (
                      <p
                        className="text-sm text-muted-foreground line-clamp-2"
                        title={pregunta.descripcion_ayuda}
                      >
                        {pregunta.descripcion_ayuda}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {pregunta.escala_min} - {pregunta.escala_max}
                    <br />
                    <span className="text-xs">
                      {pregunta.etiqueta_min} / {pregunta.etiqueta_max}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        pregunta.activo
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {pregunta.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={() => setEditingPregunta(pregunta)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingPregunta(pregunta)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {preguntas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No se han registrado preguntas para esta plantilla.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPregunta}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPregunta(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleEditPregunta}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Pregunta</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique la información de la pregunta
              </DialogDescription>
            </DialogHeader>
            {editingPregunta && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-texto_pregunta">Pregunta</Label>
                  <Input
                    id="edit-texto_pregunta"
                    name="texto_pregunta"
                    defaultValue={editingPregunta.texto_pregunta}
                    required
                    maxLength={300}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-descripcion_ayuda">Texto de ayuda</Label>
                  <Input
                    id="edit-descripcion_ayuda"
                    name="descripcion_ayuda"
                    defaultValue={editingPregunta.descripcion_ayuda ?? ""}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-escala_min">Escala mínima</Label>
                    <Input
                      id="edit-escala_min"
                      name="escala_min"
                      type="number"
                      defaultValue={editingPregunta.escala_min}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-escala_max">Escala máxima</Label>
                    <Input
                      id="edit-escala_max"
                      name="escala_max"
                      type="number"
                      defaultValue={editingPregunta.escala_max}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-etiqueta_min">Etiqueta mínima</Label>
                    <Input
                      id="edit-etiqueta_min"
                      name="etiqueta_min"
                      defaultValue={editingPregunta.etiqueta_min}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-etiqueta_max">Etiqueta máxima</Label>
                    <Input
                      id="edit-etiqueta_max"
                      name="etiqueta_max"
                      defaultValue={editingPregunta.etiqueta_max}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-orden_visual">Orden visual</Label>
                    <Input
                      id="edit-orden_visual"
                      name="orden_visual"
                      type="number"
                      defaultValue={editingPregunta.orden_visual}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-activo">Estado</Label>
                    <Select name="activo" defaultValue={editingPregunta.activo ? "activo" : "inactivo"}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingPregunta(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingEdit}>
                {isSavingEdit ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingPregunta}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPregunta(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Eliminar Pregunta</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas eliminar esta pregunta? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingPregunta(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeletePregunta} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
