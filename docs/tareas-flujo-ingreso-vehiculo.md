# Tareas Daniel - Flujo de ingreso y despacho de vehiculo

Este backlog queda limitado al trabajo de Daniel. El flujo se basa en:

- `Documento tecnico BDD Mecanica 37635468c344807388d8d21a2a9491d7.md`
- `servicios-backend-mecanica.md`

La entidad central del flujo es `ordenes_trabajo`.

## Nota sobre contratos backend

El Swagger actual del backend publica rutas, metodos, autenticacion y codigos de respuesta, pero no declara campos internos para la mayoria de `requestBody` ni para las respuestas `200`; los marca como `Objeto JSON libre`.

Por eso, este documento fija el contrato esperado usando:

- Las rutas reales del Swagger.
- Los campos definidos en las tablas del BDD.
- La respuesta minima que el frontend necesita para continuar el flujo.

Si backend cambia nombres de campos o estructura de respuesta, se debe actualizar este documento y la capa de servicios del frontend.

## Alcance de este archivo

### Incluido para Daniel

- Crear y conectar el flujo operativo de ordenes de trabajo.
- Crear ingreso de vehiculo desde datos de vehiculo y asignacion de cliente.
- Consumir servicios reales del backend de mecanica.
- Gestionar decision de repuestos.
- Gestionar seleccion y movimiento por departamentos.
- Conectar pantallas de departamentos al estado real de la orden.
- Finalizar/despachar el vehiculo segun el modelo actual.
- Crear seguimiento publico para cliente.
- Reemplazar mocks del flujo por datos reales.

### Fuera de alcance de este archivo

- CRUD administrativo completo de usuarios.
- CRUD administrativo completo de clientes.
- CRUD administrativo completo de vehiculos.
- Pantallas administrativas base para esos CRUDs.

Esas pantallas las desarrolla Diego con el usuario `ADMIN`. Daniel puede usar alta rapida de cliente dentro del ingreso solo para desbloquear el flujo operativo.

## Principios UX del flujo

- El ingreso empieza por el vehiculo.
- Al final del ingreso se asigna el cliente del vehiculo.
- Si el cliente no existe, se abre un modal de alta rapida de cliente.
- Una orden debe tener una sola accion principal visible segun su etapa actual.
- El detalle de orden debe funcionar como centro de mando: estado, datos principales, historial y siguiente accion.
- No duplicar pantallas administrativas completas de cliente ni vehiculo dentro del flujo.
- Evitar pantallas separadas para decisiones pequenas. Preferir modales o secciones dentro de `/ordenes/[ordenId]`.
- Mostrar siempre el siguiente paso disponible y bloquear acciones que no apliquen.
- El cliente solo debe ver informacion publica.

## Flujo operativo esperado

```text
Cliente llega con su vehiculo
-> Recepcion/Admin registra datos del vehiculo
-> Recepcion/Admin busca o crea cliente rapido
-> Se crea vehiculo asociado al cliente
-> Se crea orden de trabajo
-> Necesita repuestos?
   -> Si: Repuestos gestiona solicitud -> Repuestos completos -> Seleccion de departamento
   -> No: Seleccion de departamento
-> Se asigna departamento operativo
-> Departamento registra actividad y observaciones
-> Departamento decide:
   -> Mover a otro departamento
   -> Finalizar/despachar vehiculo
-> Cliente consulta estado publico
```

Segun el BDD actual, el despacho se representa cerrando la orden:

```text
estado_general = Completado
etapa_actual = Finalizado
actividad_actual = Vehiculo listo para entrega
fecha_finalizacion = fecha actual
```

## Reglas base

- La entidad central es la orden de trabajo.
- Un cliente puede tener varios vehiculos.
- Un vehiculo puede tener varias ordenes en el tiempo.
- Una orden pertenece a un cliente y a un vehiculo.
- Una orden puede tener una solicitud de repuestos.
- Una orden solo puede tener un departamento actual.
- Una orden solo debe tener un historial de departamento abierto.
- El historial abierto es el registro de `orden_departamento_historial` con `fecha_salida = NULL`.
- Los departamentos indican ubicacion operativa, no permisos.
- Los permisos se controlan por roles.
- `ADMIN` puede operar el flujo completo para pruebas y soporte.
- `RECEPCION` crea ordenes.
- `REPUESTOS` gestiona solicitudes de repuestos.
- Los roles `DEP_*` gestionan ordenes del departamento correspondiente.
- `CLIENTE` solo consulta informacion publica.
- Cada rol operativo de departamento debe entrar a su dashboard propio.
- El dashboard de un rol `DEP_*` solo muestra vehiculos/ordenes asignados al departamento de ese rol.
- Si una orden no tiene `departamento_actual_id` igual al departamento del rol, no debe mostrarse en ese dashboard.
- Las ordenes con `estado_general = Completado` no deben aparecer en la tabla activa del departamento.
- Si el departamento no tiene vehiculos asignados activos, mostrar el estado vacio: `No hay vehiculos asignados al departamento`.

## Rutas frontend objetivo para Daniel

```text
/ordenes
/ordenes/nueva
/ordenes/[ordenId]
/repuestos
/cliente/ordenes
/departamentos/enderezado
/departamentos/pintura
/departamentos/ensamblaje
/departamentos/mecanica
/departamentos/lavado
```

## Contratos backend base

Todos los servicios protegidos deben enviar:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Respuesta minima esperada por frontend:

```ts
type ApiObjectResponse<T> = T | { data: T; message?: string }
type ApiListResponse<T> = T[] | { data: T[]; total?: number; message?: string }
```

El frontend debe tolerar ambas formas mientras el Swagger no defina una estructura exacta.

### Cliente

Servicios reales:

