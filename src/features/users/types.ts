export interface Role {
  id: string
  empresa_id: string
  sucursal_id: string
  codigo: string
  nombre: string
  tipo_rol: string
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface Usuario {
  id: string
  empresa_id: string
  sucursal_id: string
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface UsuarioRol {
  id: string
  empresa_id: string
  sucursal_id: string
  usuario_id: string
  rol_id: string
  creado_en: string
}

export interface UsuarioRolDetalle extends UsuarioRol {
  usuario: Pick<Usuario, "id" | "nombre" | "apellido" | "email" | "telefono" | "activo">
  rol: Pick<Role, "id" | "codigo" | "nombre" | "tipo_rol" | "activo">
}

export interface CreateUsuarioInput {
  empresa_id: string
  sucursal_id: string
  nombre: string
  apellido: string
  email: string
  password: string
  telefono?: string
}

export interface UpdateUsuarioInput {
  nombre?: string
  apellido?: string
  email?: string
  telefono?: string
  password?: string
}
