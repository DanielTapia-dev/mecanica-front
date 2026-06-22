export interface VehiculoClienteResumen {
  id: string
  nombre: string
  apellido: string
  documento?: string | null
  telefono?: string | null
  email?: string | null
}

export interface Vehiculo {
  id: string
  empresa_id: string
  sucursal_id: string
  cliente_id: string
  placa: string
  vin: string | null
  marca: string
  modelo: string
  anio: number | null
  color: string | null
  kilometraje: string
  activo: boolean
  creado_en: string
  actualizado_en: string
  cliente?: VehiculoClienteResumen
}

export interface VehiculoInput {
  empresa_id: string
  sucursal_id: string
  cliente_id: string
  placa: string
  vin?: string
  marca: string
  modelo: string
  anio?: number
  color?: string
  kilometraje: number
  activo: boolean
}