```text
GET  /api/mecanica/clientes
GET  /api/mecanica/clientes/activos
GET  /api/mecanica/clientes/buscar
GET  /api/mecanica/clientepordocumento/{documento}
GET  /api/mecanica/cliente/{id}
POST /api/mecanica/cliente
PUT  /api/mecanica/cliente/{id}
GET  /api/mecanica/cliente/{cliente_id}/vehiculos
GET  /api/mecanica/cliente/{cliente_id}/ordenes-trabajo
```

Payload esperado para `POST /api/mecanica/cliente`:

```json
{
  "nombre": "string",
  "apellido": "string opcional",
  "documento": "string opcional",
  "telefono": "string opcional",
  "email": "string opcional",
  "direccion": "string opcional",
  "usuario_id": "string opcional"
}
```

Respuesta minima esperada:

```json
{
  "id": "string",
  "usuario_id": "string|null",
  "nombre": "string",
  "apellido": "string|null",
  "documento": "string|null",
  "telefono": "string|null",
  "email": "string|null",
  "direccion": "string|null",
  "activo": true
}
```

### Vehiculo

Servicios reales:

```text
GET  /api/mecanica/vehiculos
GET  /api/mecanica/vehiculos/activos
GET  /api/mecanica/vehiculo/{id}
POST /api/mecanica/vehiculo
PUT  /api/mecanica/vehiculo/{id}
GET  /api/mecanica/vehiculo/{vehiculo_id}/ordenes-trabajo
```

Payload esperado para `POST /api/mecanica/vehiculo`:

```json
{
  "cliente_id": "string",
  "placa": "string",
  "vin": "string opcional",
  "marca": "string",
  "modelo": "string",
  "anio": 2026,
  "color": "string opcional",
  "kilometraje": 0
}
```

Respuesta minima esperada:

```json
{
  "id": "string",
  "cliente_id": "string",
  "placa": "string",
  "vin": "string|null",
  "marca": "string",
  "modelo": "string",
  "anio": 2026,
  "color": "string|null",
  "kilometraje": 0,
  "activo": true
}
```

### Orden de trabajo

Servicios reales:

```text
GET    /api/mecanica/ordenes-trabajo
GET    /api/mecanica/orden-trabajo/{id}
POST   /api/mecanica/orden-trabajo
PUT    /api/mecanica/orden-trabajo/{id}
DELETE /api/mecanica/orden-trabajo/{id}
GET    /api/mecanica/cliente/{cliente_id}/ordenes-trabajo
GET    /api/mecanica/vehiculo/{vehiculo_id}/ordenes-trabajo
```

Payload esperado para `POST /api/mecanica/orden-trabajo`:

```json
{
  "cliente_id": "string",
  "vehiculo_id": "string",
  "estado_general": "Pendiente",
  "etapa_actual": "Ingreso | Repuestos | Seleccion de departamento",
  "requiere_repuestos": true,
  "repuestos_completos": false,
  "departamento_actual_id": null,
  "actividad_actual": "string opcional",
  "observacion_cliente": "string opcional",
  "observacion_interna": "string opcional",
  "motivo_ingreso": "string",
  "fecha_creacion": "ISO opcional si backend la genera",
  "creado_por_usuario_id": "string opcional"
}
```

Respuesta minima esperada:

```json
{
  "id": "string",
  "codigo": "string",
  "cliente_id": "string",
  "vehiculo_id": "string",
  "estado_general": "Pendiente",
  "etapa_actual": "Ingreso | Repuestos | Seleccion de departamento | En departamento | Finalizado",
  "requiere_repuestos": true,
  "repuestos_completos": false,
  "departamento_actual_id": "string|null",
  "actividad_actual": "string|null",
  "observacion_cliente": "string|null",
  "observacion_interna": "string|null",
  "motivo_ingreso": "string",
  "fecha_creacion": "ISO string",
  "fecha_inicio_proceso": "ISO string|null",
  "fecha_finalizacion": "ISO string|null"
}
```

Payload esperado para `PUT /api/mecanica/orden-trabajo/{id}`:

```json
{
  "estado_general": "Pendiente | En proceso | Completado",
  "etapa_actual": "Ingreso | Repuestos | Seleccion de departamento | En departamento | Finalizado",
  "repuestos_completos": true,
  "departamento_actual_id": "string|null",
  "actividad_actual": "string|null",
  "observacion_cliente": "string|null",
  "observacion_interna": "string|null",
  "fecha_inicio_proceso": "ISO string|null",
  "fecha_finalizacion": "ISO string|null",
  "actualizado_por_usuario_id": "string opcional"
}
```

Enviar solo los campos que cambian.

### Departamentos

Servicios reales:

```text
GET  /api/mecanica/departamentos
GET  /api/mecanica/departamentos/activos
GET  /api/mecanica/departamento/{id}
POST /api/mecanica/departamento
PUT  /api/mecanica/departamento/{id}
```

Respuesta minima esperada para listados:

```json
{
  "id": "string",
  "codigo": "ENDEREZADA | REPARACION_PINTURA | ENSAMBLAJE | MECANICA | LAVADO_CALIDAD",
  "nombre": "string",
  "descripcion": "string|null",
  "activo": true,
  "orden_visual": 1
}
```

### Historial de departamento

Servicios reales:

```text
GET  /api/mecanica/orden-departamento-historial
GET  /api/mecanica/orden-departamento-historial/{id}
POST /api/mecanica/orden-departamento-historial
PUT  /api/mecanica/orden-departamento-historial/{id}
GET  /api/mecanica/orden/{ordenId}/orden-departamento-historial
```

Payload esperado para `POST /api/mecanica/orden-departamento-historial`:

```json
{
  "orden_id": "string",
  "departamento_id": "string",
  "estado_en_departamento": "En proceso",
  "actividad": "string",
  "fecha_entrada": "ISO string opcional si backend la genera",
  "ingresado_por_usuario_id": "string opcional",
  "observacion_interna": "string opcional",
  "observacion_cliente": "string opcional"
}
```

