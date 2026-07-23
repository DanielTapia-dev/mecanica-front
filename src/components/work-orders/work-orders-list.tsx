"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Calendar,
  ClipboardList,
  Clock,
  Loader2,
  MoreHorizontal,
  Search,
} from "lucide-react"
import { ModuleHeader } from "@/components/layout/module-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/features/auth/auth-context"
import {
  ESTADO_PROCESO_CODES,
  ESTADO_PROCESO_LABELS,
  type EstadoProcesoCode,
} from "@/features/estados-proceso/constants"
import { WorkOrderStateTransitionDialog } from "@/features/work-orders/components/work-order-state-transition-dialog"
import { workOrdersService } from "@/features/work-orders/services/work-orders-service"
import {
  hasAnyRole,
  hasExplicitRole,
} from "@/features/auth/permissions"
import {
  canAccessCurrentProcessState,
  loadProcessStateAccess,
  sortProcessStatesByVisualOrder,
  type ProcessStateAccess,
} from "@/features/work-orders/state-access"
import { getWorkOrderProcessTransitionConfig } from "@/features/work-orders/transitions"
import {
  getProcessStateVisual,
  type ProcessStateVisual,
} from "@/features/work-orders/process-state-visuals"
import type { WorkOrderListItem } from "@/features/work-orders/types"
import {
  filterWorkOrders,
  getCustomerDisplayName,
  getVehicleDisplayName,
  getWorkOrderUpdatedAt,
  sortWorkOrdersByUpdatedAt,
} from "@/features/work-orders/utils"

