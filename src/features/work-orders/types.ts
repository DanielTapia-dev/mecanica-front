import type { RoleCode } from "@/features/auth/types"
import type { EstadoProcesoCode } from "@/features/estados-proceso/constants"

export type EntityId = string
export type IsoDateString = string

export const WORK_ORDER_GENERAL_STATUSES = [
  "Pendiente",
  "En proceso",
  "Completado",
] as const

export type WorkOrderGeneralStatus = (typeof WORK_ORDER_GENERAL_STATUSES)[number]
export type WorkOrderGeneralStatusValue = WorkOrderGeneralStatus | string

export const WORK_ORDER_STAGES = [
  "Ingreso",
  "Repuestos",
  "Seleccion de departamento",
  "En departamento",
  "Finalizado",
] as const

export type WorkOrderStage = (typeof WORK_ORDER_STAGES)[number]
export type WorkOrderStageValue = WorkOrderStage | string

export const WORK_ORDER_SUB_STATES = ["Pendiente", "En proceso", "Completada"] as const

export type WorkOrderSubState = (typeof WORK_ORDER_SUB_STATES)[number]
export type WorkOrderSubStateValue = WorkOrderSubState | string

export const OPERATIONAL_DEPARTMENT_SLUGS = [
  "enderezado",
  "pintura",
  "ensamblaje",
  "mecanica",
  "lavado",
] as const

export type OperationalDepartmentSlug = (typeof OPERATIONAL_DEPARTMENT_SLUGS)[number]

export const OPERATIONAL_DEPARTMENT_CODES = [
  "ENDEREZADA",
  "REPARACION_PINTURA",
  "ENSAMBLAJE",
  "MECANICA",
  "LAVADO_CALIDAD",
] as const

export type OperationalDepartmentCode = (typeof OPERATIONAL_DEPARTMENT_CODES)[number]

export const DEPARTMENT_HISTORY_STATUSES = ["En proceso", "Cerrado"] as const

export type DepartmentHistoryStatus = (typeof DEPARTMENT_HISTORY_STATUSES)[number]

export const DEPARTMENT_EXIT_DECISIONS = ["Mover", "Finalizar"] as const

export type DepartmentExitDecision = (typeof DEPARTMENT_EXIT_DECISIONS)[number]

export const SPARE_PART_REQUEST_STATUSES = [
  "Pendiente",
  "En gestion",
  "Completada",
  "Cancelada",
] as const

export type SparePartRequestStatus = (typeof SPARE_PART_REQUEST_STATUSES)[number]

export const SPARE_PART_ITEM_STATUSES = [
  "Pendiente",
  "Solicitado",
  "Recibido",
  "No disponible",
  "Cancelado",
] as const

export type SparePartItemStatus = (typeof SPARE_PART_ITEM_STATUSES)[number]

export interface CustomerSummary {
  id: EntityId
  usuario_id?: EntityId | null
  nombre: string
  apellido?: string | null
  cedula?: string | null
  documento?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  activo?: boolean
}

export interface VehicleSummary {
  id: EntityId
  cliente_id?: EntityId | null
  cliente_nombre?: string | null
  cliente_cedula?: string | null
  placa: string
  vin?: string | null
  marca: string
  modelo: string
  anio?: number | null
  color?: string | null
  kilometraje?: number | null
  activo?: boolean
}

export interface OperationalDepartment {
  id: EntityId
  codigo: OperationalDepartmentCode | string
  nombre: string
  descripcion?: string | null
  activo: boolean
  orden_visual?: number | null
  slug?: OperationalDepartmentSlug
  creado_en?: IsoDateString
  actualizado_en?: IsoDateString
}

export interface SparePartRequestItem {
  id: EntityId
  solicitud_repuesto_id: EntityId
  nombre_repuesto: string
  codigo_repuesto?: string | null
  cantidad: number
  estado_item: SparePartItemStatus
  proveedor?: string | null
  fecha_estimada_llegada?: IsoDateString | null
  fecha_recibido?: IsoDateString | null
  observaciones?: string | null
  creado_en?: IsoDateString
  actualizado_en?: IsoDateString
}

export interface SparePartRequest {
  id: EntityId
  orden_id: EntityId
  estado_solicitud: SparePartRequestStatus
  solicitado_por_usuario_id?: EntityId | null
  gestionado_por_usuario_id?: EntityId | null
  fecha_solicitud?: IsoDateString | null
  fecha_completado?: IsoDateString | null
  observaciones?: string | null
  items?: SparePartRequestItem[]
  creado_en?: IsoDateString
  actualizado_en?: IsoDateString
}

