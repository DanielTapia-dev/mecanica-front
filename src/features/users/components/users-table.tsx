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
import { Loader2, MoreHorizontal, Search, ShieldOff, UserCog, UserPlus } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import {
  UsersServiceError,
  usersService,
} from "@/features/users/services/users-service"
import type { CreateUsuarioInput, Role, Usuario } from "@/features/users/types"

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

export function UsersTable() {
  const { user } = useAuth()
  const empresaId = user?.empresaId ?? user?.empresa_id
  const sucursalId = user?.sucursalId ?? user?.sucursal_id

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [roleByUsuario, setRoleByUsuario] = useState<Record<string, Role | undefined>>({})
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [removingRoleUsuario, setRemovingRoleUsuario] = useState<Usuario | null>(null)
  const [removeRoleError, setRemoveRoleError] = useState<string | null>(null)
  const [isRemovingRole, setIsRemovingRole] = useState(false)

  const loadUsuarios = async () => {
    try {
      const token = getAuthToken()
      const [usuariosList, rolesList, roleAssignments] = await Promise.all([
        usersService.listUsuarios({ token }),
        usersService.listRoles({ token }),
        usersService.listUsuarioRolesDetalle({ token }),
      ])

      const nextRoleByUsuario: Record<string, Role | undefined> = {}
      roleAssignments.forEach((assignment) => {
        nextRoleByUsuario[assignment.usuario_id] =
          rolesList.find((role) => role.id === assignment.rol_id) ?? {
            ...assignment.rol,
            empresa_id: assignment.empresa_id,
            sucursal_id: assignment.sucursal_id,
            creado_en: assignment.creado_en,
            actualizado_en: assignment.creado_en,
          }
      })

      setUsuarios(usuariosList)
      setRoles(rolesList)
      setRoleByUsuario(nextRoleByUsuario)
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
    const rolId = formData.get("rol_id") as string
    setIsSavingAdd(true)
    setAddError(null)

    try {
      const token = getAuthToken()
      const nuevoUsuario = await usersService.createUsuario(
        readCreateUsuarioInput(formData, empresaId, sucursalId),
        { token }
      )
      await usersService.assignUsuarioRol(nuevoUsuario.id, rolId, { token })
      await loadUsuarios()
      setIsAddOpen(false)
    } catch (error) {
      setAddError(getErrorMessage(error, "No fue posible crear el usuario."))
    } finally {
      setIsSavingAdd(false)
    }
  }

  const handleEditUsuario = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUsuario) return

    const formData = new FormData(e.currentTarget)
    const nuevoRolId = formData.get("rol_id") as string
    const rolActual = roleByUsuario[editingUsuario.id]

    if (rolActual?.id === nuevoRolId) {
      setEditingUsuario(null)
      return
    }

    setIsSavingEdit(true)
    setEditError(null)

    try {
      const token = getAuthToken()

      if (rolActual) {
        await usersService.removeUsuarioRol(editingUsuario.id, rolActual.id, { token })
      }

      await usersService.assignUsuarioRol(editingUsuario.id, nuevoRolId, { token })
      await loadUsuarios()
      setEditingUsuario(null)
    } catch (error) {
      setEditError(getErrorMessage(error, "No fue posible actualizar el rol del usuario."))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleRemoveRole = async () => {
    if (!removingRoleUsuario) return
    const rolActual = roleByUsuario[removingRoleUsuario.id]
    if (!rolActual) return

    setIsRemovingRole(true)
    setRemoveRoleError(null)

    try {
      await usersService.removeUsuarioRol(removingRoleUsuario.id, rolActual.id, {
        token: getAuthToken(),
      })
      await loadUsuarios()
      setRemovingRoleUsuario(null)
    } catch (error) {
      setRemoveRoleError(getErrorMessage(error, "No fue posible quitar el rol del usuario."))
    } finally {
      setIsRemovingRole(false)
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
                    <div className="grid gap-2">
                      <Label htmlFor="rol_id">Rol</Label>
                      <Select name="rol_id" required>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.nombre}
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
                  <TableHead className="text-muted-foreground w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => {
                  const rolActual = roleByUsuario[usuario.id]

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
                              <UserCog className="mr-2 h-4 w-4" />
                              Editar rol
                            </DropdownMenuItem>
                            {rolActual && (
                              <DropdownMenuItem
                                onClick={() => setRemovingRoleUsuario(usuario)}
                                className="text-destructive"
                              >
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Quitar rol
                              </DropdownMenuItem>
                            )}
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

      {/* Edit Role Dialog */}
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
              <DialogTitle className="text-foreground">Editar Rol</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique el rol asignado al usuario
              </DialogDescription>
            </DialogHeader>
            {editingUsuario && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre completo</Label>
                  <p className="text-foreground">
                    {editingUsuario.nombre} {editingUsuario.apellido}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Correo electrónico</Label>
                  <p className="text-muted-foreground">{editingUsuario.email}</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-rol_id">Rol</Label>
                  <Select
                    name="rol_id"
                    defaultValue={roleByUsuario[editingUsuario.id]?.id}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
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

      {/* Remove Role Confirmation Dialog */}
      <Dialog
        open={!!removingRoleUsuario}
        onOpenChange={(open) => {
          if (!open) {
            setRemovingRoleUsuario(null)
            setRemoveRoleError(null)
          }
        }}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Quitar Rol</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Seguro que deseas quitar el rol{" "}
              {removingRoleUsuario && roleByUsuario[removingRoleUsuario.id]?.nombre} a{" "}
              {removingRoleUsuario?.nombre} {removingRoleUsuario?.apellido}?
            </DialogDescription>
          </DialogHeader>
          {removeRoleError && <p className="text-sm text-destructive">{removeRoleError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRemovingRoleUsuario(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRemoveRole}
              disabled={isRemovingRole}
            >
              {isRemovingRole ? "Quitando..." : "Quitar rol"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
