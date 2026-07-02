export interface Broker {
  id: string
  empresa_id: string
  nombre: string
  ruc?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  activo: boolean
  creado_en?: string
  actualizado_en?: string
}

export interface BrokerInput {
  empresa_id: string
  nombre: string
  ruc?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  activo?: boolean
}
