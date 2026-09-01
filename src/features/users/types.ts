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
  rol_id: string
  nombre: string
  apellido: string
  email: string
  username: string | null
  telefono: string | null
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface CreateUsuarioInput {
  empresa_id: string
  sucursal_id: string
  rol_id: string
  nombre: string
  apellido: string
  email: string
  username: string
  password: string
  telefono?: string
}

export interface UpdateUsuarioInput {
  sucursal_id?: string
  rol_id?: string
  nombre?: string
  apellido?: string
  email?: string
  username?: string
  telefono?: string
  password?: string
}
