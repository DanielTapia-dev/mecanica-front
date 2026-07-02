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
import { ListOrdered, MoreHorizontal, Loader2, Pencil, Search, Trash2 } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import {
  EstadosProcesoServiceError,
  estadosProcesoService,
} from "@/features/estados-proceso/services/estados-proceso-service"
import type {
  CreateEstadoProcesoInput,
  EstadoProceso,
  UpdateEstadoProcesoInput,
} from "@/features/estados-proceso/types"

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof EstadosProcesoServiceError ? error.message : fallback
}

function readCreateEstadoProcesoInput(
  formData: FormData,
  empresaId: string
): CreateEstadoProcesoInput {
  return {
    empresa_id: empresaId,
    codigo: (formData.get("codigo") as string).trim().toUpperCase(),
    nombre: (formData.get("nombre") as string).trim(),
    mensaje_cliente_default: (formData.get("mensaje_cliente_default") as string).trim(),
    permite_comentario_cliente: false,
    es_final: false,
    orden_visual: 0,
    activo: formData.get("activo") === "activo",
  }
}

function readUpdateEstadoProcesoInput(formData: FormData): UpdateEstadoProcesoInput {
  return {
    codigo: (formData.get("codigo") as string).trim().toUpperCase(),
    nombre: (formData.get("nombre") as string).trim(),
    mensaje_cliente_default: (formData.get("mensaje_cliente_default") as string).trim(),
    activo: formData.get("activo") === "activo",
  }
}

export function EstadosProcesoTable() {
  const { sessionScope } = useAuth()
  const empresaId = sessionScope.empresa_id

  const [estados, setEstados] = useState<EstadoProceso[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [editingEstado, setEditingEstado] = useState<EstadoProceso | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingEstado, setDeletingEstado] = useState<EstadoProceso | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadEstados = useCallback(async () => {
    try {
      const data = await estadosProcesoService.listEstadosProceso()
      setEstados(data)
      setLoadError(null)
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible cargar los estados de proceso."))
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadInitialEstados() {
      await loadEstados()

      if (isMounted) {
        setIsLoading(false)
      }
    }

    void loadInitialEstados()

    return () => {
      isMounted = false
    }
  }, [loadEstados])

  const filteredEstados = estados.filter(
    (estado) =>
      estado.nombre.toLowerCase().includes(search.toLowerCase()) ||
      estado.codigo.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddEstado = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!empresaId) {
      setAddError("No se pudo determinar la empresa del usuario actual.")
      return
    }

    const formData = new FormData(e.currentTarget)
    setIsSavingAdd(true)
    setAddError(null)

    try {
      await estadosProcesoService.createEstadoProceso(
        readCreateEstadoProcesoInput(formData, empresaId)
      )
      await loadEstados()
      setIsAddOpen(false)
    } catch (error) {
      setAddError(getErrorMessage(error, "No fue posible crear el estado de proceso."))
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleEditEstado = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingEstado) return

    const formData = new FormData(e.currentTarget)
    setIsSavingEdit(true)
    setEditError(null)

    try {
      await estadosProcesoService.updateEstadoProceso(
        editingEstado.id,
        readUpdateEstadoProcesoInput(formData)
      )
      await loadEstados()
      setEditingEstado(null)
    } catch (error) {
      setEditError(getErrorMessage(error, "No fue posible actualizar el estado de proceso."))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteEstado = async () => {
    if (!deletingEstado) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await estadosProcesoService.deleteEstadoProceso(deletingEstado.id)
      await loadEstados()
      setDeletingEstado(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, "No fue posible eliminar el estado de proceso."))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-foreground">Gestión de Estados de Proceso</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar estados..."
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
                  <ListOrdered className="h-4 w-4" />
                  Agregar Estado
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <form onSubmit={handleAddEstado}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Nuevo Estado de Proceso</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Complete la información del nuevo estado
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="codigo">Código</Label>
                      <Input
                        id="codigo"
                        name="codigo"
                        required
                        maxLength={40}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        required
                        maxLength={150}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mensaje_cliente_default">Mensaje para el cliente</Label>
                      <textarea
                        id="mensaje_cliente_default"
                        name="mensaje_cliente_default"
                        required
                        rows={3}
                        className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
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
            Cargando estados de proceso...
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Código</TableHead>
                  <TableHead className="text-muted-foreground">Nombre</TableHead>
                  <TableHead className="text-muted-foreground">Mensaje al cliente</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstados.map((estado) => (
                  <TableRow key={estado.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{estado.codigo}</TableCell>
                    <TableCell className="text-foreground">{estado.nombre}</TableCell>
                    <TableCell
                      className="max-w-sm whitespace-normal text-sm text-muted-foreground"
                      title={estado.mensaje_cliente_default}
                    >
                      <span className="line-clamp-2">{estado.mensaje_cliente_default}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          estado.activo
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {estado.activo ? "Activo" : "Inactivo"}
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
                          <DropdownMenuItem onClick={() => setEditingEstado(estado)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingEstado(estado)}
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
                {filteredEstados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No se encontraron estados de proceso.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingEstado}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEstado(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleEditEstado}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Estado de Proceso</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique la información del estado
              </DialogDescription>
            </DialogHeader>
            {editingEstado && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-codigo">Código</Label>
                  <Input
                    id="edit-codigo"
                    name="codigo"
                    defaultValue={editingEstado.codigo}
                    required
                    maxLength={40}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-nombre">Nombre</Label>
                  <Input
                    id="edit-nombre"
                    name="nombre"
                    defaultValue={editingEstado.nombre}
                    required
                    maxLength={150}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-mensaje_cliente_default">Mensaje para el cliente</Label>
                  <textarea
                    id="edit-mensaje_cliente_default"
                    name="mensaje_cliente_default"
                    defaultValue={editingEstado.mensaje_cliente_default}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-activo">Estado</Label>
                  <Select name="activo" defaultValue={editingEstado.activo ? "activo" : "inactivo"}>
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
              <Button type="button" variant="outline" onClick={() => setEditingEstado(null)}>
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
        open={!!deletingEstado}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingEstado(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Eliminar Estado de Proceso</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas eliminar el estado {deletingEstado?.nombre}? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingEstado(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteEstado}
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
