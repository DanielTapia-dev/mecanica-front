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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, UserPlus } from "lucide-react"
import { useAuth } from "@/features/auth/auth-context"
import {
  UsersServiceError,
  usersService,
} from "@/features/users/services/users-service"
import type { CreateUsuarioInput, Usuario, UsuarioRolDetalle } from "@/features/users/types"

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

export function UsersTable() {
  const { user } = useAuth()
  const empresaId = user?.empresaId ?? user?.empresa_id
  const sucursalId = user?.sucursalId ?? user?.sucursal_id

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roleByUsuario, setRoleByUsuario] = useState<Record<string, RolResumen | undefined>>({})
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingAdd, setIsSavingAdd] = useState(false)

  const loadUsuarios = async () => {
    try {
      const token = getAuthToken()
      const [usuariosList, roleAssignments] = await Promise.all([
        usersService.listUsuarios({ token }),
        usersService.listUsuarioRolesDetalle({ token }),
      ])

      const nextRoleByUsuario: Record<string, RolResumen | undefined> = {}
      roleAssignments.forEach((assignment) => {
        nextRoleByUsuario[assignment.usuario_id] = assignment.rol
      })

      setUsuarios(usuariosList)
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
                    </TableRow>
                  )
                })}
                {filteredUsuarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
