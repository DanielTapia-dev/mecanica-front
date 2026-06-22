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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, MoreHorizontal, Pencil, Search, Trash2, UserCog, UserPlus } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import {
  UsersServiceError,
  usersService,
} from "@/features/users/services/users-service"
import type {
  CreateUsuarioInput,
  UpdateUsuarioInput,
  Usuario,
  UsuarioRolDetalle,
} from "@/features/users/types"
import { rolesService } from "@/features/roles/services/roles-service"
import type { Role } from "@/features/roles/types"

type RolResumen = UsuarioRolDetalle["rol"]

const TIPO_ROL_LABELS: Record<string, string> = {
  SISTEMA: "Sistema",
  DEPARTAMENTO: "Departamento",
  CLIENTE: "Cliente",
}

function getAuthToken() {
  return localStorage.getItem("auth_token") ?? undefined
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof UsersServiceError ? error.message : fallback
}

function readCreateUsuarioInput(
  formData: FormData,
  empresaId: string,
  sucursalId: string
): CreateUsuarioInput {
  return {
    empresa_id: empresaId,
    sucursal_id: sucursalId,
    nombre: (formData.get("nombre") as string).trim(),
    apellido: (formData.get("apellido") as string).trim(),
    email: (formData.get("email") as string).trim(),
    password: formData.get("password") as string,
    telefono: (formData.get("telefono") as string)?.trim() || undefined,
  }
}

function readUpdateUsuarioInput(formData: FormData): UpdateUsuarioInput {
  const password = (formData.get("password") as string).trim()

  return {
    nombre: (formData.get("nombre") as string).trim(),
    apellido: (formData.get("apellido") as string).trim(),
    email: (formData.get("email") as string).trim(),
    telefono: (formData.get("telefono") as string)?.trim() || undefined,
    ...(password ? { password } : {}),
  }
}

