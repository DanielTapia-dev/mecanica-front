"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ClipboardList,
  Loader2,
  MoreHorizontal,
  Search,
} from "lucide-react"
import { ModuleHeader } from "@/components/layout/module-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { ESTADO_PROCESO_CODES } from "@/features/estados-proceso/constants"
import { WorkOrderStateTransitionDialog } from "@/features/work-orders/components/work-order-state-transition-dialog"
import { workOrdersService } from "@/features/work-orders/services/work-orders-service"
import {
  hasAnyRole,
  hasExplicitRole,
} from "@/features/auth/permissions"
import {
  canAccessCurrentProcessState,
  loadProcessStateAccess,
  type ProcessStateAccess,
} from "@/features/work-orders/state-access"
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

export function WorkOrdersList() {
  const { user, sessionScope } = useAuth()
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

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      setIsLoading(true)
      setError(null)
      setActionError(null)

      try {
        const result = await workOrdersService.listWorkOrders(
          sessionScope.sucursal_id
            ? { sucursal_id: sessionScope.sucursal_id }
            : sessionScope.empresa_id
              ? { empresa_id: sessionScope.empresa_id }
              : undefined
        )

        if (isMounted) {
          setOrders(sortWorkOrdersByUpdatedAt(result.data))
        }
      } catch (loadError) {
        if (isMounted) {
          setOrders([])
          setError(getErrorMessage(loadError))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadOrders()

    return () => {
      isMounted = false
    }
  }, [sessionScope.empresa_id, sessionScope.sucursal_id])

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
        const result = await loadProcessStateAccess(user)

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
  }, [user])

  const filteredOrders = query.trim()
    ? filterWorkOrders(orders, { query: query.trim() })
    : orders
  const visibleOrders =
    !isLoadingStateAccess && !stateAccessError
      ? filteredOrders.filter((order) =>
          canAccessCurrentProcessState(user, order, stateAccess)
        )
      : []
  const isPageLoading = isLoading || isLoadingStateAccess
  const canOpenNewOrder = hasAnyRole(user, ["ASESOR", "RECEPCION"])
  const newOrderHref = hasExplicitRole(user, ["ASESOR"])
    ? "/departamentos/asesor/nueva-orden"
    : "/ordenes/nueva"

  return (
    <div className="space-y-5">
      <ModuleHeader
        title="Ordenes"
        description="Consulta las ordenes existentes ordenadas por actividad reciente."
        icon={<ClipboardList className="size-6" />}
        iconClassName="bg-primary text-primary-foreground"
        actions={
          canOpenNewOrder ? (
            <Link href={newOrderHref} className={buttonVariants()}>
              Nueva orden
            </Link>
          ) : null
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por codigo, placa, cliente o estado"
              className="pl-9"
            />
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
              <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Vehiculo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Estado</TableHead>
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

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-foreground">
                        {order.codigo || order.id}
                      </TableCell>
                      <TableCell>{getVehicleDisplayName(order)}</TableCell>
                      <TableCell>{getCustomerDisplayName(order)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.etapa_actual}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>{order.estado_general}</Badge>
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
                            allowedSourceStateCodes={[ESTADO_PROCESO_CODES.ASESOR]}
                            allowedTargetStateCodes={[ESTADO_PROCESO_CODES.JEFE_TALLER]}
                            disabled={!hasOrderStateAccess}
                            unavailableMessage="Esta orden solo se puede enviar desde Asesoria / Ingreso hacia Jefe de Taller."
                            onError={setActionError}
                            onOrderUpdated={(updatedOrder) => {
                              setOrders((currentOrders) =>
                                sortWorkOrdersByUpdatedAt(
                                  currentOrders.map((currentOrder) =>
                                    currentOrder.id === order.id
                                      ? updatedOrder
                                      : currentOrder
                                  )
                                )
                              )
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
