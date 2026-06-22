export interface Sucursal {
  id: string
  empresa_id: string
  codigo: string
  nombre: string
  direccion: string | null
  telefono: string | null
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface SucursalInput {
  empresa_id: string
  codigo: string
  nombre: string
  direccion?: string
  telefono?: string
  activo: boolean
}