Payload esperado para `PUT /api/mecanica/orden-departamento-historial/{id}` al cerrar:

```json
{
  "estado_en_departamento": "Cerrado",
  "fecha_salida": "ISO string",
  "cerrado_por_usuario_id": "string opcional",
  "observacion_interna": "string opcional",
  "observacion_cliente": "string opcional",
  "decision_salida": "Mover | Finalizar",
  "departamento_siguiente_id": "string|null"
}
```

Respuesta minima esperada:

```json
{
  "id": "string",
  "orden_id": "string",
  "departamento_id": "string",
  "estado_en_departamento": "En proceso | Cerrado",
  "actividad": "string|null",
  "fecha_entrada": "ISO string",
  "fecha_salida": "ISO string|null",
  "decision_salida": "Mover | Finalizar | null",
  "departamento_siguiente_id": "string|null"
}
```

### Solicitudes de repuestos

Servicios reales:

```text
GET    /api/mecanica/solicitudes-repuestos
GET    /api/mecanica/solicitudes-repuestos/{id}
POST   /api/mecanica/solicitudes-repuestos
PUT    /api/mecanica/solicitudes-repuestos/{id}
DELETE /api/mecanica/solicitudes-repuestos/{id}
GET    /api/mecanica/orden/{ordenId}/solicitud-repuestos
```

Payload esperado para `POST /api/mecanica/solicitudes-repuestos`:

```json
{
  "orden_id": "string",
  "estado_solicitud": "Pendiente",
  "solicitado_por_usuario_id": "string opcional",
  "fecha_solicitud": "ISO string opcional si backend la genera",
  "observaciones": "string opcional"
}
```

Payload esperado para `PUT /api/mecanica/solicitudes-repuestos/{id}` al completar:

```json
{
  "estado_solicitud": "Completada",
  "gestionado_por_usuario_id": "string opcional",
  "fecha_completado": "ISO string",
  "observaciones": "string opcional"
}
```

Respuesta minima esperada:

```json
{
  "id": "string",
  "orden_id": "string",
  "estado_solicitud": "Pendiente | En gestion | Completada | Cancelada",
  "solicitado_por_usuario_id": "string|null",
  "gestionado_por_usuario_id": "string|null",
  "fecha_solicitud": "ISO string|null",
  "fecha_completado": "ISO string|null",
  "observaciones": "string|null"
}
```

Importante: el BDD tiene tabla `solicitud_repuesto_items`, pero Swagger no expone endpoints para items de repuesto. Para implementar items reales se necesita que backend agregue servicios como:

```text
GET  /api/mecanica/solicitudes-repuestos/{id}/items
POST /api/mecanica/solicitudes-repuestos/{id}/items
PUT  /api/mecanica/solicitudes-repuestos/{id}/items/{itemId}
```

Mientras esos endpoints no existan, la pantalla de repuestos solo puede gestionar la solicitud general o depender de que backend incluya los items dentro del objeto de solicitud.

## Servicios no expuestos en Swagger pero mencionados en el BDD

El BDD menciona estas tablas, pero Swagger no publica endpoints para ellas:

```text
solicitud_repuesto_items
comentarios_orden
adjuntos_orden
```

Estas funciones deben quedar como opcionales o bloqueadas hasta que backend exponga servicios.

## 1. Ingreso de vehiculo y creacion de orden

Objetivo:

Permitir que `ADMIN` o `RECEPCION` cree una orden cuando el cliente llega con su vehiculo.

Estado inicial esperado al crear orden:

```text
estado_general = Pendiente
etapa_actual = Ingreso
```

### Tareas Daniel

- Crear ruta `/ordenes/nueva`.
- Crear feature `work-orders` o `reception` segun convenga con la estructura actual.
- Crear formulario de ingreso empezando por datos del vehiculo.
- Capturar datos del vehiculo:
  - placa
  - vin
  - marca
  - modelo
  - anio
  - color
  - kilometraje
- Buscar cliente al final del formulario.
- Permitir asignar cliente existente.
- Si cliente no existe, abrir modal de alta rapida de cliente.
- Capturar motivo de ingreso.
- Capturar observacion interna inicial.
- Capturar observacion visible inicial para cliente, opcional.
- Capturar si requiere repuestos.
- Crear vehiculo en backend con `POST /api/mecanica/vehiculo`.
- Crear orden en backend con `POST /api/mecanica/orden-trabajo`.
- Redirigir a `/ordenes/[ordenId]` despues de guardar.
- Mostrar error claro si falta vehiculo, cliente o motivo.

### Servicios backend

#### Buscar cliente

```text
GET /api/mecanica/clientes
GET /api/mecanica/clientes/activos
GET /api/mecanica/clientepordocumento/{documento}
```

Devuelve lista u objeto de cliente con respuesta minima:

```json
{
  "id": "string",
  "nombre": "string",
  "apellido": "string|null",
  "documento": "string|null",
  "telefono": "string|null",
  "email": "string|null"
}
```

#### Crear cliente rapido

```text
POST /api/mecanica/cliente
```

Enviar:

```json
{
  "nombre": "string",
  "apellido": "string opcional",
  "documento": "string opcional",
  "telefono": "string opcional",
  "email": "string opcional",
  "direccion": "string opcional"
}
```

Debe devolver al menos:

```json
{
  "id": "string",
  "nombre": "string"
}
```

#### Crear vehiculo

```text
POST /api/mecanica/vehiculo
```

Enviar:

```json
{
  "cliente_id": "string",
  "placa": "string",
  "vin": "string opcional",
  "marca": "string",
  "modelo": "string",
  "anio": 2026,
  "color": "string opcional",
  "kilometraje": 0
}
```

Debe devolver al menos:

```json
{
  "id": "string",
  "cliente_id": "string",
  "placa": "string"
}
```

#### Crear orden

