# Resumen de servicios de mecanica para frontend

Todos los servicios de mecanica trabajan con `empresa_id` para mantener la logica multiempresa.

Los endpoints de mecanica usan autenticacion, excepto la busqueda rapida de estados por codigo.

## Vehiculos

### Crear vehiculo

`POST /api/mecanica/vehiculo`

Campos obligatorios:

```json
{
  "empresa_id": 1,
  "sucursal_id": 1,
  "cliente_nombre": "Juan Perez",
  "cliente_cedula": "0912345678",
  "placa": "ABC1234",
  "marca": "Toyota",
  "modelo": "Corolla"
}
```

Campos opcionales:

```json
{
  "vin": null,
  "anio": null,
  "color": null,
  "kilometraje": null,
  "activo": true
}
```

Notas:

- `sucursal_id` es obligatorio.
- La placa se guarda en mayusculas.
- Si la placa ya existe para la empresa, el backend responde `409`.
- Ya no existe tabla `clientes`; los datos del cliente viven en `vehiculos` como `cliente_nombre` y `cliente_cedula`.

### Actualizar vehiculo

`PUT /api/mecanica/vehiculo/:id`

Se pueden enviar solo los campos que se quieran modificar.

Ejemplo:

```json
{
  "cliente_nombre": "Juan Perez",
  "cliente_cedula": "0912345678",
  "placa": "ABC1234",
  "marca": "Toyota",
  "modelo": "Corolla",
  "anio": 2020,
  "color": "Blanco",
  "kilometraje": 25000
}
```

## Ordenes de trabajo

### Crear orden de trabajo

`POST /api/mecanica/orden-trabajo`

Campos obligatorios:

```json
{
  "empresa_id": 1,
  "sucursal_id": 1,
  "vehiculo_id": 1,
  "creado_por_usuario_id": 2
}
```

Campos opcionales:

```json
{
  "estado_actual_id": 1,
  "aseguradora_id": null,
  "broker_id": null,
  "sub_estado_actual": null,
  "encuesta_realizada": false,
  "fecha_encuesta": null,
  "fecha_inicio_proceso": null,
  "fecha_finalizacion": null
}
```

Notas:

- Si no se envia `estado_actual_id`, el backend intenta usar el estado activo con codigo `ASESOR`.
- `aseguradora_id` y `broker_id` son opcionales.
- Si se envia `aseguradora_id`, debe pertenecer a la misma `empresa_id`.
- Si se envia `broker_id`, debe pertenecer a la misma `empresa_id`.
- `sub_estado_actual` solo aplica para estados tipo bahia.
- Valores permitidos para `sub_estado_actual`: `Pendiente`, `En proceso`, `Completada`.
- Para estados que no son bahia, como `ASESOR`, `JEFE_TALLER`, `REPUESTOS` o `FINALIZADO`, enviar `sub_estado_actual: null` o no enviarlo.
- `codigo` y `codigo_seguimiento` los genera la base de datos si no se envian.

### Actualizar orden de trabajo

`PUT /api/mecanica/orden-trabajo/:id`

Se pueden enviar solo los campos que se quieran modificar.

Ejemplo para mover una orden a Jefe de Taller:

```json
{
  "estado_actual_id": 2,
  "sub_estado_actual": null
}
```

Ejemplo para mover una orden a Repuestos:

```json
{
  "estado_actual_id": 3,
  "sub_estado_actual": null
}
```

Ejemplo para una bahia:

```json
{
  "estado_actual_id": 5,
  "sub_estado_actual": "Pendiente"
}
```

Ejemplo para completar una bahia:

```json
{
  "sub_estado_actual": "Completada"
}
```

Notas sobre cambios de estado:

- Para cambiar el estado real de la orden, usar `PUT /api/mecanica/orden-trabajo/:id`.
- `estado_actual_id` depende del estado destino. El frontend debe obtenerlo desde el catalogo de estados.
- Para Jefe de Taller se usa el `id` del estado con codigo `JEFE_TALLER`.
- Para Repuestos se usa el `id` del estado con codigo `REPUESTOS`.
- En estados no bahia, `sub_estado_actual` debe ir `null`.
- En estados bahia, `sub_estado_actual` puede ser `Pendiente`, `En proceso` o `Completada`.
- Cuando `sub_estado_actual` cambia a `Completada`, la base registra automaticamente un historial por trigger.

### Consultar ordenes

Endpoints disponibles:

- `GET /api/mecanica/orden-trabajo/:id`
- `GET /api/mecanica/ordenes-trabajo`
- `GET /api/mecanica/empresa/:empresa_id/ordenes-trabajo`
- `GET /api/mecanica/sucursal/:sucursal_id/ordenes-trabajo`
- `GET /api/mecanica/cliente-cedula/:cliente_cedula/ordenes-trabajo`
- `GET /api/mecanica/vehiculo/:vehiculo_id/ordenes-trabajo`
- `GET /api/mecanica/estado/:estado_actual_id/ordenes-trabajo`

Las respuestas de orden incluyen relaciones como:

