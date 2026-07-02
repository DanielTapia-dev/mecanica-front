"use client"

import { useMemo, useState, type ReactElement } from "react"
import { ArrowRight, ClipboardList, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ESTADO_PROCESO_CODES } from "@/features/estados-proceso/constants"
import type { EstadoProceso } from "@/features/estados-proceso/types"
import { workOrdersService } from "@/features/work-orders/services/work-orders-service"
import {
  findCurrentProcessState,
  getWorkOrderTransitionTargets,
} from "@/features/work-orders/state-access"
import type { WorkOrder, WorkOrderListItem } from "@/features/work-orders/types"
import {
  getCustomerDisplayName,
  getVehicleDisplayName,
} from "@/features/work-orders/utils"

export interface WorkOrderStateTransitionTriggerState {
  canSubmit: boolean
  isSubmitting: boolean
  targetCount: number
  isOpen: boolean
}

export type WorkOrderStateTransitionOrder = WorkOrder | WorkOrderListItem

export interface WorkOrderStateTransitionDialogProps {
  order: WorkOrderStateTransitionOrder
  processStates: EstadoProceso[]
  allowedTargetStateCodes: string[]
  allowedSourceStateCodes?: string[]
  disabled?: boolean
  unavailableMessage?: string
  orderLabel?: string
  currentStateName?: string | null
  vehicleName?: string | null
  customerName?: string | null
  trigger:
    | ReactElement
    | ((state: WorkOrderStateTransitionTriggerState) => ReactElement)
  onOrderUpdated?: (order: WorkOrder) => void
  onError?: (message: string | null) => void
}

function getErrorMessage(
  error: unknown,
  fallback = "No fue posible enviar la orden al estado permitido."
) {
  return error instanceof Error ? error.message : fallback
}

function getTargetHint(targetState: EstadoProceso) {
  const code = String(targetState.codigo).toUpperCase()

  if (code === ESTADO_PROCESO_CODES.JEFE_TALLER) {
    return "Revision tecnica inicial"
  }

  if (code === ESTADO_PROCESO_CODES.REPUESTOS) {
    return "Gestion de repuestos"
  }

  return "Nuevo estado de la orden"
}

function getTargetLabel(targetState: EstadoProceso) {
  const code = String(targetState.codigo).toUpperCase()

  if (code === ESTADO_PROCESO_CODES.REPUESTOS) {
    return "Solicitud de Repuestos"
  }

  return targetState.nombre
}

export function WorkOrderStateTransitionDialog({
  order,
  processStates,
  allowedTargetStateCodes,
  allowedSourceStateCodes,
  disabled = false,
  unavailableMessage = "Esta orden no tiene destinos disponibles en este momento.",
  orderLabel,
  currentStateName,
  vehicleName,
  customerName,
  trigger,
  onOrderUpdated,
  onError,
}: WorkOrderStateTransitionDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const currentProcessState = useMemo(
    () => findCurrentProcessState(order, processStates),
    [order, processStates]
  )
  const transitionTargets = useMemo(
    () =>
      getWorkOrderTransitionTargets(order, processStates, {
        allowedSourceStateCodes,
        allowedTargetStateCodes,
      }),
    [allowedSourceStateCodes, allowedTargetStateCodes, order, processStates]
  )
  const canSubmit = !disabled && transitionTargets.length > 0
  const triggerState: WorkOrderStateTransitionTriggerState = {
    canSubmit,
    isSubmitting,
    targetCount: transitionTargets.length,
    isOpen,
  }
  const triggerElement =
    typeof trigger === "function" ? trigger(triggerState) : trigger
  const displayOrderLabel = orderLabel ?? order.codigo ?? order.id
  const displayCurrentStateName =
    currentStateName ?? currentProcessState?.nombre ?? order.etapa_actual
  const displayVehicleName = vehicleName ?? getVehicleDisplayName(order)
  const displayCustomerName = customerName ?? getCustomerDisplayName(order)

  async function handleSelectTarget(targetState: EstadoProceso) {
    if (!canSubmit || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setLocalError(null)
    onError?.(null)

    try {
      const updatedOrder = await workOrdersService.moveWorkOrderToProcessState({
        orden_id: order.id,
        estado_actual_id: targetState.id,
        sub_estado_actual: targetState.es_bahia ? "Pendiente" : null,
      })

      onOrderUpdated?.(updatedOrder)
      setIsOpen(false)
    } catch (error) {
      const message = getErrorMessage(error)

      setLocalError(message)
      onError?.(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isSubmitting) {
          setIsOpen(open)
          setLocalError(null)
        }
      }}
    >
      <DialogTrigger asChild>{triggerElement}</DialogTrigger>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-foreground">Enviar la orden</DialogTitle>
          <DialogDescription>
            Orden {displayOrderLabel}
            {displayVehicleName ? ` - ${displayVehicleName}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Estado actual</span>
            <Badge variant="outline">{displayCurrentStateName ?? "Sin estado"}</Badge>
          </div>
          {displayCustomerName && (
            <p className="mt-2 text-sm text-muted-foreground">{displayCustomerName}</p>
          )}
        </div>

        {localError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {localError}
          </div>
        )}

        {transitionTargets.length > 0 ? (
          <div className="grid gap-2">
            {transitionTargets.map((targetState) => (
              <Button
                key={targetState.id}
                type="button"
                variant="outline"
                className="h-auto w-full justify-start gap-3 whitespace-normal p-3 text-left"
                disabled={!canSubmit || isSubmitting}
                onClick={() => void handleSelectTarget(targetState)}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                </span>
                <span className="grid gap-1">
                  <span className="font-medium text-foreground">
                    {getTargetLabel(targetState)}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {getTargetHint(targetState)}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            {unavailableMessage}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
