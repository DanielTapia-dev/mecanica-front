export interface EncuestaPlantilla {
  id: string
  empresa_id: string
  sucursal_id: string
  nombre: string
  descripcion: string | null
  activo: boolean
  vigente_desde: string
  vigente_hasta: string | null
  creado_en: string
  actualizado_en: string
  preguntas?: EncuestaPregunta[]
}

export interface CreateEncuestaPlantillaInput {
  empresa_id: string
  sucursal_id: string
  nombre: string
  descripcion?: string
  activo?: boolean
  vigente_desde?: string
  vigente_hasta?: string
}

export type UpdateEncuestaPlantillaInput = Partial<
  Pick<
    CreateEncuestaPlantillaInput,
    "nombre" | "descripcion" | "activo" | "vigente_desde" | "vigente_hasta"
  >
>

export interface EncuestaPregunta {
  id: string
  plantilla_id: string
  empresa_id: string
  sucursal_id: string
  texto_pregunta: string
  descripcion_ayuda: string | null
  escala_min: number
  escala_max: number
  etiqueta_min: string
  etiqueta_max: string
  orden_visual: number
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface CreateEncuestaPreguntaInput {
  plantilla_id: string
  empresa_id: string
  sucursal_id: string
  texto_pregunta: string
  descripcion_ayuda?: string
  escala_min?: number
  escala_max?: number
  etiqueta_min?: string
  etiqueta_max?: string
  orden_visual?: number
  activo?: boolean
}

export type UpdateEncuestaPreguntaInput = Partial<
  Pick<
    CreateEncuestaPreguntaInput,
    | "texto_pregunta"
    | "descripcion_ayuda"
    | "escala_min"
    | "escala_max"
    | "etiqueta_min"
    | "etiqueta_max"
    | "orden_visual"
    | "activo"
  >
>

export interface EncuestaRespuestaItem {
  id: string
  respuesta_id: string
  pregunta_id: string
  calificacion: number
  creado_en: string
  pregunta?: Pick<
    EncuestaPregunta,
    "id" | "texto_pregunta" | "escala_min" | "escala_max" | "orden_visual"
  >
}

export interface EncuestaRespuesta {
  id: string
  empresa_id: string
  sucursal_id: string
  orden_id: string
  plantilla_id: string
  placa: string
  comentario_general: string | null
  fecha_respuesta: string
  creado_en: string
  items?: EncuestaRespuestaItem[]
}

export interface EncuestaFormularioResponse {
  ya_respondida: boolean
  orden_id?: string
  plantilla?: EncuestaPlantilla
  message?: string
}

export interface CreateEncuestaRespuestaInput {
  orden_id: string
  comentario_general?: string
  items: Array<{ pregunta_id: string; calificacion: number }>
}
