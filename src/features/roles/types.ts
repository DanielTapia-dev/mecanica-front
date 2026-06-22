export type TipoRol = "SISTEMA" | "DEPARTAMENTO" | "CLIENTE"

export interface Role {
  id: string
  empresa_id: string
  sucursal_id: string
  codigo: string
  nombre: string
  tipo_rol: TipoRol | string
  activo: boolean
  creado_en: string
  actualizado_en: string
}

export interface CreateRoleInput {
  empresa_id: string
  sucursal_id: string
  codigo: string
  nombre: string
  tipo_rol: TipoRol | string
  activo?: boolean
}

export type UpdateRoleInput = Partial<
  Pick<CreateRoleInput, "codigo" | "nombre" | "tipo_rol" | "activo">
>