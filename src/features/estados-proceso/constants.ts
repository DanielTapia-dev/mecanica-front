export const ESTADO_PROCESO_CODES = {
  ASESOR: "ASESOR",
  JEFE_TALLER: "JEFE_TALLER",
  REPUESTOS: "REPUESTOS",
  PROGRAMAR_CITA: "PROGRAMAR_CITA",
  ENDEREZADA: "ENDEREZADA",
  PINTURA: "PINTURA",
  ENSAMBLAJE: "ENSAMBLAJE",
  MECANICA: "MECANICA",
  LAVADO: "LAVADO",
  FINALIZADO: "FINALIZADO",
} as const

export type EstadoProcesoCode =
  (typeof ESTADO_PROCESO_CODES)[keyof typeof ESTADO_PROCESO_CODES]

export const ESTADO_PROCESO_LABELS: Record<EstadoProcesoCode, string> = {
  ASESOR: "Asesoria / Ingreso",
  JEFE_TALLER: "Revision Jefe de Taller",
  REPUESTOS: "Gestion de Repuestos",
  PROGRAMAR_CITA: "Programacion de Cita",
  ENDEREZADA: "Bahia de Enderezada",
  PINTURA: "Bahia de Preparacion y Pintura",
  ENSAMBLAJE: "Bahia de Ensamblaje",
  MECANICA: "Bahia de Mecanica",
  LAVADO: "Lavado y Control de Calidad",
  FINALIZADO: "Entregado a Satisfaccion",
}

export const INITIAL_WORK_ORDER_ESTADO_PROCESO_CODE =
  ESTADO_PROCESO_CODES.ASESOR
