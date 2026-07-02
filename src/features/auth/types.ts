export type RoleCode =
  | "ADMIN"
  | "ASESOR"
  | "RECEPCION"
  | "REPUESTOS"
  | "CLIENTE"
  | "DEP_ENDEREZADA"
  | "DEP_REPARACION_PINTURA"
  | "DEP_ENSAMBLAJE"
  | "DEP_MECANICA"
  | "DEP_LAVADO_CALIDAD"

export interface AuthRole {
  id?: string
  rol_id?: string
  codigo: RoleCode | string
  nombre: string
  tipo_rol?: string
}

export interface AuthUser {
  id?: string
  usuario_id?: string
  user_id?: string
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

export interface AuthSessionScope {
  user_id?: string
  empresa_id?: string
  sucursal_id?: string
  empresa_nombre?: string
  sucursal_nombre?: string
  roles: AuthRole[]
  role_codes: string[]
  role_ids: string[]
}