```text
POST /api/mecanica/orden-trabajo
```

Enviar si requiere repuestos:

```json
{
  "cliente_id": "string",
  "vehiculo_id": "string",
  "estado_general": "Pendiente",
  "etapa_actual": "Repuestos",
  "requiere_repuestos": true,
  "repuestos_completos": false,
  "departamento_actual_id": null,
  "motivo_ingreso": "string",
  "observacion_interna": "string opcional",
  "observacion_cliente": "string opcional"
}
```

Enviar si no requiere repuestos:

```json
{
  "cliente_id": "string",
  "vehiculo_id": "string",
  "estado_general": "Pendiente",
  "etapa_actual": "Seleccion de departamento",
  "requiere_repuestos": false,
  "repuestos_completos": false,
  "departamento_actual_id": null,
  "motivo_ingreso": "string",
  "observacion_interna": "string opcional",
  "observacion_cliente": "string opcional"
}
```

Debe devolver al menos:

```json
{
  "id": "string",
  "codigo": "string",
  "cliente_id": "string",
  "vehiculo_id": "string",
  "estado_general": "Pendiente",
  "etapa_actual": "Repuestos | Seleccion de departamento"
}
```

### UX minima

- Paso 1: Datos del vehiculo.
- Paso 2: Cliente del vehiculo.
- Paso 3: Motivo, observaciones y repuestos.
- Boton principal: `Crear orden`.
- Al terminar, mostrar la orden creada y su siguiente accion.

### Criterios de terminado

- `ADMIN` y `RECEPCION` pueden crear ordenes.
- La orden queda asociada a cliente y vehiculo.
- El vehiculo queda asociado al cliente.
- La orden guarda motivo de ingreso.
- La orden guarda si requiere repuestos.
- La pantalla no implementa CRUD administrativo completo de cliente ni vehiculo.

## 2. Dashboard operativo por departamento

Objetivo:

Cada rol operativo de departamento debe entrar a su propio dashboard y ver solo los vehiculos/ordenes asignados a su departamento. Esta tarea se implementa inmediatamente despues del ingreso inicial, porque los departamentos necesitan una vista clara para saber que vehiculos tienen en trabajo.

Aplica a:

```text
/departamentos/enderezado
/departamentos/pintura
/departamentos/ensamblaje
/departamentos/mecanica
/departamentos/lavado
```

### Reglas de visibilidad por rol

- `DEP_ENDEREZADA` solo ve ordenes asignadas a `ENDEREZADA`.
- `DEP_REPARACION_PINTURA` solo ve ordenes asignadas a `REPARACION_PINTURA`.
- `DEP_ENSAMBLAJE` solo ve ordenes asignadas a `ENSAMBLAJE`.
- `DEP_MECANICA` solo ve ordenes asignadas a `MECANICA`.
- `DEP_LAVADO_CALIDAD` solo ve ordenes asignadas a `LAVADO_CALIDAD`.
- El filtro principal es `departamento_actual_id`.
- Si backend entrega `departamento_actual.codigo`, se puede usar como apoyo visual o fallback.
- Si una orden no tiene departamento asignado, no se muestra en ningun dashboard `DEP_*`.
- Si una orden esta asignada a otro departamento, no se muestra.
- La tabla activa no muestra ordenes con `estado_general = Completado`.

### UX esperada

El dashboard debe mantener la experiencia visual actual:

```text
Header del departamento
-> Tarjetas de resumen por estado
-> Tabla de vehiculos/ordenes del departamento
```

La tabla debe quedar debajo de las tarjetas y debe mostrar los vehiculos/ordenes activas del departamento, ordenados por fecha de ingreso desde el mas nuevo hasta el mas antiguo.

Si el departamento no tiene vehiculos asignados activos, mostrar:

```text
No hay vehiculos asignados al departamento
```

### Tareas Daniel

- Conectar el dashboard de cada departamento a datos reales del backend.
- Crear la ruta faltante `/departamentos/ensamblaje`.
- Resolver el departamento operativo segun el rol autenticado.
- Filtrar por `departamento_actual_id`.
- Excluir de la tabla las ordenes con `estado_general = Completado`.
- Ordenar la tabla por ingreso descendente:
  - Primero usar `fecha_creacion`.
  - Si no existe, usar `creado_en`.
  - Si no existe, usar `actualizado_en` como ultimo fallback.
- Mostrar tarjetas de resumen por estado del departamento.
- Mostrar tabla con columnas minimas:
  - Vehiculo.
  - Placa.
  - Cliente.
  - Estado.
  - Actividad actual.
  - Fecha de ingreso.
  - Accion para abrir detalle.
- Mostrar estado vacio cuando el resultado filtrado queda vacio.
- Mantener el guard por rol: si un usuario entra a una ruta no permitida, redirigirlo a su dashboard/ruta inicial.

### Servicios backend

Listar ordenes:

```text
GET /api/mecanica/ordenes-trabajo
```

Campos minimos requeridos para alimentar el dashboard:

```json
{
  "id": "string",
  "codigo": "string",
  "cliente_id": "string",
  "vehiculo_id": "string",
  "vehiculo": {
    "placa": "string",
    "marca": "string",
    "modelo": "string"
  },
  "cliente": {
    "nombre": "string",
    "apellido": "string|null"
  },
  "estado_general": "Pendiente | En proceso | Completado",
  "etapa_actual": "Ingreso | Repuestos | Seleccion de departamento | En departamento | Finalizado",
  "departamento_actual_id": "string|null",
  "departamento_actual": {
    "id": "string",
    "codigo": "ENDEREZADA | REPARACION_PINTURA | ENSAMBLAJE | MECANICA | LAVADO_CALIDAD",
    "nombre": "string"
  },
  "actividad_actual": "string|null",
  "fecha_creacion": "ISO string",
  "creado_en": "ISO string|null",
  "actualizado_en": "ISO string|null"
}
```