export interface WorkOrderDepartmentHistory {
  id: EntityId
  orden_id: EntityId
  departamento_id: EntityId
  departamento?: OperationalDepartment
  estado_en_departamento: DepartmentHistoryStatus
  actividad?: string | null
  fecha_entrada: IsoDateString
  fecha_salida?: IsoDateString | null
  ingresado_por_usuario_id?: EntityId | null
  cerrado_por_usuario_id?: EntityId | null
  observacion_interna?: string | null
  observacion_cliente?: string | null
  decision_salida?: DepartmentExitDecision | null
  departamento_siguiente_id?: EntityId | null
  creado_en?: IsoDateString
  actualizado_en?: IsoDateString
}

export interface WorkOrderComment {
  id: EntityId
  orden_id: EntityId
  usuario_id: EntityId
  comentario: string
  visible_cliente: boolean
  creado_en: IsoDateString
}

export interface WorkOrderAttachment {
  id: EntityId
  orden_id: EntityId
  historial_departamento_id?: EntityId | null
  usuario_id: EntityId
  tipo: string
  archivo_url: string
  descripcion?: string | null
  visible_cliente: boolean
  creado_en: IsoDateString
}

export interface WorkOrder {
  id: EntityId
  codigo: string
  codigo_seguimiento?: string | null
  empresa_id?: EntityId | null
  sucursal_id?: EntityId | null
  broker_id?: EntityId | null
  aseguradora_id?: EntityId | null
  broker?: string | null
  aseguradora?: string | null
  cliente_id?: EntityId | null
  vehiculo_id: EntityId
  estado_general: WorkOrderGeneralStatusValue
  etapa_actual: WorkOrderStageValue
  estado_actual_id?: EntityId | null
  estado_id?: EntityId | null
  estado_proceso_id?: EntityId | null
  estado_codigo?: EstadoProcesoCode | string | null
  estado_actual_codigo?: EstadoProcesoCode | string | null
  estado_proceso_codigo?: EstadoProcesoCode | string | null
  sub_estado_actual?: WorkOrderSubStateValue | null
  requiere_repuestos: boolean
  repuestos_completos: boolean
  encuesta_realizada?: boolean
  fecha_encuesta?: IsoDateString | null
  departamento_actual_id?: EntityId | null
  actividad_actual?: string | null
  observacion_cliente?: string | null
  observacion_interna?: string | null
  motivo_ingreso: string
  fecha_creacion: IsoDateString
  fecha_inicio_proceso?: IsoDateString | null
  fecha_finalizacion?: IsoDateString | null
  creado_por_usuario_id?: EntityId | null
  actualizado_por_usuario_id?: EntityId | null
  creado_en?: IsoDateString
  actualizado_en?: IsoDateString
  cliente?: CustomerSummary
  vehiculo?: VehicleSummary
  departamento_actual?: OperationalDepartment | null
  estado_actual?: {
    id?: EntityId
    codigo?: EstadoProcesoCode | string
    nombre?: string
  } | null
  estado_proceso?: {
    id?: EntityId
    codigo?: EstadoProcesoCode | string
    nombre?: string
  } | null
  solicitud_repuestos?: SparePartRequest | null
  historial_departamentos?: WorkOrderDepartmentHistory[]
  comentarios?: WorkOrderComment[]
  adjuntos?: WorkOrderAttachment[]
}

export type WorkOrderListItem = Pick<
  WorkOrder,
  | "id"
  | "codigo"
  | "codigo_seguimiento"
  | "empresa_id"
  | "sucursal_id"
  | "broker_id"
  | "aseguradora_id"
  | "broker"
  | "aseguradora"
  | "cliente_id"
  | "vehiculo_id"
  | "estado_general"
  | "etapa_actual"
  | "estado_actual_id"
  | "estado_id"
  | "estado_proceso_id"
  | "estado_codigo"
  | "estado_actual_codigo"
  | "estado_proceso_codigo"
  | "sub_estado_actual"
  | "requiere_repuestos"
  | "repuestos_completos"
  | "encuesta_realizada"
  | "fecha_encuesta"
  | "departamento_actual_id"
  | "actividad_actual"
  | "observacion_cliente"
  | "motivo_ingreso"
  | "fecha_creacion"
  | "fecha_finalizacion"
  | "creado_en"
  | "actualizado_en"
  | "cliente"
  | "vehiculo"
  | "departamento_actual"
  | "estado_actual"
  | "estado_proceso"
