# Servicios backend modulo mecanica

Fuente revisada: `http://localhost:8011/api/mecanica/docs`.

## Notas importantes

- Todos los endpoints vienen del Swagger JSON en `/api/mecanica/swagger.json`.
- Cuando un endpoint indica `Auth: Bearer JWT`, el frontend debe enviar `Authorization: Bearer <token>`.
- La documentacion actual del backend no declara campos especificos para la mayoria de `requestBody` ni para la respuesta `200`; Swagger los marca como `Objeto JSON libre`.
- Por eso este documento describe con certeza metodo, ruta, parametros, autenticacion y codigos de respuesta; los campos internos exactos deben confirmarse con backend o mejorarse en Swagger.

## Resumen por servicio

### Autenticacion

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| POST | `/api/mecanica/login` | Auth: no requerida segun Swagger | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>500: Error interno del servidor |

### Cliente

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/cliente/{cliente_id}/ordenes-trabajo` | Path: cliente_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/cliente/{cliente_id}/vehiculos` | Path: cliente_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/cliente/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| PUT | `/api/mecanica/cliente/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/cliente` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Clientepordocumento

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/clientepordocumento/{documento}` | Path: documento (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Clientes

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| DELETE | `/api/mecanica/clientes/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/clientes/activos` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/clientes/buscar` | Auth: no requerida segun Swagger | No aplica | 200: Respuesta exitosa<br>500: Error interno del servidor |
| GET | `/api/mecanica/clientes` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Departamento

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| DELETE | `/api/mecanica/departamento/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/departamento/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| PUT | `/api/mecanica/departamento/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/departamento` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Departamentos

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/departamentos/activos` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/departamentos/buscar` | Auth: no requerida segun Swagger | No aplica | 200: Respuesta exitosa<br>500: Error interno del servidor |
| GET | `/api/mecanica/departamentos` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Empresa

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/empresa/{empresa_id}/clientes` | Path: empresa_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresa/{empresa_id}/departamentos` | Path: empresa_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresa/{empresa_id}/orden-departamento-historial` | Path: empresa_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresa/{empresa_id}/ordenes-trabajo` | Path: empresa_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresa/{empresa_id}/roles` | Path: empresa_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresa/{empresa_id}/solicitudes-repuestos` | Path: empresa_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresa/{empresa_id}/sucursales` | Path: empresa_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresa/{empresa_id}/usuario-roles` | Path: empresa_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresa/{empresa_id}/usuarios` | Path: empresa_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresa/{empresa_id}/vehiculos` | Path: empresa_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| DELETE | `/api/mecanica/empresa/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresa/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| PUT | `/api/mecanica/empresa/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/empresa` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Empresaporruc

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/empresaporruc/{ruc}` | Path: ruc (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Empresas

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/empresas/activas` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresas/buscar` | Auth: no requerida segun Swagger | No aplica | 200: Respuesta exitosa<br>500: Error interno del servidor |
| GET | `/api/mecanica/empresas` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Orden

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/orden/{ordenId}/orden-departamento-historial` | Path: ordenId (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/orden/{ordenId}/solicitud-repuestos` | Path: ordenId (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Orden Departamento Historial

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| DELETE | `/api/mecanica/orden-departamento-historial/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/orden-departamento-historial/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| PUT | `/api/mecanica/orden-departamento-historial/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/orden-departamento-historial` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/orden-departamento-historial` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Orden Trabajo

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| DELETE | `/api/mecanica/orden-trabajo/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/orden-trabajo/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| PUT | `/api/mecanica/orden-trabajo/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/orden-trabajo` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Ordenes Trabajo

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/ordenes-trabajo` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Rol

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| DELETE | `/api/mecanica/rol/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/rol/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| PUT | `/api/mecanica/rol/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/rol/{rol_id}/usuarios` | Path: rol_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/rol` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Roles

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/roles/activos` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/roles/buscar` | Auth: no requerida segun Swagger | No aplica | 200: Respuesta exitosa<br>500: Error interno del servidor |
| GET | `/api/mecanica/roles` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Solicitudes Repuestos

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| DELETE | `/api/mecanica/solicitudes-repuestos/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/solicitudes-repuestos/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| PUT | `/api/mecanica/solicitudes-repuestos/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/solicitudes-repuestos` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/solicitudes-repuestos` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Sucursal

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| DELETE | `/api/mecanica/sucursal/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursal/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| PUT | `/api/mecanica/sucursal/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursal/{sucursal_id}/clientes` | Path: sucursal_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursal/{sucursal_id}/departamentos` | Path: sucursal_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursal/{sucursal_id}/orden-departamento-historial` | Path: sucursal_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursal/{sucursal_id}/ordenes-trabajo` | Path: sucursal_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursal/{sucursal_id}/roles` | Path: sucursal_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursal/{sucursal_id}/solicitudes-repuestos` | Path: sucursal_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursal/{sucursal_id}/usuario-roles` | Path: sucursal_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursal/{sucursal_id}/usuarios` | Path: sucursal_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursal/{sucursal_id}/vehiculos` | Path: sucursal_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/sucursal` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Sucursales

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/sucursales/activas` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursales/buscar` | Auth: no requerida segun Swagger | No aplica | 200: Respuesta exitosa<br>500: Error interno del servidor |
| GET | `/api/mecanica/sucursales` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Usuario

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| DELETE | `/api/mecanica/usuario/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/usuario/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| PUT | `/api/mecanica/usuario/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/usuario/{usuario_id}/roles` | Path: usuario_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/usuario` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Usuario Rol

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| DELETE | `/api/mecanica/usuario-rol/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/usuario-rol/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/usuario-rol` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Usuario Roles

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/usuario-roles` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Usuarios

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/usuarios/buscar` | Auth: no requerida segun Swagger | No aplica | 200: Respuesta exitosa<br>500: Error interno del servidor |
| GET | `/api/mecanica/usuarios` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Vehiculo

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| DELETE | `/api/mecanica/vehiculo/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/vehiculo/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| PUT | `/api/mecanica/vehiculo/{id}` | Path: id (string) requerido<br>Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/vehiculo/{vehiculo_id}/ordenes-trabajo` | Path: vehiculo_id (string) requerido<br>Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| POST | `/api/mecanica/vehiculo` | Auth: Bearer JWT | Opcional: Objeto JSON libre (Swagger no detalla campos) | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |

### Vehiculos

| Metodo | Ruta | Necesita | Body | Devuelve |
| --- | --- | --- | --- | --- |
| GET | `/api/mecanica/vehiculos/activos` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
| GET | `/api/mecanica/vehiculos` | Auth: Bearer JWT | No aplica | 200: Respuesta exitosa<br>401: Token invalido o expirado<br>403: Token requerido<br>500: Error interno del servidor |