function getErrorMessage(
  error: unknown,
  fallback = "No fue posible cargar las ordenes."
) {
  return error instanceof Error ? error.message : fallback
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

function getOrderReferenceDate(order: WorkOrderListItem) {
  return getWorkOrderUpdatedAt(order) ?? order.fecha_creacion ?? order.creado_en ?? null
}

function isSameLocalDate(value?: string | null, compareDate = new Date()) {
  if (!value) {
    return false
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return (
    date.getFullYear() === compareDate.getFullYear() &&
    date.getMonth() === compareDate.getMonth() &&
    date.getDate() === compareDate.getDate()
  )
}

function getDaysWaiting(value?: string | null) {
  if (!value) {
    return 0
  }

  const date = new Date(value)
  const time = date.getTime()

  if (Number.isNaN(time)) {
    return 0
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000

  return Math.max(0, Math.floor((Date.now() - time) / millisecondsPerDay))
}

function isActiveProcessStateOrder(order: WorkOrderListItem) {
  return (
    String(order.estado_general).toLowerCase() !== "completado" &&
    !order.fecha_finalizacion
  )
}

function getScopedOrders(
  orders: WorkOrderListItem[],
  scope: { empresa_id?: string; sucursal_id?: string }
) {
  return orders.filter((order) => {
    if (
      scope.sucursal_id &&
      order.sucursal_id &&
      String(order.sucursal_id) !== String(scope.sucursal_id)
    ) {
      return false
    }

    if (
      scope.empresa_id &&
      order.empresa_id &&
      String(order.empresa_id) !== String(scope.empresa_id)
    ) {
      return false
    }

    return true
  })
}

function ProcessStateStats({
  orders,
  stateName,
  visual,
}: {
  orders: WorkOrderListItem[]
  stateName: string
  visual: ProcessStateVisual
}) {
  const pendingOrders = orders.filter(isActiveProcessStateOrder)
  const todayOrders = pendingOrders.filter((order) =>
    isSameLocalDate(getOrderReferenceDate(order))
  )
  const oldestOrder = [...pendingOrders].sort((left, right) => {
    const leftTime = new Date(getOrderReferenceDate(left) ?? 0).getTime()
    const rightTime = new Date(getOrderReferenceDate(right) ?? 0).getTime()

    return leftTime - rightTime
  })[0]
  const oldestReferenceDate = oldestOrder ? getOrderReferenceDate(oldestOrder) : null
  const oldestDays = getDaysWaiting(oldestReferenceDate)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className={`border-border bg-card transition-colors ${visual.cardAccent}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pendientes
          </CardTitle>
          <span className={`flex size-9 items-center justify-center rounded-lg ${visual.iconBg} ${visual.iconText}`}>
            <ClipboardList className="size-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{pendingOrders.length}</div>
          <p className="text-xs text-muted-foreground">
            Ordenes en {stateName}
          </p>
        </CardContent>
      </Card>

      <Card className={`border-border bg-card transition-colors ${visual.cardAccent}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recibidas hoy
          </CardTitle>
          <span className="flex size-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
            <Calendar className="size-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{todayOrders.length}</div>
          <p className="text-xs text-muted-foreground">
            Movimientos registrados durante el dia
          </p>
        </CardContent>
      </Card>

      <Card className={`border-border bg-card transition-colors ${visual.cardAccent}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Mayor espera
          </CardTitle>
          <span className="flex size-9 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
            <Clock className="size-4" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {oldestOrder ? `${oldestDays} ${oldestDays === 1 ? "dia" : "dias"}` : "0 dias"}
          </div>
          <p className="text-xs text-muted-foreground">
            {oldestOrder ? `Orden ${oldestOrder.codigo || oldestOrder.id}` : "Sin ordenes en espera"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ProcessStateToneBadge({
  children,
  visual,
}: {
  children: React.ReactNode
  visual: ProcessStateVisual
}) {
  return (
    <Badge
      variant="outline"
      className={`border-transparent ${visual.iconBg} ${visual.iconText}`}
    >
      <span className={`size-1.5 rounded-full ${visual.dot}`} />
      {children}
    </Badge>
  )
}

export function WorkOrdersList() {
  const { user, sessionScope, roleStatePermissions } = useAuth()
  const [orders, setOrders] = useState<WorkOrderListItem[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [stateAccessError, setStateAccessError] = useState<string | null>(null)
  const [stateAccess, setStateAccess] = useState<ProcessStateAccess>({
    allowedProcessStateIds: new Set(),
    processStates: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStateAccess, setIsLoadingStateAccess] = useState(true)
  const focusedProcessStates = useMemo(
    () =>
      sortProcessStatesByVisualOrder(
        stateAccess.processStates.filter((state) =>
          stateAccess.allowedProcessStateIds.has(state.id)
        )
      ),
    [stateAccess]
  )
  const focusedStateCodes = useMemo(
    () => focusedProcessStates.map((state) => String(state.codigo).toUpperCase()),
    [focusedProcessStates]
  )
  const focusedStateCode = focusedStateCodes[0] ?? null
  const shouldUseFocusedStateView = Boolean(user)
  const showProcessStateStats =
    shouldUseFocusedStateView && focusedProcessStates.length > 0
  const scopeEmpresaId = sessionScope.empresa_id
  const scopeSucursalId = sessionScope.sucursal_id
  const focusedProcessStateIds = useMemo(
    () => focusedProcessStates.map((state) => state.id),
    [focusedProcessStates]
  )
  const focusedProcessStateName =
    focusedProcessStates.length > 1
      ? focusedProcessStates.map((state) => state.nombre).join(" / ")
      : focusedProcessStates[0]?.nombre ??
        (focusedStateCode
          ? ESTADO_PROCESO_LABELS[focusedStateCode as EstadoProcesoCode] ?? focusedStateCode
          : null)

  const refreshOrders = useCallback(async () => {
    if (shouldUseFocusedStateView && isLoadingStateAccess) {
      return
    }

    setIsLoading(true)
    setError(null)
    setActionError(null)

    try {
      if (shouldUseFocusedStateView && stateAccessError) {
        setOrders([])
        return
      }

      if (shouldUseFocusedStateView && focusedProcessStateIds.length === 0) {
        setOrders([])
        return
      }

      const result = shouldUseFocusedStateView
        ? {
            data: [
              ...new Map(
                (
                  await Promise.all(
                    focusedProcessStateIds.map((stateId) =>
                      workOrdersService.listWorkOrders({ estado_actual_id: stateId })
                    )
                  )
                )
                  .flatMap((stateResult) => stateResult.data)
                  .map((order) => [order.id, order])
              ).values(),
            ],
          }
        : await workOrdersService.listWorkOrders(
            scopeSucursalId
              ? { sucursal_id: scopeSucursalId }
              : scopeEmpresaId
                ? { empresa_id: scopeEmpresaId }
                : undefined
          )
      const scopedOrders = shouldUseFocusedStateView
        ? getScopedOrders(result.data, {
            empresa_id: scopeEmpresaId,
            sucursal_id: scopeSucursalId,
          })
        : result.data

      setOrders(sortWorkOrdersByUpdatedAt(scopedOrders))
    } catch (loadError) {
      setOrders([])
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [
    focusedProcessStateIds,
    isLoadingStateAccess,
    shouldUseFocusedStateView,
    scopeEmpresaId,
    scopeSucursalId,
    stateAccessError,
  ])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshOrders()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [refreshOrders])

  useEffect(() => {
    let isMounted = true

    async function loadAccess() {
      if (!user) {
        setStateAccess({
          allowedProcessStateIds: new Set(),
          processStates: [],
        })
        setStateAccessError(null)
        setIsLoadingStateAccess(false)
        return
      }

      setIsLoadingStateAccess(true)
      setStateAccessError(null)

      try {
        const result = await loadProcessStateAccess(
          user,
          undefined,
          roleStatePermissions.allowedProcessStateIds
        )

        if (isMounted) {
          setStateAccess(result)
        }
      } catch (loadError) {
        if (isMounted) {
          setStateAccess({
            allowedProcessStateIds: new Set(),
            processStates: [],
          })
          setStateAccessError(getErrorMessage(loadError))
        }
      } finally {
        if (isMounted) {
          setIsLoadingStateAccess(false)
        }
      }
    }

    void loadAccess()

    return () => {
      isMounted = false
    }
  }, [roleStatePermissions.allowedProcessStateIds, user])

  const accessibleOrders =
    !isLoadingStateAccess && !stateAccessError
      ? orders.filter((order) =>
          canAccessCurrentProcessState(user, order, stateAccess)
        )
      : []
  const visibleOrders = query.trim()
    ? filterWorkOrders(accessibleOrders, { query: query.trim() })
    : accessibleOrders
  const isPageLoading = isLoading || isLoadingStateAccess
  const canOpenNewOrder = hasAnyRole(user, ["ASESOR", "RECEPCION"])
  const newOrderHref = hasExplicitRole(user, ["ASESOR"])
    ? "/departamentos/asesor/nueva-orden"
    : "/ordenes/nueva"
  const pageTitle =
    focusedStateCode === ESTADO_PROCESO_CODES.ASESOR
      ? "Ordenes de Asesoria"
      : focusedStateCode === ESTADO_PROCESO_CODES.JEFE_TALLER
      ? "Ordenes de Jefe de Taller"
      : focusedStateCode === ESTADO_PROCESO_CODES.REPUESTOS
        ? "Solicitud de Repuestos"
        : focusedStateCode === ESTADO_PROCESO_CODES.PROGRAMAR_CITA
          ? "Programar cita"
        : focusedStateCode === ESTADO_PROCESO_CODES.AUTO_INGRESADO
          ? "Autos ingresados"
        : showProcessStateStats && focusedProcessStateName
          ? `Ordenes en ${focusedProcessStateName}`
          : "Ordenes"
  const pageDescription =
    focusedStateCode === ESTADO_PROCESO_CODES.ASESOR
      ? "Revisa las ordenes de ingreso y envialas a Jefe de Taller."
      : focusedStateCode === ESTADO_PROCESO_CODES.JEFE_TALLER
      ? "Revisa las ordenes pendientes y envialas a programar cita, repuestos o a la bahia correspondiente."
      : focusedStateCode === ESTADO_PROCESO_CODES.REPUESTOS
        ? "Gestiona las ordenes listas para pasar de repuestos a programar cita o a una bahia operativa."
        : focusedStateCode === ESTADO_PROCESO_CODES.PROGRAMAR_CITA
          ? "Gestiona las ordenes pendientes de cita y registra el ingreso del auto."
        : focusedStateCode === ESTADO_PROCESO_CODES.AUTO_INGRESADO
          ? "Asigna cada auto ingresado directamente a una bahia operativa."
        : showProcessStateStats
          ? "Gestiona las ordenes del estado actual y envialas a otra bahia o a finalizado."
          : "Consulta las ordenes existentes ordenadas por actividad reciente."
  const processVisual = getProcessStateVisual(focusedStateCode)
  const HeaderIcon = processVisual.Icon

  return (
    <div className="space-y-5">
      <ModuleHeader
        title={pageTitle}
        description={pageDescription}
        icon={<HeaderIcon className="size-6" />}
        iconClassName={processVisual.moduleIcon}
        actions={
          canOpenNewOrder ? (
            <Link href={newOrderHref} className={buttonVariants()}>
              Nueva orden
            </Link>
          ) : null
        }
      />

      {showProcessStateStats && focusedProcessStateName && (
        <ProcessStateStats
          orders={accessibleOrders}
          stateName={focusedProcessStateName}
          visual={processVisual}
        />
      )}

      <Card className={`border-border bg-card transition-colors ${processVisual.cardAccent}`}>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por codigo, placa, cliente o estado"
                className="border-border bg-input pl-9"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className={`size-2 rounded-full ${processVisual.dot}`} />
              <span>{visibleOrders.length} ordenes visibles</span>
            </div>
          </div>

          {isPageLoading && (
            <div className="flex min-h-[280px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando ordenes...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {error}
            </div>
          )}

          {stateAccessError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {stateAccessError}
            </div>
          )}

          {actionError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4" />
              {actionError}
            </div>
          )}

          {!isPageLoading && !error && !stateAccessError && visibleOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className={`flex size-11 items-center justify-center rounded-lg ${processVisual.iconBg} ${processVisual.iconText}`}>
                <ClipboardList className="size-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Sin ordenes para mostrar</p>
                <p className="text-sm text-muted-foreground">
                  No hay ordenes en los estados habilitados para tu rol.
                </p>
              </div>
            </div>
          )}

          {!isPageLoading && !error && !stateAccessError && visibleOrders.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/50 hover:bg-muted/50">
                  <TableHead>Orden</TableHead>
                  <TableHead>Vehiculo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Reciente</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleOrders.map((order) => {
                  const hasOrderStateAccess = canAccessCurrentProcessState(
                    user,
                    order,
                    stateAccess
                  )
                  const transitionConfig = getWorkOrderProcessTransitionConfig(
                    order,
                    stateAccess.processStates,
                    user
                  )
                  const rowVisual = getProcessStateVisual(
                    transitionConfig.currentState?.codigo ?? focusedStateCode
                  )
                  const isScheduleAppointmentOrder =
                    String(transitionConfig.currentState?.codigo).toUpperCase() ===
                    ESTADO_PROCESO_CODES.PROGRAMAR_CITA

                  return (
                    <TableRow
                      key={order.id}
                      className={`border-border transition-colors ${
                        isScheduleAppointmentOrder
                          ? "bg-red-500/10 hover:bg-red-500/15"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <TableCell className="font-medium text-foreground">
                        {order.codigo || order.id}
                      </TableCell>
                      <TableCell>{getVehicleDisplayName(order)}</TableCell>
                      <TableCell>{getCustomerDisplayName(order)}</TableCell>
                      <TableCell>
                        <ProcessStateToneBadge visual={rowVisual}>
                          {order.etapa_actual}
                        </ProcessStateToneBadge>
                      </TableCell>
                      <TableCell>{formatDate(getWorkOrderUpdatedAt(order))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/ordenes/${order.id}`}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            Ver
                          </Link>
                          <WorkOrderStateTransitionDialog
                            order={order}
                            processStates={stateAccess.processStates}
                            allowedSourceStateCodes={
                              transitionConfig.allowedSourceStateCodes
                            }
                            allowedTargetStateCodes={
                              transitionConfig.allowedTargetStateCodes
                            }
                            disabled={
                              !hasOrderStateAccess || !transitionConfig.canTransition
                            }
                            unavailableMessage={transitionConfig.unavailableMessage}
                            onError={setActionError}
                            onOrderUpdated={() => {
                              void refreshOrders()
                            }}
                            trigger={({ isSubmitting }) => (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                disabled={isSubmitting}
                                aria-label={`Opciones de la orden ${order.codigo || order.id}`}
                              >
                                {isSubmitting ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="size-4" />
                                )}
                              </Button>
                            )}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
