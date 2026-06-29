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
  password: string
  telefono?: string
}

export interface UpdateUsuarioInput {
  rol_id?: string
  nombre?: string
  apellido?: string
  email?: string
  telefono?: string
  password?: string
}
