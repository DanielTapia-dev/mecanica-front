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
import { Car, Loader2, MoreHorizontal, Pencil, Search, Trash2 } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import {
  VehiculosApiError,
  createVehiculo,
  deleteVehiculo,
  fetchVehiculos,
  updateVehiculo,
} from "@/features/vehiculos/services/vehiculos-service"
import type { Vehiculo, VehiculoInput } from "@/features/vehiculos/types"
import { fetchClientes } from "@/features/clientes/services/clientes-service"
import type { Cliente } from "@/features/clientes/types"

function readVehiculoInput(
  formData: FormData,
  empresaId: string,
  sucursalId: string
): VehiculoInput {
  const anio = (formData.get("anio") as string).trim()
  const kilometraje = (formData.get("kilometraje") as string).trim()
  const placa = (formData.get("placa") as string).trim().toUpperCase()

  return {
    empresa_id: empresaId,
    sucursal_id: sucursalId,
    cliente_id: formData.get("cliente_id") as string,
    placa,
    vin: placa,
    marca: (formData.get("marca") as string).trim(),
    modelo: (formData.get("modelo") as string).trim(),
    anio: anio ? Number(anio) : undefined,
    color: (formData.get("color") as string)?.trim() || undefined,
    kilometraje: kilometraje ? Number(kilometraje) : 0,
    activo: formData.get("activo") === "activo",
  }
}

