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
import { ListChecks, Loader2, MoreHorizontal, Pencil, Search, ShieldPlus, Trash2 } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import { RolesServiceError, rolesService } from "@/features/roles/services/roles-service"
import type { CreateRoleInput, Role, TipoRol, UpdateRoleInput } from "@/features/roles/types"
import { usersService } from "@/features/users/services/users-service"
import { estadosProcesoService } from "@/features/estados-proceso/services/estados-proceso-service"
import type { EstadoProceso } from "@/features/estados-proceso/types"
import { RolEstadosServiceError, rolEstadosService } from "@/features/rol-estados/services/rol-estados-service"
import type { RolEstado } from "@/features/rol-estados/types"

const TIPO_ROL_OPTIONS: { value: TipoRol; label: string }[] = [
  { value: "SISTEMA", label: "Sistema" },
  { value: "DEPARTAMENTO", label: "Departamento" },
  { value: "CLIENTE", label: "Cliente" },
]

const TIPO_ROL_LABELS: Record<string, string> = {
  SISTEMA: "Sistema",
  DEPARTAMENTO: "Departamento",
  CLIENTE: "Cliente",
}

function getAuthToken() {
  return localStorage.getItem("auth_token") ?? undefined
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof RolesServiceError ? error.message : fallback
}

function getEstadosErrorMessage(error: unknown, fallback: string) {
  return error instanceof RolEstadosServiceError ? error.message : fallback
}

function readCreateRoleInput(
  formData: FormData,
  empresaId: string,
  sucursalId: string
): CreateRoleInput {
  return {
    empresa_id: empresaId,
    sucursal_id: sucursalId,
    codigo: (formData.get("codigo") as string).trim().toUpperCase(),
    nombre: (formData.get("nombre") as string).trim(),
    tipo_rol: formData.get("tipo_rol") as string,
    activo: formData.get("activo") === "activo",
  }
}

function readUpdateRoleInput(formData: FormData): UpdateRoleInput {
  return {
    codigo: (formData.get("codigo") as string).trim().toUpperCase(),
    nombre: (formData.get("nombre") as string).trim(),
    tipo_rol: formData.get("tipo_rol") as string,
    activo: formData.get("activo") === "activo",
  }
}