```json
{
  "vehiculo": {},
  "cliente": {},
  "estado_actual": {},
  "creado_por": {},
  "aseguradora": {
    "id": 1,
    "nombre": "Seguros Equinoccial",
    "ruc": null,
    "telefono": null,
    "email": null
  },
  "broker": {
    "id": 1,
    "nombre": "Broker Integral Ecuador",
    "ruc": null,
    "telefono": null,
    "email": null
  }
}
```

## Historial de estado

### Crear historial manual

`POST /api/mecanica/orden-estado-historial`

Campos obligatorios:

```json
{
  "empresa_id": 1,
  "sucursal_id": 1,
  "orden_id": 1,
  "estado_id": 3,
  "registrado_por_usuario_id": 2
}
```

Campos opcionales:

```json
{
  "sub_estado": null
}
```

Notas:

- Ya no se envian `comentario_cliente` ni `comentario_interno`.
- Crear historial manual no cambia automaticamente `estado_actual_id` en la orden.
- Para cambiar el estado real, usar `PUT /api/mecanica/orden-trabajo/:id`.
- `sub_estado` solo aplica si el estado es tipo bahia.
- La base tambien crea historial automaticamente cuando una orden cambia `sub_estado_actual` a `Completada`.

### Consultar historial

Endpoints disponibles:

- `GET /api/mecanica/orden-estado-historial/:id`
- `GET /api/mecanica/orden-estado-historial`
- `GET /api/mecanica/empresa/:empresa_id/orden-estado-historial`
- `GET /api/mecanica/sucursal/:sucursal_id/orden-estado-historial`
- `GET /api/mecanica/orden/:orden_id/orden-estado-historial`
- `GET /api/mecanica/estado/:estado_id/orden-estado-historial`

## Aseguradoras

### Crear aseguradora

`POST /api/mecanica/aseguradora`

Campos obligatorios:

```json
{
  "empresa_id": 1,
  "nombre": "Seguros Equinoccial"
}
```

Campos opcionales:

```json
{
  "ruc": null,
  "telefono": null,
  "email": null,
  "direccion": null,
  "activo": true
}
```

Notas:

- No se permite repetir `nombre` dentro de la misma `empresa_id`.
- El borrado desactiva el registro con `activo = false`.

Endpoints disponibles:

- `POST /api/mecanica/aseguradora`
- `GET /api/mecanica/aseguradora/:id`
- `PUT /api/mecanica/aseguradora/:id`
- `PUT /api/mecanica/aseguradora/:id/activo`
- `GET /api/mecanica/aseguradoras`
- `GET /api/mecanica/aseguradoras/activas`
- `GET /api/mecanica/empresa/:empresa_id/aseguradoras`
- `DELETE /api/mecanica/aseguradora/:id`

Activar o desactivar:

```json
{
  "activo": false
}
```

## Brokers

### Crear broker

`POST /api/mecanica/broker`

Campos obligatorios:

```json
{
  "empresa_id": 1,
  "nombre": "Broker Integral Ecuador"
}
```

Campos opcionales:

```json
{
  "ruc": null,
  "telefono": null,
  "email": null,
  "direccion": null,
  "activo": true
}
```

Notas:

- No se permite repetir `nombre` dentro de la misma `empresa_id`.
- El borrado desactiva el registro con `activo = false`.

Endpoints disponibles:

- `POST /api/mecanica/broker`
- `GET /api/mecanica/broker/:id`
- `PUT /api/mecanica/broker/:id`
- `PUT /api/mecanica/broker/:id/activo`
- `GET /api/mecanica/brokers`
- `GET /api/mecanica/brokers/activos`
- `GET /api/mecanica/empresa/:empresa_id/brokers`
- `DELETE /api/mecanica/broker/:id`

Activar o desactivar:

```json
{
  "activo": false
}
```

## Estados de proceso

El frontend debe consultar estados para saber que `estado_actual_id` enviar al cambiar una orden.

Endpoints disponibles:

- `GET /api/mecanica/empresa/:empresa_id/estados-proceso`
- `GET /api/mecanica/estados-proceso`
- `GET /api/mecanica/estados-proceso/activos`
- `GET /api/mecanica/estado-proceso/:id`
- `GET /api/mecanica/estados-proceso/buscar?codigo=JEFE`

Codigos importantes:

- `ASESOR`
- `JEFE_TALLER`
- `REPUESTOS`
- `PROGRAMAR_CITA`
- `ENDEREZADA`
- `PINTURA`
- `ENSAMBLAJE`
- `MECANICA`
- `LAVADO`
- `FINALIZADO`

## Reglas importantes para frontend

- No enviar campos eliminados de ordenes: `motivo_ingreso`, `requiere_repuestos`, `repuestos_completos`, `agendar_cita`, `fecha_cita`, `observaciones_cita`, `vehiculo_en_taller`, `observacion_interna`.
- No enviar campos eliminados de historial: `comentario_cliente`, `comentario_interno`.
- Para cambiar estado de una orden, actualizar la orden con `PUT /api/mecanica/orden-trabajo/:id`.
- El historial manual es solo registro; no sincroniza la orden.
- En estados no bahia, `sub_estado_actual` debe ser `null`.
- En estados bahia, usar `sub_estado_actual`.
- Si el frontend quiere limpiar `aseguradora_id` o `broker_id`, debe enviar `null`.
