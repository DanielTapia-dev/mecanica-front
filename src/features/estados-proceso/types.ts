import type { EstadoProcesoCode } from "./constants"

export interface EstadoProceso {
  id: string
  empresa_id: string
  codigo: EstadoProcesoCode | string
  nombre: string
  mensaje_cliente_default: string
  es_bahia: boolean
  permite_comentario_cliente: boolean
  es_final: boolean
  orden_visual: number
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface CreateEstadoProcesoInput {
  empresa_id: string
  codigo: string
  nombre: string
  mensaje_cliente_default: string
  es_bahia?: boolean
  permite_comentario_cliente?: boolean
  es_final?: boolean
  orden_visual?: number
  activo?: boolean
}

export type UpdateEstadoProcesoInput = Partial<
  Pick<
    CreateEstadoProcesoInput,
    | "codigo"
    | "nombre"
    | "mensaje_cliente_default"
    | "es_bahia"
    | "permite_comentario_cliente"
    | "es_final"
    | "orden_visual"
    | "activo"
  >
>