Si el backend no devuelve `vehiculo`, `cliente` o `departamento_actual` embebidos, el frontend debe componer los datos con:

```text
GET /api/mecanica/vehiculo/{id}
GET /api/mecanica/cliente/{id}
GET /api/mecanica/departamento/{id}
```

### Criterios de terminado

- Cada dashboard `DEP_*` muestra header, tarjetas y tabla.
- Cada dashboard `DEP_*` muestra solo vehiculos/ordenes asignadas al departamento del rol.
- La tabla no muestra ordenes sin departamento asignado.
- La tabla no muestra ordenes de otros departamentos.
- La tabla no muestra ordenes con `estado_general = Completado`.
- La tabla se ordena desde el vehiculo ingresado mas recientemente.
- Si no existen vehiculos asignados activos, se muestra `No hay vehiculos asignados al departamento`.

## 3. Decision automatica de repuestos

Objetivo:

Despues de crear la orden, el sistema debe llevarla al siguiente paso correcto.

### Estados esperados

Si requiere repuestos:

```text
estado_general = Pendiente
etapa_actual = Repuestos
requiere_repuestos = true
repuestos_completos = false
```

Si no requiere repuestos:

```text
estado_general = Pendiente
etapa_actual = Seleccion de departamento
requiere_repuestos = false
repuestos_completos = false
```

### Tareas Daniel

- Definir `etapa_actual` correcta desde el `POST /api/mecanica/orden-trabajo`.
- Crear solicitud de repuestos cuando `requiere_repuestos = true`.
- Enviar la orden a `Seleccion de departamento` cuando `requiere_repuestos = false`.
- Bloquear seleccion de departamento si requiere repuestos y aun no estan completos.
- Mostrar el siguiente paso en el detalle de orden.

### Servicios backend

Si requiere repuestos, despues de crear orden:

```text
POST /api/mecanica/solicitudes-repuestos
```

Enviar:

```json
{
  "orden_id": "string",
  "estado_solicitud": "Pendiente",
  "observaciones": "string opcional"
}
```

Debe devolver:

```json
{
  "id": "string",
  "orden_id": "string",
  "estado_solicitud": "Pendiente"
}
```

Si se necesita corregir etapa despues de crear orden:

```text
PUT /api/mecanica/orden-trabajo/{id}
```

Enviar:

```json
{
  "etapa_actual": "Repuestos | Seleccion de departamento",
  "requiere_repuestos": true,
  "repuestos_completos": false
}
```

### Criterios de terminado

- Una orden con repuestos queda en etapa `Repuestos`.
- Una orden sin repuestos queda lista para seleccion de departamento.
- La UI muestra una sola accion principal segun la etapa.

## 4. Listado y detalle de ordenes

Objetivo:

Dar una vista clara para encontrar ordenes y operar el siguiente paso desde el detalle.

### Tareas Daniel

- Crear ruta `/ordenes`.
- Crear ruta `/ordenes/[ordenId]`.
- Listar ordenes con filtros simples en frontend si el backend aun no soporta query params:
  - Codigo.
  - Cliente.
  - Placa.
  - Estado general.
  - Etapa actual.
  - Departamento actual.
- Mostrar detalle de orden:
  - Codigo de orden.
  - Cliente.
  - Vehiculo.
  - Placa.
  - Motivo de ingreso.
  - Estado general.
  - Etapa actual.
  - Departamento actual.
  - Actividad actual.
  - Observacion visible para cliente.
  - Observacion interna.
  - Historial de departamentos.
  - Solicitud de repuestos si existe.
- Mostrar accion principal contextual:
  - Gestionar repuestos.
  - Seleccionar departamento.
  - Registrar avance.
  - Mover departamento.
  - Finalizar/despachar.

### Servicios backend

#### Listar ordenes

```text
GET /api/mecanica/ordenes-trabajo
```

Debe devolver lista de:

```json
{
  "id": "string",
  "codigo": "string",
  "cliente_id": "string",
  "vehiculo_id": "string",
  "estado_general": "Pendiente | En proceso | Completado",
  "etapa_actual": "Ingreso | Repuestos | Seleccion de departamento | En departamento | Finalizado",
  "departamento_actual_id": "string|null",
  "actividad_actual": "string|null",
  "observacion_cliente": "string|null",
  "fecha_creacion": "ISO string",
  "actualizado_en": "ISO string|null"
}
```

#### Detalle de orden

```text
GET /api/mecanica/orden-trabajo/{id}
GET /api/mecanica/orden/{ordenId}/orden-departamento-historial
GET /api/mecanica/orden/{ordenId}/solicitud-repuestos
GET /api/mecanica/cliente/{id}
GET /api/mecanica/vehiculo/{id}
```

El frontend puede componer el detalle con esas respuestas si `GET /orden-trabajo/{id}` no viene enriquecido.

### UX minima

- El listado debe servir para encontrar rapido una orden.
- El detalle debe evitar saltos innecesarios entre pantallas.
- Las acciones no permitidas deben verse bloqueadas con una razon breve.

### Criterios de terminado

- `ADMIN` puede ver todas las ordenes.
- Cada rol ve las ordenes que correspondan a su responsabilidad.
- El detalle refleja el estado real de la orden.
- No se muestra informacion interna al rol `CLIENTE`.

## 5. Repuestos

Objetivo:

Gestionar repuestos hasta desbloquear la seleccion de departamento.

### Tareas Daniel

- Crear ruta `/repuestos`.
- Crear feature `spare-parts`.
- Listar solicitudes pendientes.
- Ver solicitud por orden.
- Marcar solicitud como completada.
- Actualizar orden al completar repuestos:

```text
repuestos_completos = true
etapa_actual = Seleccion de departamento
estado_general = Pendiente
```

- Mostrar en `/ordenes/[ordenId]` el resumen de repuestos y el bloqueo si faltan items.

