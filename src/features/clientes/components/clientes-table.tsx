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
import { Contact, Loader2, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import {
  ClientesApiError,
  createCliente,
  deleteCliente,
  fetchClientes,
  updateCliente,
} from "@/features/clientes/services/clientes-service"
import type { Cliente, ClienteInput } from "@/features/clientes/types"

function readClienteInput(
  formData: FormData,
  empresaId: string,
  sucursalId: string
): ClienteInput {
  const cedula = (formData.get("cedula") as string).trim()

  return {
    empresa_id: empresaId,
    sucursal_id: sucursalId,
    cedula,
    documento: cedula,
    nombre: (formData.get("nombre") as string).trim(),
    apellido: (formData.get("apellido") as string).trim(),
    telefono: (formData.get("telefono") as string)?.trim() || undefined,
    email: (formData.get("email") as string)?.trim() || undefined,
    direccion: (formData.get("direccion") as string)?.trim() || undefined,
    activo: formData.get("activo") === "activo",
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ClientesApiError ? error.message : fallback
}

export function ClientesTable() {
  const { sessionScope } = useAuth()
  const empresaId = sessionScope.empresa_id
  const sucursalId = sessionScope.sucursal_id

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingCliente, setDeletingCliente] = useState<Cliente | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadClientes = useCallback(async () => {
    try {
      const data = await fetchClientes()
      setClientes(data.clientes)
      setLoadError(null)
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible cargar los clientes."))
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadInitialClientes() {
      await loadClientes()

      if (isMounted) {
        setIsLoading(false)
      }
    }

    void loadInitialClientes()

    return () => {
      isMounted = false
    }
  }, [loadClientes])

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
      cliente.apellido.toLowerCase().includes(search.toLowerCase()) ||
      cliente.cedula.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddCliente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!empresaId || !sucursalId) {
      setAddError("No se pudo determinar la empresa del usuario actual.")
      return
    }

    const formData = new FormData(e.currentTarget)
    setIsSavingAdd(true)
    setAddError(null)

    try {
      await createCliente(readClienteInput(formData, empresaId, sucursalId))
      await loadClientes()
      setIsAddOpen(false)
    } catch (error) {
      setAddError(getErrorMessage(error, "No fue posible crear el cliente."))
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleEditCliente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingCliente) return

    if (!empresaId || !sucursalId) {
      setEditError("No se pudo determinar la empresa del usuario actual.")
      return
    }

    const formData = new FormData(e.currentTarget)
    setIsSavingEdit(true)
    setEditError(null)

    try {
      await updateCliente(editingCliente.id, readClienteInput(formData, empresaId, sucursalId))
      await loadClientes()
      setEditingCliente(null)
    } catch (error) {
      setEditError(getErrorMessage(error, "No fue posible actualizar el cliente."))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteCliente = async () => {
    if (!deletingCliente) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteCliente(deletingCliente.id)
      await loadClientes()
      setDeletingCliente(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, "No fue posible eliminar el cliente."))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActivo = async (cliente: Cliente) => {
    setLoadError(null)
    try {
      await updateCliente(cliente.id, { activo: !cliente.activo })
      await loadClientes()
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible actualizar el estado del cliente."))
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-foreground">Gestión de Clientes</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
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
                  <Contact className="h-4 w-4" />
                  Agregar Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <form onSubmit={handleAddCliente}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Nuevo Cliente</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Complete la información del nuevo cliente
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="nombre">Nombre</Label>
                        <Input id="nombre" name="nombre" required className="bg-input border-border" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="apellido">Apellido</Label>
                        <Input id="apellido" name="apellido" required className="bg-input border-border" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cedula">Cédula</Label>
                        <Input
                          id="cedula"
                          name="cedula"
                          required
                          maxLength={10}
                          className="bg-input border-border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input id="telefono" name="telefono" className="bg-input border-border" />
                      </div>
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
                    <div className="grid gap-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input id="email" name="email" type="email" className="bg-input border-border" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input id="direccion" name="direccion" className="bg-input border-border" />
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
            Cargando clientes...
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Cliente</TableHead>
                  <TableHead className="text-muted-foreground">Cédula</TableHead>
                  <TableHead className="text-muted-foreground">Teléfono</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {cliente.nombre} {cliente.apellido}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cliente.email || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">{cliente.cedula}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cliente.telefono || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          cliente.activo
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {cliente.activo ? "Activo" : "Inactivo"}
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
                          <DropdownMenuItem onClick={() => setEditingCliente(cliente)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActivo(cliente)}>
                            {cliente.activo ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingCliente(cliente)}
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
                {filteredClientes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No se encontraron clientes.
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
        open={!!editingCliente}
        onOpenChange={(open) => {
          if (!open) {
            setEditingCliente(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleEditCliente}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Cliente</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique la información del cliente
              </DialogDescription>
            </DialogHeader>
            {editingCliente && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-nombre">Nombre</Label>
                    <Input
                      id="edit-nombre"
                      name="nombre"
                      defaultValue={editingCliente.nombre}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-apellido">Apellido</Label>
                    <Input
                      id="edit-apellido"
                      name="apellido"
                      defaultValue={editingCliente.apellido}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-cedula">Cédula</Label>
                    <Input
                      id="edit-cedula"
                      name="cedula"
                      defaultValue={editingCliente.cedula}
                      required
                      maxLength={10}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-telefono">Teléfono</Label>
                    <Input
                      id="edit-telefono"
                      name="telefono"
                      defaultValue={editingCliente.telefono ?? ""}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-activo">Estado</Label>
                  <Select
                    name="activo"
                    defaultValue={editingCliente.activo ? "activo" : "inactivo"}
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
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Correo electrónico</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingCliente.email ?? ""}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-direccion">Dirección</Label>
                  <Input
                    id="edit-direccion"
                    name="direccion"
                    defaultValue={editingCliente.direccion ?? ""}
                    className="bg-input border-border"
                  />
                </div>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingCliente(null)}>
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
        open={!!deletingCliente}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCliente(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Eliminar Cliente</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas eliminar a {deletingCliente?.nombre} {deletingCliente?.apellido}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingCliente(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteCliente}
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
