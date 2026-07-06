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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClipboardList, ListChecks, Loader2, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import {
  EncuestasServiceError,
  encuestasService,
} from "@/features/encuestas/services/encuestas-service"
import { EncuestaPreguntasTable } from "@/features/encuestas/components/encuesta-preguntas-table"
import type {
  CreateEncuestaPlantillaInput,
  EncuestaPlantilla,
  UpdateEncuestaPlantillaInput,
} from "@/features/encuestas/types"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof EncuestasServiceError ? error.message : fallback
}

function readCreateInput(formData: FormData, empresaId: string): CreateEncuestaPlantillaInput {
  return {
    empresa_id: empresaId,
    nombre: (formData.get("nombre") as string).trim(),
    descripcion: (formData.get("descripcion") as string)?.trim() || undefined,
    vigente_desde: (formData.get("vigente_desde") as string) || undefined,
    vigente_hasta: (formData.get("vigente_hasta") as string) || undefined,
    activo: formData.get("activo") === "activo",
  }
}

function readUpdateInput(formData: FormData): UpdateEncuestaPlantillaInput {
  return {
    nombre: (formData.get("nombre") as string).trim(),
    descripcion: (formData.get("descripcion") as string)?.trim() || undefined,
    vigente_desde: (formData.get("vigente_desde") as string) || undefined,
    vigente_hasta: (formData.get("vigente_hasta") as string) || undefined,
    activo: formData.get("activo") === "activo",
  }
}