### Servicios backend

```text
GET /api/mecanica/solicitudes-repuestos
GET /api/mecanica/solicitudes-repuestos/{id}
GET /api/mecanica/orden/{ordenId}/solicitud-repuestos
PUT /api/mecanica/solicitudes-repuestos/{id}
PUT /api/mecanica/orden-trabajo/{id}
```

Para completar solicitud:

```json
{
  "estado_solicitud": "Completada",
  "fecha_completado": "ISO string",
  "observaciones": "string opcional"
}
```

Para desbloquear orden:

```json
{
  "repuestos_completos": true,
  "etapa_actual": "Seleccion de departamento",
  "estado_general": "Pendiente"
}
```

### Pendiente backend

El Swagger no publica endpoints para `solicitud_repuesto_items`. Si el negocio requiere items, backend debe exponerlos o incluirlos dentro de la solicitud.

### Criterios de terminado

- `ADMIN` y `REPUESTOS` pueden gestionar repuestos.
- Una orden con repuestos incompletos no puede asignarse a departamento.
- Al completar repuestos, la orden queda lista para seleccion de departamento.

## 6. Seleccion de departamento

Objetivo:

Asignar la orden al primer departamento operativo cuando ya esta lista.

Estado esperado al seleccionar departamento:

```text
estado_general = En proceso
etapa_actual = En departamento
departamento_actual_id = departamento seleccionado
fecha_inicio_proceso = fecha actual
```

Historial abierto esperado:

```text
orden_id
departamento_id
estado_en_departamento = En proceso
fecha_entrada
ingresado_por_usuario_id
actividad inicial
observaciones
fecha_salida = null
```

### Tareas Daniel

- Crear seccion o modal de seleccion de departamento en `/ordenes/[ordenId]`.
- Listar departamentos activos.
- Incluir departamentos operativos:
  - Enderezada.
  - Reparacion y pintura.
  - Ensamblaje.
  - Mecanica.
  - Lavado y control de calidad.
- Crear ruta faltante `/departamentos/ensamblaje`.
- Actualizar orden con departamento actual.
- Crear entrada en `orden_departamento_historial`.
- Validar que no exista otro historial abierto.
- Bloquear seleccion si requiere repuestos y no estan completos.

### Servicios backend

Listar departamentos:

```text
GET /api/mecanica/departamentos/activos
```

Actualizar orden:

```text
PUT /api/mecanica/orden-trabajo/{id}
```

Enviar:

```json
{
  "estado_general": "En proceso",
  "etapa_actual": "En departamento",
  "departamento_actual_id": "string",
  "actividad_actual": "string",
  "fecha_inicio_proceso": "ISO string"
}
```

Crear historial abierto:

```text
POST /api/mecanica/orden-departamento-historial
```

Enviar:

```json
{
  "orden_id": "string",
  "departamento_id": "string",
  "estado_en_departamento": "En proceso",
  "actividad": "string",
  "fecha_entrada": "ISO string",
  "ingresado_por_usuario_id": "string opcional",
  "observacion_interna": "string opcional",
  "observacion_cliente": "string opcional"
}
```

### UX minima

- Mostrar tarjetas o lista compacta de departamentos.
- El usuario debe elegir departamento y escribir una actividad inicial breve.
- Boton principal: `Enviar a departamento`.

### Criterios de terminado

- Una orden lista puede asignarse a un departamento.
- La asignacion crea un historial abierto.
- La orden aparece en la pantalla del departamento seleccionado.
- No quedan dos historiales abiertos para la misma orden.

## 7. Trabajo dentro del departamento

Objetivo:

Cada departamento ve sus ordenes actuales y registra avances sin perder trazabilidad.

La vista base del departamento y sus reglas de visibilidad se implementan en la Tarea 2. Esta tarea se enfoca en lo que el usuario puede hacer cuando abre una orden asignada a su departamento.

### Tareas Daniel

- Reutilizar el listado filtrado definido en la Tarea 2.
- Permitir abrir el detalle de una orden asignada al departamento.
- Mostrar en el detalle:
  - Codigo.
  - Cliente.
  - Vehiculo.
  - Placa.
  - Estado general.
  - Etapa actual.
  - Actividad actual.
  - Observacion visible para cliente.
  - Fecha de ingreso.
  - Ultima actualizacion.
- Registrar actividad actual.
- Registrar observacion interna.
- Registrar observacion visible para cliente.
- Reflejar actualizaciones en la orden y en el historial abierto.

### Servicios backend

Listar ordenes:

```text
GET /api/mecanica/ordenes-trabajo
```

Actualizar avance en orden:

```text
PUT /api/mecanica/orden-trabajo/{id}
```

Enviar:

```json
{
  "actividad_actual": "string",
  "observacion_interna": "string opcional",
  "observacion_cliente": "string opcional"
}
```

Actualizar historial abierto:

```text
PUT /api/mecanica/orden-departamento-historial/{id}
```

Enviar:

```json
{
  "actividad": "string",
  "observacion_interna": "string opcional",
  "observacion_cliente": "string opcional"
}
```

### Pendiente backend

`comentarios_orden` y `adjuntos_orden` no tienen endpoints en Swagger. Deben quedar para una fase posterior.

### Criterios de terminado

- Cada rol `DEP_*` puede abrir y operar solo ordenes de su departamento.
- `ADMIN` puede ver y operar todas las ordenes.
- La actualizacion queda guardada en la orden.
- El cliente no ve observaciones internas.

## 8. Movimiento entre departamentos

Objetivo:

Permitir que un departamento cierre su paso y envie la orden a otro departamento cuando el vehiculo aun no esta listo.

Historial esperado al mover:

```text
historial anterior:
  fecha_salida = fecha actual
  decision_salida = Mover
  departamento_siguiente_id = nuevo departamento

nuevo historial:
  departamento_id = nuevo departamento
  estado_en_departamento = En proceso
  fecha_entrada = fecha actual
  fecha_salida = null
```