export function VehiculosTable() {
  const { user } = useAuth()
  const empresaId = user?.empresaId ?? user?.empresa_id
  const sucursalId = user?.sucursalId ?? user?.sucursal_id

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingVehiculo, setDeletingVehiculo] = useState<Vehiculo | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof VehiculosApiError ? error.message : fallback

  const getClienteNombre = (vehiculo: Vehiculo) => {
    if (vehiculo.cliente) {
      return `${vehiculo.cliente.nombre} ${vehiculo.cliente.apellido}`
    }

    const cliente = clientes.find((item) => item.id === vehiculo.cliente_id)
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : vehiculo.cliente_id
  }

  const loadData = async () => {
    try {
      const [vehiculosData, clientesData] = await Promise.all([fetchVehiculos(), fetchClientes()])
      setVehiculos(vehiculosData.vehiculos)
      setClientes(clientesData.clientes)
      setLoadError(null)
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible cargar los vehículos."))
    }
  }

  useEffect(() => {
    loadData().finally(() => setIsLoading(false))
  }, [])

  const filteredVehiculos = vehiculos.filter(
    (vehiculo) =>
      vehiculo.placa.toLowerCase().includes(search.toLowerCase()) ||
      vehiculo.marca.toLowerCase().includes(search.toLowerCase()) ||
      vehiculo.modelo.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddVehiculo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!empresaId || !sucursalId) {
      setAddError("No se pudo determinar la empresa del usuario actual.")
      return
    }

    const formData = new FormData(e.currentTarget)
    setIsSavingAdd(true)
    setAddError(null)

    try {
      await createVehiculo(readVehiculoInput(formData, empresaId, sucursalId))
      await loadData()
      setIsAddOpen(false)
    } catch (error) {
      setAddError(getErrorMessage(error, "No fue posible crear el vehículo."))
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleEditVehiculo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingVehiculo) return

    if (!empresaId || !sucursalId) {
      setEditError("No se pudo determinar la empresa del usuario actual.")
      return
    }

    const formData = new FormData(e.currentTarget)
    setIsSavingEdit(true)
    setEditError(null)

    try {
      await updateVehiculo(editingVehiculo.id, readVehiculoInput(formData, empresaId, sucursalId))
      await loadData()
      setEditingVehiculo(null)
    } catch (error) {
      setEditError(getErrorMessage(error, "No fue posible actualizar el vehículo."))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteVehiculo = async () => {
    if (!deletingVehiculo) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteVehiculo(deletingVehiculo.id)
      await loadData()
      setDeletingVehiculo(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, "No fue posible eliminar el vehículo."))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActivo = async (vehiculo: Vehiculo) => {
    setLoadError(null)
    try {
      await updateVehiculo(vehiculo.id, { activo: !vehiculo.activo })
      await loadData()
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible actualizar el estado del vehículo."))
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-foreground">Gestión de Vehículos</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar vehículos..."
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
                  <Car className="h-4 w-4" />
                  Agregar Vehículo
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <form onSubmit={handleAddVehiculo}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Nuevo Vehículo</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Complete la información del nuevo vehículo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cliente_id">Cliente</Label>
                      <Select name="cliente_id" required>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Selecciona un cliente">
                            {(value: string) => {
                              const cliente = clientes.find((item) => item.id === value)
                              return cliente ? `${cliente.nombre} ${cliente.apellido}` : value
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nombre} {cliente.apellido}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="placa">Placa</Label>
                        <Input
                          id="placa"
                          name="placa"
                          required
                          maxLength={30}
                          className="bg-input border-border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="marca">Marca</Label>
                        <Input
                          id="marca"
                          name="marca"
                          required
                          maxLength={100}
                          className="bg-input border-border"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="modelo">Modelo</Label>
                      <Input
                        id="modelo"
                        name="modelo"
                        required
                        maxLength={100}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="anio">Año</Label>
                        <Input
                          id="anio"
                          name="anio"
                          type="number"
                          className="bg-input border-border"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="color">Color</Label>
                        <Input id="color" name="color" maxLength={60} className="bg-input border-border" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="kilometraje">Kilometraje</Label>
                        <Input
                          id="kilometraje"
                          name="kilometraje"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue="0"
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
            Cargando vehículos...
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Vehículo</TableHead>
                  <TableHead className="text-muted-foreground">Cliente</TableHead>
                  <TableHead className="text-muted-foreground">Placa</TableHead>
                  <TableHead className="text-muted-foreground">Kilometraje</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehiculos.map((vehiculo) => (
                  <TableRow key={vehiculo.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">
                          {vehiculo.marca} {vehiculo.modelo}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vehiculo.anio ?? "-"} {vehiculo.color ? `· ${vehiculo.color}` : ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getClienteNombre(vehiculo)}
                    </TableCell>
                    <TableCell className="text-foreground">{vehiculo.placa}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {Number(vehiculo.kilometraje).toLocaleString("es-EC")} km
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          vehiculo.activo
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {vehiculo.activo ? "Activo" : "Inactivo"}
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
                          <DropdownMenuItem onClick={() => setEditingVehiculo(vehiculo)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActivo(vehiculo)}>
                            {vehiculo.activo ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingVehiculo(vehiculo)}
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
                {filteredVehiculos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No se encontraron vehículos.
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
        open={!!editingVehiculo}
        onOpenChange={(open) => {
          if (!open) {
            setEditingVehiculo(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleEditVehiculo}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Vehículo</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique la información del vehículo
              </DialogDescription>
            </DialogHeader>
            {editingVehiculo && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-cliente_id">Cliente</Label>
                  <Select name="cliente_id" defaultValue={editingVehiculo.cliente_id} required>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Selecciona un cliente">
                        {(value: string) => {
                          const cliente = clientes.find((item) => item.id === value)
                          return cliente ? `${cliente.nombre} ${cliente.apellido}` : value
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre} {cliente.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-placa">Placa</Label>
                    <Input
                      id="edit-placa"
                      name="placa"
                      defaultValue={editingVehiculo.placa}
                      required
                      maxLength={30}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-marca">Marca</Label>
                    <Input
                      id="edit-marca"
                      name="marca"
                      defaultValue={editingVehiculo.marca}
                      required
                      maxLength={100}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-modelo">Modelo</Label>
                  <Input
                    id="edit-modelo"
                    name="modelo"
                    defaultValue={editingVehiculo.modelo}
                    required
                    maxLength={100}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-anio">Año</Label>
                    <Input
                      id="edit-anio"
                      name="anio"
                      type="number"
                      defaultValue={editingVehiculo.anio ?? ""}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-color">Color</Label>
                    <Input
                      id="edit-color"
                      name="color"
                      defaultValue={editingVehiculo.color ?? ""}
                      maxLength={60}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-kilometraje">Kilometraje</Label>
                    <Input
                      id="edit-kilometraje"
                      name="kilometraje"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={editingVehiculo.kilometraje}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-activo">Estado</Label>
                    <Select
                      name="activo"
                      defaultValue={editingVehiculo.activo ? "activo" : "inactivo"}
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
                {editError && <p className="text-sm text-destructive">{editError}</p>}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingVehiculo(null)}>
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
        open={!!deletingVehiculo}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingVehiculo(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Eliminar Vehículo</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas eliminar el vehículo {deletingVehiculo?.placa}? Esta acción no se
              puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingVehiculo(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteVehiculo}
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
