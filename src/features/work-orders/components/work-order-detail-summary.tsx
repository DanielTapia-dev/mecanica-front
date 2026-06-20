"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, ClipboardList, Loader2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { workOrdersService } from "@/features/work-orders/services/work-orders-service"
import type { EntityId, WorkOrder } from "@/features/work-orders/types"
import {
  getCustomerDisplayName,
  getVehicleDisplayName,
  getWorkOrderPrimaryAction,
} from "@/features/work-orders/utils"

interface WorkOrderDetailSummaryProps {
  orderId: EntityId
}

function getAuthToken() {
  return localStorage.getItem("auth_token") ?? undefined
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar la orden."
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Sin fecha"
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function WorkOrderDetailSummary({ orderId }: WorkOrderDetailSummaryProps) {
  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadOrder() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await workOrdersService.getWorkOrder(orderId, {
          token: getAuthToken(),
        })

        if (isMounted) {
          setOrder(result)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadOrder()

    return () => {
      isMounted = false
    }
  }, [orderId])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando orden...
        </CardContent>
      </Card>
    )
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error ?? "No encontramos la orden creada."}
          </div>
          <Link href="/ordenes/nueva" className={buttonVariants({ variant: "outline" })}>
            <Plus className="size-4" />
            Nuevo ingreso
          </Link>
        </CardContent>
      </Card>
    )
  }

  const primaryAction = getWorkOrderPrimaryAction(order)
  const customerName = getCustomerDisplayName(order)
  const vehicleName = getVehicleDisplayName(order)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Orden {order.codigo || order.id}
          </h1>
          <p className="text-sm text-muted-foreground">
            Creada el {formatDate(order.fecha_creacion)}
          </p>
        </div>
        <Link href="/ordenes/nueva" className={buttonVariants({ variant: "outline" })}>
          <Plus className="size-4" />
          Nuevo ingreso
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4" />
            Siguiente accion
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">{primaryAction.label}</p>
            {primaryAction.reason && (
              <p className="text-sm text-muted-foreground">{primaryAction.reason}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{order.estado_general}</Badge>
            <Badge>{order.etapa_actual}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{customerName}</p>
            <p className="text-muted-foreground">
              {order.cliente?.documento ?? "Documento no cargado"}
            </p>
            <p className="text-muted-foreground">
              {order.cliente?.telefono ?? order.cliente?.email ?? "Contacto no cargado"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehiculo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">{vehicleName}</p>
            <p className="text-muted-foreground">
              Placa {order.vehiculo?.placa ?? order.vehiculo_id}
            </p>
            <p className="text-muted-foreground">
              {order.vehiculo?.kilometraje ?? 0} km
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium text-foreground">
              {order.requiere_repuestos ? "Requiere repuestos" : "Sin repuestos"}
            </p>
            <p className="text-muted-foreground">
              {order.repuestos_completos ? "Repuestos completos" : "Repuestos pendientes"}
            </p>
            <p className="text-muted-foreground">
              {order.actividad_actual ?? "Ingreso registrado"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Motivo de ingreso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">{order.motivo_ingreso}</p>
          {order.observacion_cliente && (
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-muted-foreground">
              {order.observacion_cliente}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