### Tareas Daniel

- Agregar accion `Mover a otro departamento`.
- Mostrar modal de seleccion de siguiente departamento.
- Capturar actividad inicial para el nuevo departamento.
- Capturar observacion interna de cierre.
- Capturar observacion visible para cliente si aplica.
- Cerrar historial abierto anterior.
- Crear historial nuevo.
- Actualizar `departamento_actual_id`.
- Mantener:

```text
estado_general = En proceso
etapa_actual = En departamento
```

### Servicios backend

Cerrar historial anterior:

```text
PUT /api/mecanica/orden-departamento-historial/{historialId}
```

Enviar:

```json
{
  "estado_en_departamento": "Cerrado",
  "fecha_salida": "ISO string",
  "decision_salida": "Mover",
  "departamento_siguiente_id": "string",
  "cerrado_por_usuario_id": "string opcional",
  "observacion_interna": "string opcional",
  "observacion_cliente": "string opcional"
}
```

Actualizar orden:

```text
PUT /api/mecanica/orden-trabajo/{id}
```

Enviar:

```json
{
  "estado_general": "En proceso",
  "etapa_actual": "En departamento",
  "departamento_actual_id": "string",
  "actividad_actual": "string"
}
```

Crear nuevo historial:

```text
POST /api/mecanica/orden-departamento-historial
```

Enviar:

```json
{
  "orden_id": "string",
  "departamento_id": "string",
  "estado_en_departamento": "En proceso",
  "actividad": "string",
  "fecha_entrada": "ISO string",
  "ingresado_por_usuario_id": "string opcional"
}
```

### Criterios de terminado

- Mover orden cierra el historial anterior.
- Mover orden crea un nuevo historial abierto.
- La orden desaparece del departamento origen y aparece en el destino.
- No quedan dos historiales abiertos.

## 9. Finalizacion y despacho del vehiculo

Objetivo:

Cerrar la orden cuando el departamento declara que el vehiculo esta listo para entrega/despacho.

Estado esperado:

```text
estado_general = Completado
etapa_actual = Finalizado
actividad_actual = Vehiculo listo para entrega
fecha_finalizacion = fecha actual
```

Historial esperado:

```text
estado_en_departamento = Cerrado
decision_salida = Finalizar
fecha_salida = fecha actual
```

### Tareas Daniel

- Agregar accion `Finalizar/despachar vehiculo`.
- Mostrar modal de confirmacion.
- Capturar observacion visible final para cliente.
- Capturar observacion interna final si aplica.
- Cerrar historial abierto.
- Actualizar estado de la orden a `Completado`.
- Actualizar etapa a `Finalizado`.
- Actualizar actividad a `Vehiculo listo para entrega`.
- Registrar `fecha_finalizacion`.
- Bloquear nuevas ediciones operativas despues de finalizar, salvo perfiles autorizados.

### Servicios backend

Cerrar historial abierto:

```text
PUT /api/mecanica/orden-departamento-historial/{historialId}
```

Enviar:

```json
{
  "estado_en_departamento": "Cerrado",
  "decision_salida": "Finalizar",
  "fecha_salida": "ISO string",
  "cerrado_por_usuario_id": "string opcional",
  "observacion_interna": "string opcional",
  "observacion_cliente": "string opcional"
}
```

Actualizar orden:

```text
PUT /api/mecanica/orden-trabajo/{id}
```

Enviar:

```json
{
  "estado_general": "Completado",
  "etapa_actual": "Finalizado",
  "actividad_actual": "Vehiculo listo para entrega",
  "fecha_finalizacion": "ISO string",
  "observacion_cliente": "string opcional",
  "observacion_interna": "string opcional"
}
```

### Criterios de terminado

- Finalizar/despachar cierra el historial abierto.
- La orden queda `Completado` y `Finalizado`.
- La orden deja de aparecer como pendiente en departamentos.
- El cliente ve el estado final publico.

## 10. Seguimiento visible para cliente

Objetivo:

Permitir que `CLIENTE` consulte el estado de sus ordenes sin ver informacion interna.

Informacion visible:

```text
Codigo de orden
Estado general
Etapa actual
Departamento actual
Actividad actual
Ultima observacion visible para cliente
Fecha de ultima actualizacion
```

### Tareas Daniel

- Crear ruta `/cliente/ordenes`.
- Crear vista limitada para rol `CLIENTE`.
- Mostrar listado de ordenes del cliente autenticado.
- Mostrar detalle publico de orden.
- Ocultar observaciones internas.
- Ocultar historial interno si no esta marcado como visible.
- Validar que un cliente no pueda consultar ordenes de otro cliente.

### Servicios backend

```text
GET /api/mecanica/cliente/{cliente_id}/ordenes-trabajo
GET /api/mecanica/orden-trabajo/{id}
GET /api/mecanica/departamento/{id}
```

La vista debe usar solo estos campos:

```json
{
  "codigo": "string",
  "estado_general": "string",
  "etapa_actual": "string",
  "departamento_actual_id": "string|null",
  "actividad_actual": "string|null",
  "observacion_cliente": "string|null",
  "actualizado_en": "ISO string|null"
}
```

### Criterios de terminado

- `CLIENTE` solo ve sus ordenes.
- `CLIENTE` solo ve informacion publica.
- La vista refleja el estado actual de la orden.

## 11. Dashboard por rol

Objetivo:

Reemplazar los mocks y mostrar resumen del flujo segun el rol.

El dashboard debe actuar como pagina inicial del rol autenticado. Si el usuario intenta entrar a una ruta que no corresponde a su rol, el guard debe redirigirlo a su dashboard/ruta inicial permitida.

### Tareas Daniel

