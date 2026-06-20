export type RoleCode =
  | "ADMIN"
  | "RECEPCION"
  | "REPUESTOS"
  | "CLIENTE"
  | "DEP_ENDEREZADA"
  | "DEP_REPARACION_PINTURA"
  | "DEP_ENSAMBLAJE"
  | "DEP_MECANICA"
  | "DEP_LAVADO_CALIDAD"

export interface AuthRole {
  codigo: RoleCode | string
  nombre: string
  tipo_rol?: string
}

export interface AuthUser {
  id?: string
  empresaId?: string
  sucursalId?: string
  empresa_id?: string
  sucursal_id?: string
  empresaNombre?: string
  sucursalNombre?: string
  email: string
  username: string
  name: string
  roles: AuthRole[]
}
