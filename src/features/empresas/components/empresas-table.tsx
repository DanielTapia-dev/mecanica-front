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
import { Building2, Loader2, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react"
import {
  EmpresasApiError,
  createEmpresa,
  deleteEmpresa,
  fetchEmpresas,
  updateEmpresa,
} from "@/features/empresas/services/empresas-service"
import type { Empresa, EmpresaInput } from "@/features/empresas/types"

function readEmpresaInput(formData: FormData): EmpresaInput {
  return {
    ruc: (formData.get("ruc") as string).trim(),
    razon_social: (formData.get("razon_social") as string).trim(),
    nombre_comercial: (formData.get("nombre_comercial") as string)?.trim() || undefined,
    direccion: (formData.get("direccion") as string)?.trim() || undefined,
    telefono: (formData.get("telefono") as string)?.trim() || undefined,
    email: (formData.get("email") as string)?.trim() || undefined,
    activo: formData.get("activo") === "activo",
  }
}

export function EmpresasTable() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingEmpresa, setDeletingEmpresa] = useState<Empresa | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadEmpresas = async () => {
    try {
      const data = await fetchEmpresas()
      setEmpresas(data.empresas)
      setLoadError(null)
    } catch (error) {
      setLoadError(
        error instanceof EmpresasApiError
          ? error.message
          : "No fue posible cargar las empresas."
      )
    }
  }

  useEffect(() => {
    loadEmpresas().finally(() => setIsLoading(false))
  }, [])

  const filteredEmpresas = empresas.filter(
    (empresa) =>
      empresa.razon_social.toLowerCase().includes(search.toLowerCase()) ||
      empresa.ruc.toLowerCase().includes(search.toLowerCase()) ||
      (empresa.nombre_comercial ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const handleAddEmpresa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setIsSavingAdd(true)
    setAddError(null)

    try {
      await createEmpresa(readEmpresaInput(formData))
      await loadEmpresas()
      setIsAddOpen(false)
    } catch (error) {
      setAddError(
        error instanceof EmpresasApiError
          ? error.message
          : "No fue posible crear la empresa."
      )
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleEditEmpresa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingEmpresa) return
    const formData = new FormData(e.currentTarget)
    setIsSavingEdit(true)
    setEditError(null)

    try {
      await updateEmpresa(editingEmpresa.id, readEmpresaInput(formData))
      await loadEmpresas()
      setEditingEmpresa(null)
    } catch (error) {
      setEditError(
        error instanceof EmpresasApiError
          ? error.message
          : "No fue posible actualizar la empresa."
      )
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteEmpresa = async () => {
    if (!deletingEmpresa) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteEmpresa(deletingEmpresa.id)
      await loadEmpresas()
      setDeletingEmpresa(null)
    } catch (error) {
      setDeleteError(
        error instanceof EmpresasApiError
          ? error.message
          : "No fue posible eliminar la empresa."
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActivo = async (empresa: Empresa) => {
    setLoadError(null)
    try {
      await updateEmpresa(empresa.id, { activo: !empresa.activo })
      await loadEmpresas()
    } catch (error) {
      setLoadError(
        error instanceof EmpresasApiError
          ? error.message
          : "No fue posible actualizar el estado de la empresa."
      )
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-foreground">Gestión de Empresas</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar empresas..."
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
                  <Building2 className="h-4 w-4" />
                  Agregar Empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <form onSubmit={handleAddEmpresa}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Nueva Empresa</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Complete la información de la nueva empresa
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="ruc">RUC</Label>
                        <Input id="ruc" name="ruc" required maxLength={13} className="bg-input border-border" />
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
                    <div className="grid gap-2">
                      <Label htmlFor="razon_social">Razón social</Label>
                      <Input id="razon_social" name="razon_social" required className="bg-input border-border" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="nombre_comercial">Nombre comercial</Label>
                      <Input id="nombre_comercial" name="nombre_comercial" className="bg-input border-border" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input id="direccion" name="direccion" className="bg-input border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input id="telefono" name="telefono" className="bg-input border-border" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input id="email" name="email" type="email" className="bg-input border-border" />
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
        </div>
      </CardHeader>
      <CardContent>
        {loadError && <p className="mb-4 text-sm text-destructive">{loadError}</p>}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando empresas...
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Empresa</TableHead>
                  <TableHead className="text-muted-foreground">RUC</TableHead>
                  <TableHead className="text-muted-foreground">Teléfono</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.map((empresa) => (
                  <TableRow key={empresa.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{empresa.razon_social}</p>
                        {empresa.nombre_comercial && (
                          <p className="text-sm text-muted-foreground">{empresa.nombre_comercial}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{empresa.ruc}</TableCell>
                    <TableCell className="text-muted-foreground">{empresa.telefono || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{empresa.email || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          empresa.activo
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {empresa.activo ? "Activo" : "Inactivo"}
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
                          <DropdownMenuItem onClick={() => setEditingEmpresa(empresa)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActivo(empresa)}>
                            {empresa.activo ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingEmpresa(empresa)}
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
                {filteredEmpresas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No se encontraron empresas.
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
        open={!!editingEmpresa}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEmpresa(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleEditEmpresa}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Empresa</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique la información de la empresa
              </DialogDescription>
            </DialogHeader>
            {editingEmpresa && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-ruc">RUC</Label>
                    <Input
                      id="edit-ruc"
                      name="ruc"
                      defaultValue={editingEmpresa.ruc}
                      required
                      maxLength={13}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-activo">Estado</Label>
                    <Select name="activo" defaultValue={editingEmpresa.activo ? "activo" : "inactivo"}>
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
                <div className="grid gap-2">
                  <Label htmlFor="edit-razon_social">Razón social</Label>
                  <Input
                    id="edit-razon_social"
                    name="razon_social"
                    defaultValue={editingEmpresa.razon_social}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-nombre_comercial">Nombre comercial</Label>
                  <Input
                    id="edit-nombre_comercial"
                    name="nombre_comercial"
                    defaultValue={editingEmpresa.nombre_comercial ?? ""}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-direccion">Dirección</Label>
                  <Input
                    id="edit-direccion"
                    name="direccion"
                    defaultValue={editingEmpresa.direccion ?? ""}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-telefono">Teléfono</Label>
                    <Input
                      id="edit-telefono"
                      name="telefono"
                      defaultValue={editingEmpresa.telefono ?? ""}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-email">Correo electrónico</Label>
                    <Input
                      id="edit-email"
                      name="email"
                      type="email"
                      defaultValue={editingEmpresa.email ?? ""}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingEmpresa(null)}>
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
        open={!!deletingEmpresa}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingEmpresa(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Eliminar Empresa</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas eliminar a {deletingEmpresa?.razon_social}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingEmpresa(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteEmpresa} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