- Reemplazar datos de `mock-data.ts` en dashboard por datos reales.
- Para `ADMIN`, mostrar:
  - Ordenes pendientes.
  - Ordenes en proceso.
  - Ordenes completadas.
  - Ordenes por departamento.
  - Repuestos pendientes.
- Para `RECEPCION`, mostrar:
  - Ordenes en ingreso.
  - Ordenes listas para seleccion de departamento.
  - Ordenes creadas recientemente.
- Para `REPUESTOS`, mostrar:
  - Solicitudes pendientes.
  - Ordenes desbloqueadas por repuestos completos.
- Para roles `DEP_*`, mostrar:
  - Mantener las reglas ya definidas en la Tarea 2.
- Para `CLIENTE`, mostrar:
  - Ordenes visibles.
  - Estado actual.

### Servicios backend

```text
GET /api/mecanica/ordenes-trabajo
GET /api/mecanica/solicitudes-repuestos
GET /api/mecanica/departamentos/activos
GET /api/mecanica/cliente/{cliente_id}/ordenes-trabajo
```

### Criterios de terminado

- Dashboard muestra datos reales.
- Dashboard respeta rol.
- Dashboard de departamento respeta las reglas de la Tarea 2.
- Dashboard no expone datos internos al cliente.

## Orden recomendado de implementacion para Daniel

1. Ajustar servicios frontend a rutas reales del Swagger.
2. Implementar dashboard operativo por departamento segun la Tarea 2.
3. Crear tipos y utilidades de `work-orders` basados en los contratos de este documento.
4. Crear `/ordenes/nueva` con flujo vehiculo primero y cliente al final.
5. Crear `/ordenes` y `/ordenes/[ordenId]` como centro del flujo.
6. Implementar decision automatica de repuestos.
7. Crear `/repuestos` con solicitud general de repuestos.
8. Implementar seleccion de departamento.
9. Conectar acciones de trabajo dentro del departamento.
10. Implementar movimiento entre departamentos.
11. Implementar finalizacion/despacho.
12. Crear `/cliente/ordenes`.
13. Conectar dashboards restantes por rol.
14. Hacer QA con usuario `ADMIN` y luego por cada rol especifico.
15. Limpiar mocks del flujo final.

## Checklist Daniel

### Servicios

- [ ] Frontend usa `POST /api/mecanica/cliente`, no `/clientes`.
- [ ] Frontend usa `POST /api/mecanica/vehiculo`, no `/vehiculos`.
- [ ] Frontend usa `POST /api/mecanica/orden-trabajo`, no `/ordenes-trabajo`.
- [ ] Frontend usa `PUT /api/mecanica/orden-trabajo/{id}` para cambios de etapa/estado.
- [ ] Frontend usa `POST/PUT /api/mecanica/orden-departamento-historial` para asignar, mover y finalizar departamentos.
- [ ] Frontend usa `POST/PUT /api/mecanica/solicitudes-repuestos` para solicitudes generales.

### Ingreso

- [ ] `/ordenes/nueva` existe.
- [ ] Vehiculo se captura primero.
- [ ] Cliente se asigna al final.
- [ ] Modal permite crear cliente rapido si no existe.
- [ ] Vehiculo se crea asociado a cliente.
- [ ] Orden se crea con cliente, vehiculo, motivo y repuestos.
- [ ] No se duplica CRUD administrativo de cliente o vehiculo.

### Ordenes

- [ ] `/ordenes` lista ordenes reales.
- [ ] `/ordenes/[ordenId]` muestra detalle real.
- [ ] El detalle muestra una accion principal segun etapa.
- [ ] El detalle bloquea acciones no validas.

### Repuestos

- [ ] Orden con repuestos entra a etapa `Repuestos`.
- [ ] Solicitud de repuestos puede gestionarse.
- [ ] Orden no avanza con repuestos incompletos.
- [ ] Orden avanza cuando repuestos estan completos.
- [ ] Se documenta bloqueo por falta de endpoints de items si aplica.

### Departamento

- [ ] Orden puede seleccionar departamento.
- [ ] Se crea historial abierto.
- [ ] Departamento ve sus ordenes.
- [ ] Dashboard de departamento muestra solo vehiculos asignados a ese departamento.
- [ ] Dashboard de departamento oculta ordenes completadas en la tabla activa.
- [ ] Dashboard de departamento ordena la tabla desde el ingreso mas reciente.
- [ ] Dashboard de departamento muestra `No hay vehiculos asignados al departamento` cuando aplica.
- [ ] Departamento registra actividad.
- [ ] Departamento registra observacion interna.
- [ ] Departamento registra observacion visible para cliente.

### Movimiento

- [ ] Orden puede moverse a otro departamento.
- [ ] Historial anterior se cierra al mover.
- [ ] Historial nuevo se crea al mover.
- [ ] No quedan dos historiales abiertos.

### Despacho

- [ ] Orden puede finalizarse/despacharse.
- [ ] Historial se cierra al finalizar.
- [ ] Orden queda `Completado`.
- [ ] Orden queda `Finalizado`.
- [ ] Cliente ve estado final publico.

### Cliente

- [ ] Cliente ve solo sus ordenes.
- [ ] Cliente ve solo informacion publica.
- [ ] Cliente no ve observaciones internas.

### Limpieza

- [ ] Dashboard usa datos reales.
- [ ] Pantallas de departamentos usan datos reales.
- [ ] `mock-data.ts` no alimenta el flujo final.

## Archivos/rutas actuales que deben evolucionar

```text
src/features/work-orders/services/work-orders-service.ts
src/features/work-orders/components/new-work-order-form.tsx
src/features/departments/components/department-view.tsx
src/features/dashboard/components/role-dashboard.tsx
src/features/dashboard/components/stats.tsx
src/lib/data/mock-data.ts
```

`mock-data.ts` debe desaparecer del flujo final o quedar solo como datos de desarrollo no usados por pantallas reales.