>

export interface WorkOrderListFilters {
  query?: string
  empresa_id?: EntityId
  sucursal_id?: EntityId
  cliente_id?: EntityId
  cliente_cedula?: string
  vehiculo_id?: EntityId
  estado_actual_id?: EntityId
  estado_general?: WorkOrderGeneralStatus
  etapa_actual?: WorkOrderStage
  departamento_actual_id?: EntityId
  departamento_codigo?: OperationalDepartmentCode
  requiere_repuestos?: boolean
  repuestos_completos?: boolean
}

export interface CustomerListFilters {
  query?: string
}

export interface VehicleListFilters {
  query?: string
  cliente_id?: EntityId
}

export interface CreateCustomerInput {
  empresa_id: EntityId
  sucursal_id: EntityId
  nombre: string
  apellido: string
  cedula: string
  documento: string
  telefono?: string
  email?: string
  direccion?: string
}

export interface CreateVehicleInput {
  empresa_id: EntityId
  sucursal_id: EntityId
  cliente_id?: EntityId | null
  cliente_nombre?: string | null
  cliente_cedula?: string | null
  placa: string
  vin?: string | null
  marca?: string | null
  modelo?: string | null
  anio?: number | null
  color?: string | null
  kilometraje?: number | null
}

export interface SparePartRequestListFilters {
  query?: string
  orden_id?: EntityId
  estado_solicitud?: SparePartRequestStatus
}

export interface CreateWorkOrderInput {
  empresa_id: EntityId
  sucursal_id: EntityId
  vehiculo_id: EntityId
  creado_por_usuario_id: EntityId
  estado_actual_id?: EntityId | null
  aseguradora_id?: EntityId | null
  broker_id?: EntityId | null
  sub_estado_actual?: WorkOrderSubStateValue | null
  encuesta_realizada?: boolean
  fecha_encuesta?: IsoDateString | null
  fecha_inicio_proceso?: IsoDateString | null
  fecha_finalizacion?: IsoDateString | null
}

export interface UpdateWorkOrderInput {
  estado_actual_id?: EntityId | null
  aseguradora_id?: EntityId | null
  broker_id?: EntityId | null
  sub_estado_actual?: WorkOrderSubStateValue | null
  encuesta_realizada?: boolean
  fecha_encuesta?: IsoDateString | null
  observacion_cliente?: string | null
  actualizado_por_usuario_id?: EntityId | null
  fecha_inicio_proceso?: IsoDateString | null
  fecha_finalizacion?: IsoDateString | null
}

export interface CreateWorkOrderStateHistoryInput {
  empresa_id: EntityId
  sucursal_id: EntityId
  orden_id: EntityId
  estado_id: EntityId
  sub_estado?: WorkOrderSubStateValue | null
  registrado_por_usuario_id: EntityId
}

export interface MoveWorkOrderToProcessStateInput {
  orden_id: EntityId
  estado_actual_id: EntityId
  sub_estado_actual?: WorkOrderSubStateValue | null
}

export interface AssignDepartmentInput {
  departamento_id: EntityId
  actividad_inicial: string
  observacion_interna?: string
  observacion_cliente?: string
}

export interface RegisterWorkOrderProgressInput {
  actividad_actual: string
  observacion_interna?: string
  observacion_cliente?: string
}

export interface MoveDepartmentInput {
  departamento_siguiente_id: EntityId
  actividad_inicial: string
  observacion_interna?: string
  observacion_cliente?: string
}

export interface FinalizeWorkOrderInput {
  observacion_interna?: string
  observacion_cliente?: string
}

export interface CreateSparePartItemInput {
  nombre_repuesto: string
  codigo_repuesto?: string
  cantidad: number
  proveedor?: string
  fecha_estimada_llegada?: IsoDateString
  observaciones?: string
}

export interface UpdateSparePartItemInput extends Partial<CreateSparePartItemInput> {
  estado_item?: SparePartItemStatus
  fecha_recibido?: IsoDateString | null
}

export type WorkOrderPrimaryActionId =
  | "manage-spare-parts"
  | "select-department"
  | "register-progress"
  | "finalize-work-order"
  | "view-finalized"
  | "review-order"

export interface WorkOrderPrimaryAction {
  id: WorkOrderPrimaryActionId
  label: string
  allowedRoles: RoleCode[]
  disabled: boolean
  reason?: string
}

export interface PaginatedResult<T> {
  data: T[]
  total?: number
  page?: number
  pageSize?: number
}
