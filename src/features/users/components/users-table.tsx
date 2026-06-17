"use client"

import { useState } from "react"
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
import {
  mockUsers,
  departmentConfig,
  type User,
  type Department,
  type UserRole,
} from "@/lib/data/mock-data"
import { MoreHorizontal, Search, UserPlus, Pencil, Trash2 } from "lucide-react"

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  supervisor: "Supervisor",
  tecnico: "Técnico",
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.department.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newUser: User = {
      id: `${Date.now()}`,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as UserRole,
      department: formData.get("department") as Department,
      status: "activo",
    }
    setUsers([...users, newUser])
    setIsAddOpen(false)
  }

  const handleEditUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingUser) return
    const formData = new FormData(e.currentTarget)
    const updatedUser: User = {
      ...editingUser,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as UserRole,
      department: formData.get("department") as Department,
    }
    setUsers(users.map((u) => (u.id === editingUser.id ? updatedUser : u)))
    setEditingUser(null)
  }

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id))
  }

  const toggleUserStatus = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "activo" ? "inactivo" : "activo" }
          : u
      )
    )
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
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Agregar Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <form onSubmit={handleAddUser}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Nuevo Usuario</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Complete la información del nuevo usuario
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input id="name" name="name" required className="bg-input border-border" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input id="email" name="email" type="email" required className="bg-input border-border" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" name="phone" required className="bg-input border-border" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select name="role" required>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="tecnico">Técnico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="department">Departamento</Label>
                        <Select name="department" required>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(departmentConfig) as Department[]).map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {departmentConfig[dept].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground">Usuario</TableHead>
                <TableHead className="text-muted-foreground">Rol</TableHead>
                <TableHead className="text-muted-foreground">Departamento</TableHead>
                <TableHead className="text-muted-foreground">Teléfono</TableHead>
                <TableHead className="text-muted-foreground">Estado</TableHead>
                <TableHead className="text-muted-foreground w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-border hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{roleLabels[user.role]}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${departmentConfig[user.department].color}`} />
                      <span className="text-foreground">{departmentConfig[user.department].label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        user.status === "activo"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {user.status === "activo" ? "Activo" : "Inactivo"}
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
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleUserStatus(user.id)}>
                          {user.status === "activo" ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user.id)}
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
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleEditUser}>
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Usuario</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifique la información del usuario
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nombre completo</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingUser.name}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Correo electrónico</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={editingUser.email}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Teléfono</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    defaultValue={editingUser.phone}
                    required
                    className="bg-input border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-role">Rol</Label>
                    <Select name="role" defaultValue={editingUser.role}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="tecnico">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-department">Departamento</Label>
                    <Select name="department" defaultValue={editingUser.department}>
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(departmentConfig) as Department[]).map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {departmentConfig[dept].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
