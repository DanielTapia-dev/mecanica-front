export interface Cliente {
  id: string
  empresa_id: string
  sucursal_id: string
  cedula: string
  nombre: string
  apellido: string
  documento: string
  telefono: string | null
  email: string | null
  direccion: string | null
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface ClienteInput {
  empresa_id: string
  sucursal_id: string
  cedula: string
  nombre: string
  apellido: string
  documento: string
  telefono?: string
  email?: string
  direccion?: string
  activo: boolean
}