export function RolesTable() {
  const { user } = useAuth()
  const empresaId = user?.empresaId ?? user?.empresa_id
  const sucursalId = user?.sucursalId ?? user?.sucursal_id

  const [roles, setRoles] = useState<Role[]>([])
  const [assignedRoleIds, setAssignedRoleIds] = useState<Set<string>>(new Set())
  const [estadosCatalogo, setEstadosCatalogo] = useState<EstadoProceso[]>([])
  const [rolEstadosByRol, setRolEstadosByRol] = useState<Record<string, RolEstado[]>>({})
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [managingEstadosRole, setManagingEstadosRole] = useState<Role | null>(null)
  const [selectedEstadoIds, setSelectedEstadoIds] = useState<Set<string>>(new Set())
  const [estadosError, setEstadosError] = useState<string | null>(null)
  const [isSavingEstados, setIsSavingEstados] = useState(false)

  const loadRoles = async () => {
    try {
      const token = getAuthToken()
      const [data, usuarios, estadosList, rolEstadosList] = await Promise.all([
        rolesService.listRoles({ token }),
        usersService.listUsuarios({ token }),
        estadosProcesoService.listEstadosProceso({ token }),
        empresaId
          ? rolEstadosService.listRolEstadosByEmpresa(empresaId, { token })
          : Promise.resolve([] as RolEstado[]),
      ])
      setRoles(data)
      setAssignedRoleIds(new Set(usuarios.map((usuario) => usuario.rol_id)))
      setEstadosCatalogo(estadosList.filter((estado) => estado.activo))

      const nextRolEstadosByRol: Record<string, RolEstado[]> = {}
      rolEstadosList.forEach((rolEstado) => {
        const current = nextRolEstadosByRol[rolEstado.rol_id] ?? []
        current.push(rolEstado)
        nextRolEstadosByRol[rolEstado.rol_id] = current
      })
      setRolEstadosByRol(nextRolEstadosByRol)
      setLoadError(null)
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible cargar los roles."))
    }
  }

  useEffect(() => {
    loadRoles().finally(() => setIsLoading(false))
  }, [])

  const filteredRoles = roles.filter(
    (role) =>
      role.nombre.toLowerCase().includes(search.toLowerCase()) ||
      role.codigo.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!empresaId || !sucursalId) {
      setAddError("No se pudo determinar la empresa del usuario actual.")
      return
    }

    const formData = new FormData(e.currentTarget)
    setIsSavingAdd(true)
    setAddError(null)

    try {
      const token = getAuthToken()
      await rolesService.createRole(readCreateRoleInput(formData, empresaId, sucursalId), {
        token,
      })
      await loadRoles()
      setIsAddOpen(false)
    } catch (error) {
      setAddError(getErrorMessage(error, "No fue posible crear el rol."))
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleEditRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingRole) return

    const formData = new FormData(e.currentTarget)
    setIsSavingEdit(true)
    setEditError(null)

    try {
      const token = getAuthToken()
      await rolesService.updateRole(editingRole.id, readUpdateRoleInput(formData), { token })
      await loadRoles()
      setEditingRole(null)
    } catch (error) {
      setEditError(getErrorMessage(error, "No fue posible actualizar el rol."))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!deletingRole) return

    if (assignedRoleIds.has(deletingRole.id)) {
      setDeleteError("No se puede eliminar un rol que ya esta asignado a un usuario.")
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const token = getAuthToken()
      await rolesService.deleteRole(deletingRole.id, { token })
      await loadRoles()
      setDeletingRole(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, "No fue posible eliminar el rol."))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActivo = async (role: Role) => {
    setLoadError(null)
    try {
      const token = getAuthToken()
      await rolesService.updateRole(role.id, { activo: !role.activo }, { token })
      await loadRoles()
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible actualizar el estado del rol."))
    }
  }

  const handleOpenEstados = (role: Role) => {
    setManagingEstadosRole(role)
    setSelectedEstadoIds(
      new Set((rolEstadosByRol[role.id] ?? []).map((rolEstado) => rolEstado.estado_id))
    )
    setEstadosError(null)
  }

  const handleToggleEstado = (estadoId: string) => {
    setSelectedEstadoIds((current) => {
      const next = new Set(current)
      if (next.has(estadoId)) {
        next.delete(estadoId)
      } else {
        next.add(estadoId)
      }
      return next
    })
  }

  const handleSaveEstados = async () => {
    if (!managingEstadosRole) return

    if (!empresaId) {
      setEstadosError("No se pudo determinar la empresa del usuario actual.")
      return
    }

    const currentRolEstados = rolEstadosByRol[managingEstadosRole.id] ?? []
    const currentEstadoIds = new Set(currentRolEstados.map((rolEstado) => rolEstado.estado_id))
    const toAdd = [...selectedEstadoIds].filter((estadoId) => !currentEstadoIds.has(estadoId))
    const toRemove = currentRolEstados.filter(
      (rolEstado) => !selectedEstadoIds.has(rolEstado.estado_id)
    )

    setIsSavingEstados(true)
    setEstadosError(null)

    try {
      const token = getAuthToken()
      await Promise.all([
        ...toAdd.map((estadoId) =>
          rolEstadosService.createRolEstado(
            { empresa_id: empresaId, rol_id: managingEstadosRole.id, estado_id: estadoId },
            { token }
          )
        ),
        ...toRemove.map((rolEstado) =>
          rolEstadosService.deleteRolEstado(rolEstado.id, { token })
        ),
      ])
      await loadRoles()
      setManagingEstadosRole(null)
    } catch (error) {
      setEstadosError(
        getEstadosErrorMessage(error, "No fue posible actualizar los estados del rol.")
      )
    } finally {
      setIsSavingEstados(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-foreground">Gestión de Roles</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar roles..."
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
                  <ShieldPlus className="h-4 w-4" />
                  Agregar Rol
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <form onSubmit={handleAddRole}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Nuevo Rol</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Complete la información del nuevo rol
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="codigo">Código</Label>
                        <Input
                          id="codigo"
                          name="codigo"
                          required
                          maxLength={80}
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
                      <Label htmlFor="tipo_rol">Tipo de rol</Label>
                      <Select name="tipo_rol" defaultValue="DEPARTAMENTO" required>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue>
                            {(value: TipoRol) =>
                              TIPO_ROL_LABELS[value] ?? value
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_ROL_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
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
            Cargando roles...
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Código</TableHead>
                  <TableHead className="text-muted-foreground">Nombre</TableHead>
                  <TableHead className="text-muted-foreground">Tipo</TableHead>
                  <TableHead className="text-muted-foreground">Estados de proceso</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => {
                  const isAssigned = assignedRoleIds.has(role.id)
                  const estadosAsignados = rolEstadosByRol[role.id]?.length ?? 0

                  return (
                  <TableRow key={role.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">{role.codigo}</TableCell>
                    <TableCell className="text-foreground">{role.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {TIPO_ROL_LABELS[role.tipo_rol] ?? role.tipo_rol}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleOpenEstados(role)}
                        className="text-sm text-primary hover:underline"
                      >
                        {estadosAsignados} estado{estadosAsignados === 1 ? "" : "s"}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          role.activo
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {role.activo ? "Activo" : "Inactivo"}
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
                          <DropdownMenuItem onClick={() => setEditingRole(role)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenEstados(role)}>
                            <ListChecks className="mr-2 h-4 w-4" />
                            Estados
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActivo(role)}>
                            {role.activo ? "Desactivar" : "Activar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingRole(role)}
                            disabled={isAssigned}
                            title={
                              isAssigned
                                ? "No se puede eliminar: el rol esta asignado a un usuario"
                                : undefined
                            }
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )
                })}
                {filteredRoles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No se encontraron roles.
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
        open={!!editingRole}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRole(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleEditRole}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Rol</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique la información del rol
              </DialogDescription>
            </DialogHeader>
            {editingRole && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-codigo">Código</Label>
                    <Input
                      id="edit-codigo"
                      name="codigo"
                      defaultValue={editingRole.codigo}
                      required
                      maxLength={80}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-activo">Estado</Label>
                    <Select name="activo" defaultValue={editingRole.activo ? "activo" : "inactivo"}>
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
                  <Label htmlFor="edit-nombre">Nombre</Label>
                  <Input
                    id="edit-nombre"
                    name="nombre"
                    defaultValue={editingRole.nombre}
                    required
                    maxLength={150}
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-tipo_rol">Tipo de rol</Label>
                  <Select name="tipo_rol" defaultValue={editingRole.tipo_rol}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue>
                        {(value: TipoRol) => TIPO_ROL_LABELS[value] ?? value}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_ROL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingEdit}>
                {isSavingEdit ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Estados Dialog */}
      <Dialog
        open={!!managingEstadosRole}
        onOpenChange={(open) => {
          if (!open) {
            setManagingEstadosRole(null)
            setEstadosError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Estados de Proceso</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Selecciona los estados de proceso visibles para el rol{" "}
              {managingEstadosRole?.nombre}.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto py-2">
            {estadosCatalogo.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay estados de proceso activos disponibles.
              </p>
            )}
            {estadosCatalogo.map((estado) => (
              <label
                key={estado.id}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={selectedEstadoIds.has(estado.id)}
                  onChange={() => handleToggleEstado(estado.id)}
                  className="h-4 w-4 rounded border-input"
                />
                <span>
                  {estado.nombre}{" "}
                  <span className="text-xs text-muted-foreground">({estado.codigo})</span>
                </span>
              </label>
            ))}
          </div>
          {estadosError && <p className="text-sm text-destructive">{estadosError}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setManagingEstadosRole(null)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveEstados} disabled={isSavingEstados}>
              {isSavingEstados ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingRole}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRole(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Eliminar Rol</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas eliminar el rol {deletingRole?.nombre}? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingRole(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteRole}
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