export interface SeguimientoOrden {
  tipo_registro: "HISTORIAL" | "ESTADO_ACTUAL"
  sort_key: string | null
  orden_id: string
  orden_codigo: string
  fecha_inicio_proceso: string | null
  fecha_finalizacion: string | null
  encuesta_realizada: boolean
  orden_creada_en: string
  orden_actualizada_en: string
  empresa_nombre: string
  sucursal_nombre: string
  vehiculo_placa: string
  vehiculo_marca: string
  vehiculo_modelo: string
  vehiculo_anio: number
  vehiculo_color: string
  cliente_nombre: string
  cliente_cedula: string
  estado_nombre: string
  estado_codigo: string
  sub_estado: string | null
  es_bahia: boolean
  es_final: boolean
  mensaje_cliente: string | null
  historial_id: string | null
  registrado_por: string
  registrado_por_email: string
  fecha_registro: string
}

export interface SeguimientoOrdenResponse {
  seguimiento: SeguimientoOrden[]
}