export function UsersTable() {
  const { user } = useAuth()
  const empresaId = user?.empresaId ?? user?.empresa_id
  const sucursalId = user?.sucursalId ?? user?.sucursal_id

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roleByUsuario, setRoleByUsuario] = useState<Record<string, RolResumen | undefined>>({})
  const [usuarioRolIdByUsuario, setUsuarioRolIdByUsuario] = useState<Record<string, string>>({})
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [assigningUsuario, setAssigningUsuario] = useState<Usuario | null>(null)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [isSavingAssign, setIsSavingAssign] = useState(false)

  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [deletingUsuario, setDeletingUsuario] = useState<Usuario | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUsuarios = async () => {
    try {
      const token = getAuthToken()
      const [usuariosList, roleAssignments, rolesList] = await Promise.all([
        usersService.listUsuarios({ token }),
        usersService.listUsuarioRolesDetalle({ token }),
        rolesService.listRoles({ token }),
      ])

      const nextRoleByUsuario: Record<string, RolResumen | undefined> = {}
      const nextUsuarioRolIdByUsuario: Record<string, string> = {}
      roleAssignments.forEach((assignment) => {
        nextRoleByUsuario[assignment.usuario_id] = assignment.rol
        nextUsuarioRolIdByUsuario[assignment.usuario_id] = assignment.id
      })

      setUsuarios(usuariosList)
      setRoleByUsuario(nextRoleByUsuario)
      setUsuarioRolIdByUsuario(nextUsuarioRolIdByUsuario)
      setAvailableRoles(rolesList.filter((role) => role.activo))
      setLoadError(null)
    } catch (error) {
      setLoadError(getErrorMessage(error, "No fue posible cargar los usuarios."))
    }
  }

  useEffect(() => {
    loadUsuarios().finally(() => setIsLoading(false))
  }, [])

  const filteredUsuarios = usuarios.filter(
    (usuario) =>
      usuario.nombre.toLowerCase().includes(search.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(search.toLowerCase()) ||
      usuario.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddUsuario = async (e: React.FormEvent<HTMLFormElement>) => {
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
      await usersService.createUsuario(
        readCreateUsuarioInput(formData, empresaId, sucursalId),
        { token }
      )
      await loadUsuarios()
      setIsAddOpen(false)
    } catch (error) {
      setAddError(getErrorMessage(error, "No fue posible crear el usuario."))
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleAssignRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!assigningUsuario) return

    const formData = new FormData(e.currentTarget)
    const rolId = formData.get("rol_id") as string

    if (!rolId) {
      setAssignError("Selecciona un rol para asignar.")
      return
    }

    if (!empresaId || !sucursalId) {
      setAssignError("No se pudo determinar la empresa del usuario actual.")
      return
    }

    setIsSavingAssign(true)
    setAssignError(null)

    try {
      const token = getAuthToken()
      await usersService.assignUsuarioRol(assigningUsuario.id, rolId, empresaId, sucursalId, {
        token,
      })
      await loadUsuarios()
      setAssigningUsuario(null)
    } catch (error) {
      setAssignError(getErrorMessage(error, "No fue posible asignar el rol."))
    } finally {
      setIsSavingAssign(false)
    }
  }

  const handleEditUsuario = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUsuario) return

    const formData = new FormData(e.currentTarget)
    const selectedRolId = formData.get("rol_id") as string
    const currentRolId = roleByUsuario[editingUsuario.id]?.id
    const isChangingRole = Boolean(selectedRolId) && selectedRolId !== currentRolId

    if (isChangingRole && (!empresaId || !sucursalId)) {
      setEditError("No se pudo determinar la empresa del usuario actual.")
      return
    }

    setIsSavingEdit(true)
    setEditError(null)

    try {
      const token = getAuthToken()
      await usersService.updateUsuario(editingUsuario.id, readUpdateUsuarioInput(formData), {
        token,
      })

      if (isChangingRole) {
        const currentUsuarioRolId = usuarioRolIdByUsuario[editingUsuario.id]

        if (currentUsuarioRolId) {
          await usersService.removeUsuarioRol(currentUsuarioRolId, { token })
        }

        await usersService.assignUsuarioRol(
          editingUsuario.id,
          selectedRolId,
          empresaId as string,
          sucursalId as string,
          { token }
        )
      }

      await loadUsuarios()
      setEditingUsuario(null)
    } catch (error) {
      setEditError(getErrorMessage(error, "No fue posible actualizar el usuario."))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteUsuario = async () => {
    if (!deletingUsuario) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const token = getAuthToken()
      const usuarioRolId = usuarioRolIdByUsuario[deletingUsuario.id]

      if (usuarioRolId) {
        await usersService.removeUsuarioRol(usuarioRolId, { token })
      }

      await usersService.deleteUsuario(deletingUsuario.id, { token })
      await loadUsuarios()
      setDeletingUsuario(null)
    } catch (error) {
      setDeleteError(getErrorMessage(error, "No fue posible eliminar el usuario."))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-foreground">Gestión de Usuarios</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
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
                  <UserPlus className="h-4 w-4" />
                  Agregar Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <form onSubmit={handleAddUsuario}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Nuevo Usuario</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Complete la información del nuevo usuario
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
                    <div className="grid gap-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input id="email" name="email" type="email" required className="bg-input border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input id="telefono" name="telefono" className="bg-input border-border" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          required
                          minLength={6}
                          className="bg-input border-border"
                        />
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
            Cargando usuarios...
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-muted-foreground">Usuario</TableHead>
                  <TableHead className="text-muted-foreground">Rol</TableHead>
                  <TableHead className="text-muted-foreground">Teléfono</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground w-[1%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => {
                  const rolActual = roleByUsuario[usuario.id]
                  const tieneRol = Boolean(rolActual)

                  return (
                    <TableRow key={usuario.id} className="border-border hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {`${usuario.nombre[0] ?? ""}${usuario.apellido[0] ?? ""}`.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {usuario.nombre} {usuario.apellido}
                            </p>
                            <p className="text-sm text-muted-foreground">{usuario.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {rolActual ? (
                          <div className="flex flex-col gap-1">
                            <span>{rolActual.nombre}</span>
                            <Badge
                              variant="outline"
                              className="w-fit text-xs text-muted-foreground"
                            >
                              {TIPO_ROL_LABELS[rolActual.tipo_rol] ?? rolActual.tipo_rol}
                            </Badge>
                          </div>
                        ) : (
                          "Sin rol"
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {usuario.telefono || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            usuario.activo
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {usuario.activo ? "Activo" : "Inactivo"}
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
                            <DropdownMenuItem onClick={() => setEditingUsuario(usuario)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={tieneRol}
                              title={
                                tieneRol ? "El usuario ya tiene un rol asignado" : undefined
                              }
                              onClick={() => setAssigningUsuario(usuario)}
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              Asignar Rol
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingUsuario(usuario)}
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
                {filteredUsuarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Assign Role Dialog */}
      <Dialog
        open={!!assigningUsuario}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningUsuario(null)
            setAssignError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleAssignRole}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Asignar Rol</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Selecciona el rol que se asignará a{" "}
                {assigningUsuario
                  ? `${assigningUsuario.nombre} ${assigningUsuario.apellido}`
                  : "este usuario"}
                .
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rol_id">Rol</Label>
                <Select name="rol_id" required>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Selecciona un rol">
                      {(value: string) =>
                        availableRoles.find((role) => role.id === value)?.nombre ?? value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {assignError && <p className="text-sm text-destructive">{assignError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssigningUsuario(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingAssign}>
                {isSavingAssign ? "Asignando..." : "Asignar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Usuario Dialog */}
      <Dialog
        open={!!editingUsuario}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUsuario(null)
            setEditError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleEditUsuario}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Usuario</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique la información del usuario
              </DialogDescription>
            </DialogHeader>
            {editingUsuario && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-nombre">Nombre</Label>
                    <Input
                      id="edit-nombre"
                      name="nombre"
                      defaultValue={editingUsuario.nombre}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-apellido">Apellido</Label>
                    <Input
                      id="edit-apellido"
                      name="apellido"
                      defaultValue={editingUsuario.apellido}
                      required
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Correo electrónico</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingUsuario.email}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-telefono">Teléfono</Label>
                    <Input
                      id="edit-telefono"
                      name="telefono"
                      defaultValue={editingUsuario.telefono ?? ""}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-password">Contraseña</Label>
                    <Input
                      id="edit-password"
                      name="password"
                      type="password"
                      placeholder="Dejar en blanco para no cambiar"
                      minLength={6}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-rol_id">Rol</Label>
                  <Select name="rol_id" defaultValue={roleByUsuario[editingUsuario.id]?.id}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Selecciona un rol">
                        {(value: string) =>
                          availableRoles.find((role) => role.id === value)?.nombre ?? value
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingUsuario(null)}>
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
        open={!!deletingUsuario}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingUsuario(null)
            setDeleteError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Eliminar Usuario</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas eliminar a{" "}
              {deletingUsuario
                ? `${deletingUsuario.nombre} ${deletingUsuario.apellido}`
                : "este usuario"}
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeletingUsuario(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUsuario}
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
