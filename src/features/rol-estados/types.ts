export interface RolEstado {
  id: string
  empresa_id: string
  rol_id: string
  estado_id: string
  creado_en: string
}

export interface CreateRolEstadoInput {
  empresa_id: string
  rol_id: string
  estado_id: string
}
