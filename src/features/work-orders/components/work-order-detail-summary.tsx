"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Loader2,
  Plus,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { hasAnyRole, hasExplicitRole } from "@/features/auth/permissions"
import { ESTADO_PROCESO_CODES } from "@/features/estados-proceso/constants"
import type { EstadoProceso } from "@/features/estados-proceso/types"
import { WorkOrderStateTransitionDialog } from "@/features/work-orders/components/work-order-state-transition-dialog"
import { workOrdersService } from "@/features/work-orders/services/work-orders-service"
import {
  findCurrentProcessState,
  getWorkOrderTransitionTargets,
  loadProcessStateAccess,
} from "@/features/work-orders/state-access"
import type { EntityId, WorkOrder } from "@/features/work-orders/types"
import {
  getCustomerDisplayName,
  getVehicleDisplayName,
  getWorkOrderPrimaryAction,
} from "@/features/work-orders/utils"

interface WorkOrderDetailSummaryProps {
  orderId: EntityId
}

function getErrorMessage(error: unknown, fallback = "No fue posible cargar la orden.") {
  return error instanceof Error ? error.message : fallback
}

function getStateAccessErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No fue posible cargar los estados habilitados para tu rol."
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
  const { user } = useAuth()
  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [processStates, setProcessStates] = useState<EstadoProceso[]>([])
  const [allowedProcessStateIds, setAllowedProcessStateIds] = useState<Set<string>>(
    () => new Set()
  )
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [stateAccessError, setStateAccessError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStateAccess, setIsLoadingStateAccess] = useState(true)
  const canOpenNewOrder = hasAnyRole(user, ["ASESOR", "RECEPCION"])
  const newOrderHref = hasExplicitRole(user, ["ASESOR"])
    ? "/departamentos/asesor/nueva-orden"
    : "/ordenes/nueva"

  useEffect(() => {
    let isMounted = true

    async function loadOrder() {
      setIsLoading(true)
      setError(null)
      setActionError(null)

      try {
        const result = await workOrdersService.getWorkOrder(orderId)

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

  useEffect(() => {
    let isMounted = true

    async function loadStateAccess() {
      if (!user) {
        setProcessStates([])
        setAllowedProcessStateIds(new Set())
        setStateAccessError(null)
        setIsLoadingStateAccess(false)
        return
      }

      setIsLoadingStateAccess(true)
      setStateAccessError(null)

      try {
        const stateAccess = await loadProcessStateAccess(user)

        if (isMounted) {
          setProcessStates(stateAccess.processStates)
          setAllowedProcessStateIds(stateAccess.allowedProcessStateIds)
        }
      } catch (loadError) {
        if (isMounted) {
          setProcessStates([])
          setAllowedProcessStateIds(new Set())
          setStateAccessError(getStateAccessErrorMessage(loadError))
        }
      } finally {
        if (isMounted) {
          setIsLoadingStateAccess(false)
        }
      }
    }

    void loadStateAccess()

    return () => {
      isMounted = false
    }
  }, [user])

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
          <div className="flex flex-wrap gap-2">
            <Link href="/ordenes" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="size-4" />
              Volver a ordenes
            </Link>
            {canOpenNewOrder && (
              <Link href={newOrderHref} className={buttonVariants({ variant: "outline" })}>
                <Plus className="size-4" />
                Nuevo ingreso
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const primaryAction = getWorkOrderPrimaryAction(order)
  const isAdmin = hasAnyRole(user, ["ADMIN"])
  const currentProcessState = findCurrentProcessState(order, processStates)
  const transitionTargets = getWorkOrderTransitionTargets(order, processStates, {
    allowedSourceStateCodes: [ESTADO_PROCESO_CODES.ASESOR],
    allowedTargetStateCodes: [ESTADO_PROCESO_CODES.JEFE_TALLER],
  })
  const isDirectTransitionSource =
    String(currentProcessState?.codigo ?? "").toUpperCase() === ESTADO_PROCESO_CODES.ASESOR
  const hasActionRole = hasAnyRole(user, primaryAction.allowedRoles)
  const hasStateAccess =
    isAdmin || Boolean(currentProcessState && allowedProcessStateIds.has(currentProcessState.id))
  const actionBlockReason =
    primaryAction.reason ??
    (isLoadingStateAccess ? "Validando estados habilitados para tu rol." : undefined) ??
    stateAccessError ??
    (!hasActionRole ? "Tu rol no tiene habilitada esta funcion." : undefined) ??
    (!isAdmin && !currentProcessState
      ? "No se encontro un estado de proceso que coincida con la etapa actual de la orden."
      : undefined) ??
    (!hasStateAccess
      ? "Tu rol no tiene acceso al estado actual de esta orden."
      : undefined)
  const transitionBlockReason =
    (isLoadingStateAccess ? "Validando estados habilitados para tu rol." : undefined) ??
    stateAccessError ??
    (!isAdmin && !currentProcessState
      ? "No se encontro un estado de proceso que coincida con la etapa actual de la orden."
      : undefined) ??
    (!hasStateAccess
      ? "Tu rol no tiene acceso al estado actual de esta orden."
      : undefined) ??
    (!isDirectTransitionSource
      ? "Esta accion solo esta disponible desde Asesoria / Ingreso."
      : undefined) ??
    (transitionTargets.length === 0
      ? "La orden no tiene destino activo para Jefe de Taller."
      : undefined)
  const canMoveToTargetState =
    !isLoadingStateAccess &&
    !stateAccessError &&
    hasStateAccess &&
    transitionTargets.length > 0
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
        <div className="flex flex-wrap gap-2">
          <Link href="/ordenes" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="size-4" />
            Volver a ordenes
          </Link>
          {canOpenNewOrder && (
            <Link href={newOrderHref} className={buttonVariants({ variant: "outline" })}>
              <Plus className="size-4" />
              Nuevo ingreso
            </Link>
          )}
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {actionError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4" />
            Siguiente accion
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">
              {transitionTargets.length > 0
                ? "Enviar a estado permitido"
                : primaryAction.label}
            </p>
            <p className="text-sm text-muted-foreground">
              {canMoveToTargetState
                ? `Destinos disponibles: ${transitionTargets
                    .map((targetState) => targetState.nombre)
                    .join(", ")}`
                : transitionBlockReason ?? actionBlockReason}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={canMoveToTargetState ? "default" : "outline"}>
              {canMoveToTargetState ? "Funcion habilitada" : "Funcion bloqueada"}
            </Badge>
            {currentProcessState && <Badge variant="outline">{currentProcessState.nombre}</Badge>}
            <Badge variant="outline">{order.estado_general}</Badge>
            <WorkOrderStateTransitionDialog
              order={order}
              processStates={processStates}
              allowedSourceStateCodes={[ESTADO_PROCESO_CODES.ASESOR]}
              allowedTargetStateCodes={[ESTADO_PROCESO_CODES.JEFE_TALLER]}
              disabled={!hasStateAccess || Boolean(stateAccessError) || isLoadingStateAccess}
              currentStateName={currentProcessState?.nombre ?? order.etapa_actual}
              vehicleName={vehicleName}
              customerName={customerName}
              unavailableMessage="Esta orden solo se puede enviar desde Asesoria / Ingreso hacia Jefe de Taller."
              onError={setActionError}
              onOrderUpdated={setOrder}
              trigger={({ isSubmitting }) => (
                <Button
                  type="button"
                  disabled={
                    isSubmitting ||
                    !hasStateAccess ||
                    Boolean(stateAccessError) ||
                    isLoadingStateAccess
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  Enviar la orden
                </Button>
              )}
            />
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

    </div>
  )
}
