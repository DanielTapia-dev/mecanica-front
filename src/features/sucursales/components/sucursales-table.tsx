"use client"

import { useEffect, useState } from "react"
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
import { Loader2, MapPin, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react"
import {
  SucursalesApiError,
  createSucursal,
  deleteSucursal,
  fetchSucursales,
  updateSucursal,
} from "@/features/sucursales/services/sucursales-service"
import type { Sucursal, SucursalInput } from "@/features/sucursales/types"
import { fetchEmpresas } from "@/features/empresas/services/empresas-service"
import type { Empresa } from "@/features/empresas/types"

function readSucursalInput(formData: FormData): SucursalInput {
  return {
    empresa_id: formData.get("empresa_id") as string,
    codigo: (formData.get("codigo") as string).trim(),
    nombre: (formData.get("nombre") as string).trim(),
    direccion: (formData.get("direccion") as string)?.trim() || undefined,
    telefono: (formData.get("telefono") as string)?.trim() || undefined,
    activo: formData.get("activo") === "activo",
  }
}

export function SucursalesTable() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingSucursal, setDeletingSucursal] = useState<Sucursal | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof SucursalesApiError ? error.message : fallback

  const getEmpresaNombre = (empresaId: string) =>
    empresas.find((empresa) => empresa.id === empresaId)?.razon_social ?? empresaId

  const loadData = async () => {
    try {
      const [sucursalesData, empresasData] = await Promise.all([
        fetchSucursales(),
        fetchEmpresas(),
      ])
      setSucursales(sucursalesData.sucursales)
      setEmpresas(empresasData.empresas)
      setLoadError(null)
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible cargar las sucursales."))
    }
  }

  useEffect(() => {
    loadData().finally(() => setIsLoading(false))
  }, [])

  const filteredSucursales = sucursales.filter(
    (sucursal) =>
      sucursal.nombre.toLowerCase().includes(search.toLowerCase()) ||
      sucursal.codigo.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddSucursal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setIsSavingAdd(true)
    setAddError(null)

    try {
      await createSucursal(readSucursalInput(formData))
      await loadData()
      setIsAddOpen(false)
    } catch (error) {
      setAddError(getErrorMessage(error, "No fue posible crear la sucursal."))
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleEditSucursal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingSucursal) return
    const formData = new FormData(e.currentTarget)
    setIsSavingEdit(true)
    setEditError(null)

    try {
      await updateSucursal(editingSucursal.id, readSucursalInput(formData))
      await loadData()
      setEditingSucursal(null)
    } catch (error) {
      setEditError(getErrorMessage(error, "No fue posible actualizar la sucursal."))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteSucursal = async () => {
    if (!deletingSucursal) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteSucursal(deletingSucursal.id)
      await loadData()
      setDeletingSucursal(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, "No fue posible eliminar la sucursal."))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActivo = async (sucursal: Sucursal) => {
    setLoadError(null)
    try {
      await updateSucursal(sucursal.id, { activo: !sucursal.activo })
      await loadData()
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible actualizar el estado de la sucursal."))
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-foreground">Gestión de Sucursales</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar sucursales..."
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
                  <MapPin className="h-4 w-4" />
                  Agregar Sucursal
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <form onSubmit={handleAddSucursal}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Nueva Sucursal</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Complete la información de la nueva sucursal
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="empresa_id">Empresa</Label>
                      <Select name="empresa_id" required>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Selecciona una empresa">
                            {(value: string) => getEmpresaNombre(value)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {empresas.map((empresa) => (
                            <SelectItem key={empresa.id} value={empresa.id}>
                              {empresa.razon_social}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="codigo">Código</Label>
                        <Input
                          id="codigo"
                          name="codigo"
                          required
                          maxLength={20}
                          className="bg-input border-border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="activo">Estado</Label>
                        <Select name="activo" defaultValue="activo">
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue>
                              {(value: string) => (value === "activo" ? "Activo" : "Inactivo")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Activo</SelectItem>
                            <SelectItem value="inactivo">Inactivo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input id="direccion" name="direccion" className="bg-input border-border" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input id="telefono" name="telefono" className="bg-input border-border" />
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
            Cargando sucursales...
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Sucursal</TableHead>
                  <TableHead className="text-muted-foreground">Empresa</TableHead>
                  <TableHead className="text-muted-foreground">Código</TableHead>
                  <TableHead className="text-muted-foreground">Teléfono</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSucursales.map((sucursal) => (
                  <TableRow key={sucursal.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{sucursal.nombre}</p>
                        {sucursal.direccion && (
                          <p className="text-sm text-muted-foreground">{sucursal.direccion}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getEmpresaNombre(sucursal.empresa_id)}
                    </TableCell>
                    <TableCell className="text-foreground">{sucursal.codigo}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {sucursal.telefono || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          sucursal.activo
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {sucursal.activo ? "Activo" : "Inactivo"}
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
                          <DropdownMenuItem onClick={() => setEditingSucursal(sucursal)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActivo(sucursal)}>
                            {sucursal.activo ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingSucursal(sucursal)}
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
                {filteredSucursales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No se encontraron sucursales.
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
        open={!!editingSucursal}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSucursal(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleEditSucursal}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Sucursal</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique la información de la sucursal
              </DialogDescription>
            </DialogHeader>
            {editingSucursal && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-empresa_id">Empresa</Label>
                  <Select name="empresa_id" defaultValue={editingSucursal.empresa_id} required>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Selecciona una empresa">
                        {(value: string) => getEmpresaNombre(value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.razon_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-codigo">Código</Label>
                    <Input
                      id="edit-codigo"
                      name="codigo"
                      defaultValue={editingSucursal.codigo}
                      required
                      maxLength={20}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-activo">Estado</Label>
                    <Select
                      name="activo"
                      defaultValue={editingSucursal.activo ? "activo" : "inactivo"}
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue>
                          {(value: string) => (value === "activo" ? "Activo" : "Inactivo")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-nombre">Nombre</Label>
                  <Input
                    id="edit-nombre"
                    name="nombre"
                    defaultValue={editingSucursal.nombre}
                    required
                    maxLength={150}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-direccion">Dirección</Label>
                  <Input
                    id="edit-direccion"
                    name="direccion"
                    defaultValue={editingSucursal.direccion ?? ""}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-telefono">Teléfono</Label>
                  <Input
                    id="edit-telefono"
                    name="telefono"
                    defaultValue={editingSucursal.telefono ?? ""}
                    className="bg-input border-border"
                  />
                </div>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingSucursal(null)}>
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
        open={!!deletingSucursal}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSucursal(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Eliminar Sucursal</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas eliminar la sucursal {deletingSucursal?.nombre}? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingSucursal(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteSucursal}
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