export function EncuestaPlantillasTable() {
  const { sessionScope } = useAuth()
  const empresaId = sessionScope.empresa_id

  const [plantillas, setPlantillas] = useState<EncuestaPlantilla[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [editingPlantilla, setEditingPlantilla] = useState<EncuestaPlantilla | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingPlantilla, setDeletingPlantilla] = useState<EncuestaPlantilla | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [preguntasPlantilla, setPreguntasPlantilla] = useState<EncuestaPlantilla | null>(null)

  const loadPlantillas = useCallback(async () => {
    if (!empresaId) return

    try {
      const data = await encuestasService.listPlantillasByEmpresa(empresaId)
      setPlantillas(data)
      setLoadError(null)
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible cargar las plantillas de encuesta."))
    }
  }, [empresaId])

  useEffect(() => {
    let isMounted = true

    async function loadInitial() {
      await loadPlantillas()
      if (isMounted) setIsLoading(false)
    }

    void loadInitial()

    return () => {
      isMounted = false
    }
  }, [loadPlantillas])

  const filteredPlantillas = plantillas.filter((plantilla) =>
    plantilla.nombre.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddPlantilla = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!empresaId) {
      setAddError("No se pudo determinar la empresa del usuario actual.")
      return
    }

    const formData = new FormData(e.currentTarget)
    setIsSavingAdd(true)
    setAddError(null)

    try {
      await encuestasService.createPlantilla(readCreateInput(formData, empresaId))
      await loadPlantillas()
      setIsAddOpen(false)
    } catch (error) {
      setAddError(getErrorMessage(error, "No fue posible crear la plantilla de encuesta."))
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleEditPlantilla = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingPlantilla) return

    const formData = new FormData(e.currentTarget)
    setIsSavingEdit(true)
    setEditError(null)

    try {
      await encuestasService.updatePlantilla(editingPlantilla.id, readUpdateInput(formData))
      await loadPlantillas()
      setEditingPlantilla(null)
    } catch (error) {
      setEditError(getErrorMessage(error, "No fue posible actualizar la plantilla de encuesta."))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeletePlantilla = async () => {
    if (!deletingPlantilla) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await encuestasService.deletePlantilla(deletingPlantilla.id)
      await loadPlantillas()
      setDeletingPlantilla(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, "No fue posible eliminar la plantilla de encuesta."))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActivo = async (plantilla: EncuestaPlantilla) => {
    setLoadError(null)
    try {
      await encuestasService.updatePlantilla(plantilla.id, { activo: !plantilla.activo })
      await loadPlantillas()
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible actualizar el estado de la plantilla."))
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-foreground">Plantillas de Encuesta</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar plantillas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-input border-border"
              />
            </div>
            <Dialog
              open={isAddOpen}
              onOpenChange={(open) => {
                setIsAddOpen(open)
                if (!open) setAddError(null)
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Agregar Plantilla
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <form onSubmit={handleAddPlantilla}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Nueva Plantilla de Encuesta</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Solo puede haber una plantilla activa por empresa. Al activar esta, se
                      desactivará la plantilla activa actual.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input id="nombre" name="nombre" required maxLength={150} className="bg-input border-border" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <textarea
                        id="descripcion"
                        name="descripcion"
                        rows={3}
                        className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="vigente_desde">Vigente desde</Label>
                        <Input
                          id="vigente_desde"
                          name="vigente_desde"
                          type="date"
                          className="bg-input border-border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="vigente_hasta">Vigente hasta</Label>
                        <Input
                          id="vigente_hasta"
                          name="vigente_hasta"
                          type="date"
                          className="bg-input border-border"
                        />
                      </div>
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
        </div>
      </CardHeader>
      <CardContent>
        {loadError && <p className="mb-4 text-sm text-destructive">{loadError}</p>}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando plantillas de encuesta...
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Nombre</TableHead>
                  <TableHead className="text-muted-foreground">Vigencia</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlantillas.map((plantilla) => (
                  <TableRow key={plantilla.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <p className="font-medium text-foreground">{plantilla.nombre}</p>
                      {plantilla.descripcion && (
                        <p className="text-sm text-muted-foreground">{plantilla.descripcion}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plantilla.vigente_desde}
                      {plantilla.vigente_hasta ? ` - ${plantilla.vigente_hasta}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          plantilla.activo
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {plantilla.activo ? "Activo" : "Inactivo"}
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
                          <DropdownMenuItem onClick={() => setPreguntasPlantilla(plantilla)}>
                            <ListChecks className="mr-2 h-4 w-4" />
                            Ver preguntas
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingPlantilla(plantilla)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActivo(plantilla)}>
                            {plantilla.activo ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingPlantilla(plantilla)}
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
                {filteredPlantillas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No se encontraron plantillas de encuesta.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Preguntas Dialog */}
      <Dialog
        open={!!preguntasPlantilla}
        onOpenChange={(open) => {
          if (!open) setPreguntasPlantilla(null)
        }}
      >
        <DialogContent className="bg-card border-border w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Preguntas de &quot;{preguntasPlantilla?.nombre}&quot;
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Administre las preguntas de calificación de esta plantilla de encuesta.
            </DialogDescription>
          </DialogHeader>
          {preguntasPlantilla && (
            <EncuestaPreguntasTable
              plantillaId={preguntasPlantilla.id}
              empresaId={preguntasPlantilla.empresa_id}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPlantilla}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPlantilla(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleEditPlantilla}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Plantilla de Encuesta</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique la información de la plantilla
              </DialogDescription>
            </DialogHeader>
            {editingPlantilla && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-nombre">Nombre</Label>
                  <Input
                    id="edit-nombre"
                    name="nombre"
                    defaultValue={editingPlantilla.nombre}
                    required
                    maxLength={150}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-descripcion">Descripción</Label>
                  <textarea
                    id="edit-descripcion"
                    name="descripcion"
                    defaultValue={editingPlantilla.descripcion ?? ""}
                    rows={3}
                    className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-vigente_desde">Vigente desde</Label>
                    <Input
                      id="edit-vigente_desde"
                      name="vigente_desde"
                      type="date"
                      defaultValue={editingPlantilla.vigente_desde}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-vigente_hasta">Vigente hasta</Label>
                    <Input
                      id="edit-vigente_hasta"
                      name="vigente_hasta"
                      type="date"
                      defaultValue={editingPlantilla.vigente_hasta ?? ""}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-activo">Estado</Label>
                  <Select name="activo" defaultValue={editingPlantilla.activo ? "activo" : "inactivo"}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingPlantilla(null)}>
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
        open={!!deletingPlantilla}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPlantilla(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Eliminar Plantilla de Encuesta</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas eliminar &quot;{deletingPlantilla?.nombre}&quot;? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingPlantilla(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeletePlantilla} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
