# Documento técnico BDD Mecánica

![dfd_mecanica_corregido (1).png](dfd_mecanica_corregido_(1).png)

[mecanica_schema_postgresql.sql](mecanica_schema_postgresql.sql)

[Documento técnico de servicios — Sistema de ingreso y seguimiento de vehículos](https://app.notion.com/p/Documento-t-cnico-de-servicios-Sistema-de-ingreso-y-seguimiento-de-veh-culos-37d35468c34480b2af59fcbde47ee74c?pvs=21)

# Modelo funcional y base de datos — Sistema de ingreso y seguimiento de vehículos

**Alcance:** este documento describe el funcionamiento del sistema y las tablas recomendadas para la base de datos. Está alineado con el modelo simplificado final, donde el acceso se controla por roles y los departamentos representan únicamente la ubicación operativa de una orden de trabajo. No incluye módulo de citas.

---

## 1. Criterio general del sistema

El sistema debe girar alrededor de la **orden de trabajo**, no solamente del vehículo. Un vehículo puede ingresar varias veces al taller en momentos distintos, por lo que cada ingreso debe generar una nueva orden, además un cliente puede tener varios vehiculos e ingresarlos en varios momentos por lo que se debe manejar por clientes el sistema.

La estructura principal queda así:

```
Cliente → Vehículo → Orden de trabajo → Repuestos / Departamento actual / Historial / Comentarios / Adjuntos
```

El acceso se controlará mediante **usuarios con uno o varios roles**. Los roles determinan qué funcionalidades puede ejecutar el usuario desde el backend o frontend.

Los departamentos **no controlan accesos**. Su función es representar la ubicación operativa de la orden de trabajo, es decir, en qué bahía o área se encuentra actualmente el vehículo.

Por lo tanto:

```
Roles = acceso y funcionalidades
Departamentos = ubicación actual de la orden
Historial = trazabilidad de cambios de departamento
```

No se manejarán tablas de permisos, módulos, relación rol-módulo ni bitácora de auditoría general. La trazabilidad operativa de la orden se manejará con `orden_departamento_historial`.

---

## 2. Roles de usuario

Un usuario puede tener uno o varios roles. Estos roles serán usados por la aplicación para habilitar o bloquear funcionalidades.

| Rol | Código sugerido | Función principal |
| --- | --- | --- |
| Administrador | `ADMIN` | Control total del sistema. |
| Recepción | `RECEPCION` | Registra clientes, vehículos y órdenes de trabajo. |
| Repuestos | `REPUESTOS` | Gestiona repuestos requeridos por una orden. |
| Cliente | `CLIENTE` | Consulta el estado visible de sus vehículos. |
| Bahía de enderezada | `DEP_ENDEREZADA` | Gestiona órdenes que están en enderezada. |
| Bahía de reparación y pintura | `DEP_REPARACION_PINTURA` | Gestiona órdenes que están en reparación y pintura. |
| Bahía de ensamblaje | `DEP_ENSAMBLAJE` | Gestiona órdenes que están en ensamblaje. |
| Bahía de mecánica | `DEP_MECANICA` | Gestiona órdenes que están en mecánica. |
| Lavado y control de calidad | `DEP_LAVADO_CALIDAD` | Gestiona órdenes que están en lavado y control de calidad. |

Ejemplos:

```
Usuario A → RECEPCION
Usuario B → REPUESTOS
Usuario C → DEP_MECANICA
Usuario D → DEP_MECANICA + DEP_LAVADO_CALIDAD
Usuario E → ADMIN
```

La relación entre usuarios y roles se maneja mediante la tabla `usuario_roles`.

---

## 3. Control de funcionalidades

El modelo final no usa tablas `modulos`, `rol_modulos`, `permisos` ni `rol_permisos`.

Las funcionalidades se controlarán directamente desde la aplicación usando los roles del usuario.

Ejemplo de comportamiento esperado:

| Rol | Funcionalidades sugeridas |
| --- | --- |
| `ADMIN` | Crear usuarios, asignar roles, editar catálogos, consultar y modificar órdenes. |
| `RECEPCION` | Crear clientes, vehículos y órdenes de trabajo. |
| `REPUESTOS` | Gestionar solicitudes e ítems de repuestos. |
| `DEP_MECANICA` | Ver órdenes actualmente en mecánica, registrar actividad, mover a otro departamento o finalizar. |
| `DEP_LAVADO_CALIDAD` | Ver órdenes actualmente en lavado/calidad, registrar actividad, mover a otro departamento o finalizar. |
| `CLIENTE` | Ver únicamente información pública de sus órdenes. |

Regla clave:

> El backend debe validar qué acciones puede ejecutar cada usuario según sus roles.
> 

Los departamentos no definen permisos. Por ejemplo, el departamento `MECANICA` existe para indicar que una orden está físicamente o funcionalmente en mecánica, no para controlar el acceso del usuario.

---

## 4. Flujo funcional del sistema

### 4.1. Ingreso de vehículo

Recepción registra o selecciona:

- Cliente.
- Vehículo.
- Motivo de ingreso.
- Observaciones iniciales.
- Si la orden necesita repuestos.

Al crear la orden:

```
estado_general = Pendiente
etapa_actual = Ingreso
```

Si la orden requiere repuestos, puede pasar a etapa de repuestos. Si no requiere repuestos, puede pasar directamente a selección de departamento.

---

### 4.2. Decisión de repuestos

Si la orden necesita repuestos:

```
etapa_actual = Repuestos
estado_general = Pendiente
requiere_repuestos = true
repuestos_completos = false
```

El área de repuestos registra los ítems necesarios y los mantiene pendientes hasta completarlos.

Si la orden no necesita repuestos:

```
etapa_actual = Selección de departamento
estado_general = Pendiente
requiere_repuestos = false
repuestos_completos = false
```

---

### 4.3. Repuestos completos

Cuando todos los repuestos requeridos están completos:

```
repuestos_completos = true
etapa_actual = Selección de departamento
estado_general = Pendiente
```

La orden queda lista para ser asignada a un departamento operativo.

---

### 4.4. Selección de departamento

Un usuario autorizado asigna la orden al primer departamento. Desde ese momento la orden entra al proceso operativo:

```
estado_general = En proceso
etapa_actual = En departamento
departamento_actual_id = departamento seleccionado
```

También debe crearse un registro abierto en `orden_departamento_historial` con:

```
orden_id
departamento_id
estado_en_departamento = En proceso
fecha_entrada
usuario que ingresó o asignó la orden
actividad inicial
observaciones
```

---

### 4.5. Trabajo dentro del departamento

El usuario del departamento registra:

- Actividad actual.
- Observación interna.
- Observación visible para cliente.
- Adjuntos o fotos, si aplica.

Estos datos pueden actualizarse en la orden actual y también registrarse en el historial correspondiente.

---

### 4.6. Movimiento de departamento

Cuando una orden cambia de departamento, se debe actualizar:

```
ordenes_trabajo.departamento_actual_id
```

Ese campo representa el departamento actual de la orden.

Además, se debe cerrar el historial abierto anterior y crear un nuevo historial para el departamento destino.

Ejemplo:

| Orden | Departamento | Entrada | Salida | Decisión | Siguiente departamento |
| --- | --- | --- | --- | --- | --- |
| OT-2026-000001 | Enderezada | 09:00 | 11:00 | Mover | Reparación y pintura |
| OT-2026-000001 | Reparación y pintura | 11:00 | 15:00 | Mover | Ensamblaje |
| OT-2026-000001 | Ensamblaje | 15:00 | NULL | NULL | NULL |

El registro con `fecha_salida = NULL` representa el departamento actual abierto.

---

### 4.7. Finalización de la orden

Si el vehículo está listo, la orden se completa:

```
estado_general = Completado
etapa_actual = Finalizado
actividad_actual = Vehículo listo para entrega
fecha_finalizacion = fecha actual
```

También se debe cerrar el historial abierto con:

```
estado_en_departamento = Cerrado
decision_salida = Finalizar
fecha_salida = fecha actual
```

---

## 5. Estados de la orden

Los estados generales serán únicamente:

| Estado | Uso |
| --- | --- |
| Pendiente | La orden todavía no está trabajando dentro de una bahía. Puede estar en ingreso, repuestos o selección de departamento. |
| En proceso | La orden ya está asignada a un departamento operativo. |
| Completado | Algún departamento declaró el vehículo listo. |

Para mayor detalle se usará `etapa_actual`:

```
Ingreso
Repuestos
Selección de departamento
En departamento
Finalizado
```

Para mostrar información al cliente se usarán principalmente:

```
estado_general
departamento_actual_id
actividad_actual
observacion_cliente
fecha_ultima_actualizacion
```

---

## 6. Tablas finales del modelo

### 6.1. Seguridad y roles

| Tabla | Propósito | Campos principales |
| --- | --- | --- |
| `usuarios` | Usuarios que inician sesión. | `id`, `nombre`, `apellido`, `email`, `password_hash`, `telefono`, `activo`, `creado_en`, `actualizado_en`. |
| `roles` | Roles del sistema usados para controlar funcionalidades. | `id`, `codigo`, `nombre`, `tipo_rol`, `activo`, `creado_en`, `actualizado_en`. |
| `usuario_roles` | Relación muchos a muchos entre usuarios y roles. | `id`, `usuario_id`, `rol_id`, `creado_en`. |

En el modelo final, `roles` no necesita `departamento_id`. Los roles como `DEP_MECANICA` o `DEP_ENDEREZADA` son códigos funcionales que el backend interpreta para habilitar acciones.

---

### 6.2. Tablas principales del negocio

| Tabla | Propósito | Campos principales |
| --- | --- | --- |
| `departamentos` | Catálogo de bahías o departamentos operativos. | `id`, `codigo`, `nombre`, `descripcion`, `activo`, `orden_visual`, `creado_en`, `actualizado_en`. |
| `clientes` | Datos del cliente. | `id`, `usuario_id`, `nombre`, `apellido`, `documento`, `telefono`, `email`, `direccion`, `activo`, `creado_en`, `actualizado_en`. |
| `vehiculos` | Datos del vehículo. | `id`, `cliente_id`, `placa`, `vin`, `marca`, `modelo`, `anio`, `color`, `kilometraje`, `activo`, `creado_en`, `actualizado_en`. |
| `ordenes_trabajo` | Tabla central del proceso. | `id`, `codigo`, `cliente_id`, `vehiculo_id`, `estado_general`, `etapa_actual`, `requiere_repuestos`, `repuestos_completos`, `departamento_actual_id`, `actividad_actual`, `observacion_cliente`, `observacion_interna`, `motivo_ingreso`, `fecha_creacion`, `fecha_inicio_proceso`, `fecha_finalizacion`, `creado_por_usuario_id`, `actualizado_por_usuario_id`, `creado_en`, `actualizado_en`. |

---

### 6.3. Repuestos

| Tabla | Propósito | Campos principales |
| --- | --- | --- |
| `solicitudes_repuestos` | Solicitud general de repuestos de una orden. | `id`, `orden_id`, `estado_solicitud`, `solicitado_por_usuario_id`, `gestionado_por_usuario_id`, `fecha_solicitud`, `fecha_completado`, `observaciones`, `creado_en`, `actualizado_en`. |
| `solicitud_repuesto_items` | Detalle de cada repuesto solicitado. | `id`, `solicitud_repuesto_id`, `nombre_repuesto`, `codigo_repuesto`, `cantidad`, `estado_item`, `proveedor`, `fecha_estimada_llegada`, `fecha_recibido`, `observaciones`, `creado_en`, `actualizado_en`. |

Estados sugeridos para cada repuesto:

```
Pendiente
Solicitado
Recibido
No disponible
Cancelado
```

---

### 6.4. Historial, comentarios y adjuntos

| Tabla | Propósito | Campos principales |
| --- | --- | --- |
| `orden_departamento_historial` | Guarda cada paso de la orden por un departamento. Funciona como trazabilidad operativa de cambios de departamento. | `id`, `orden_id`, `departamento_id`, `estado_en_departamento`, `actividad`, `fecha_entrada`, `fecha_salida`, `ingresado_por_usuario_id`, `cerrado_por_usuario_id`, `observacion_interna`, `observacion_cliente`, `decision_salida`, `departamento_siguiente_id`, `creado_en`, `actualizado_en`. |
| `comentarios_orden` | Comentarios adicionales sobre la orden. | `id`, `orden_id`, `usuario_id`, `comentario`, `visible_cliente`, `creado_en`. |
| `adjuntos_orden` | Fotos, documentos o evidencias. | `id`, `orden_id`, `historial_departamento_id`, `usuario_id`, `tipo`, `archivo_url`, `descripcion`, `visible_cliente`, `creado_en`. |

La tabla `orden_departamento_historial` reemplaza la necesidad de una bitácora general para los movimientos operativos de la orden.

---

## 7. Tablas eliminadas del modelo final

Las siguientes tablas ya no forman parte del modelo:

```
modulos
rol_modulos
permisos
rol_permisos
bitacora_auditoria
```

Motivo:

- Las funcionalidades se controlan por roles desde la aplicación.
- No se manejarán módulos como entidades de base de datos.
- No se manejarán permisos granulares en base de datos.
- No se manejará una bitácora de auditoría general.
- La trazabilidad relevante del flujo operativo se guarda en `orden_departamento_historial`.

---

## 8. Relaciones principales

- Un cliente puede tener varios vehículos.
- Un vehículo puede tener varias órdenes de trabajo en el tiempo.
- Una orden pertenece a un cliente y a un vehículo.
- Una orden puede tener una solicitud de repuestos.
- Una solicitud de repuestos puede tener muchos ítems.
- Una orden puede pasar por muchos departamentos mediante `orden_departamento_historial`.
- Una orden solo puede tener un `departamento_actual_id` a la vez.
- Una orden solo debe tener un historial abierto a la vez, identificado por `fecha_salida IS NULL`.
- Un usuario puede tener muchos roles.
- Un rol puede pertenecer a muchos usuarios.
- Los departamentos se relacionan con órdenes, no con roles.

---

## 9. Reglas de negocio principales

1. Una orden que requiere repuestos no debe pasar a selección de departamento hasta que los repuestos estén completos.
2. Una orden sin repuestos puede pasar directamente a selección de departamento.
3. Al asignar un departamento, la orden cambia a `En proceso` y `En departamento`.
4. Una orden solo puede estar en un departamento actual.
5. Cada cambio de departamento debe actualizar `ordenes_trabajo.departamento_actual_id`.
6. Cada cambio de departamento debe cerrar el historial abierto anterior y crear un nuevo historial.
7. El historial abierto de una orden es el registro con `fecha_salida = NULL`.
8. Una orden no debe tener más de un historial abierto al mismo tiempo.
9. Al mover una orden, debe registrarse usuario, fecha, departamento origen, departamento destino, actividad y observaciones.
10. Al finalizar una orden, debe cerrarse el historial abierto con `decision_salida = Finalizar`.
11. El cliente solo ve información pública o marcada como visible para cliente.
12. El backend debe validar qué funcionalidades puede ejecutar cada usuario según sus roles.
13. Los departamentos no controlan accesos; solo representan ubicación operativa de la orden.

---

## 10. Información visible para el cliente

El cliente no debe ver información interna del taller. La consulta pública debe mostrar únicamente:

```
Código de orden
Estado general
Etapa actual
Departamento actual
Actividad actual
Última observación visible para cliente
Fecha de última actualización
```

Ejemplo:

```
Estado: En proceso
Departamento: Bahía de reparación y pintura
Actividad: Reparación y pintura de piezas afectadas
Observación: Su vehículo se encuentra en proceso de reparación y pintura.
```

---

## 11. Lista final de tablas

```
departamentos
usuarios
roles
usuario_roles
clientes
vehiculos
ordenes_trabajo
solicitudes_repuestos
solicitud_repuesto_items
orden_departamento_historial
comentarios_orden
adjuntos_orden
```

---

## 12. Resumen del modelo final

El modelo final queda simplificado de la siguiente manera:

```
usuarios → usuario_roles → roles
clientes → vehiculos → ordenes_trabajo
ordenes_trabajo → departamentos
ordenes_trabajo → orden_departamento_historial
ordenes_trabajo → solicitudes_repuestos → solicitud_repuesto_items
ordenes_trabajo → comentarios_orden
ordenes_trabajo → adjuntos_orden
```

La tabla `ordenes_trabajo` mantiene el estado actual de la orden.

La tabla `orden_departamento_historial` mantiene el recorrido histórico de la orden por cada departamento.

El control de acceso y funcionalidades se resuelve con los roles del usuario desde la lógica de la aplicación.