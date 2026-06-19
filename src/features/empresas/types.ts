export interface Empresa {
  id: string
  ruc: string
  razon_social: string
  nombre_comercial: string | null
  direccion: string | null
  telefono: string | null
  email: string | null
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface EmpresaInput {
  ruc: string
  razon_social: string
  nombre_comercial?: string
  direccion?: string
  telefono?: string
  email?: string
  activo: boolean
}
