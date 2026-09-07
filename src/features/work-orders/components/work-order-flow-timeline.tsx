"use client"

import {
  AlertCircle,
  Clock3,
  History,
  Loader2,
  UserRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ESTADO_PROCESO_CODES,
  INITIAL_WORK_ORDER_ESTADO_PROCESO_CODE,
} from "@/features/estados-proceso/constants"
import type { EstadoProceso } from "@/features/estados-proceso/types"
import { getProcessStateVisual } from "@/features/work-orders/process-state-visuals"
import type {
  EntityId,
  WorkOrder,
  WorkOrderStateHistory,
} from "@/features/work-orders/types"

interface WorkOrderFlowTimelineProps {
  order: WorkOrder
  history: WorkOrderStateHistory[]
  processStates: EstadoProceso[]
  currentProcessState?: EstadoProceso | null
  isLoading?: boolean
  error?: string | null
}

interface WorkOrderFlowStep {
  key: string
  stateId: EntityId
  code?: string
  name: string
  subState?: string | null
  occurredAt?: string | null
  actor?: string | null
  isCurrent: boolean
}

function normalizeStateCode(value?: string | null) {
  const normalizedValue = value?.trim().toUpperCase()

  return normalizedValue || undefined
}

function getReadableStateName(code?: string) {
  if (!code) {
    return "Estado de la orden"
  }

  return code
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ")
}

function getHistoryDate(entry: WorkOrderStateHistory) {
  return entry.fecha_registro ?? entry.creado_en ?? entry.actualizado_en ?? null
}

function getTimestamp(value?: string | null) {
  if (!value) {
    return null
  }

  const timestamp = new Date(value).getTime()

  return Number.isNaN(timestamp) ? null : timestamp
}

function formatTimelineDate(value?: string | null) {
  const timestamp = getTimestamp(value)

  if (timestamp === null) {
    return "Fecha no disponible"
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp))
}

function getHistoryActor(entry: WorkOrderStateHistory) {
  const fullName = [
    entry.registrado_por?.nombre,
    entry.registrado_por?.apellido,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  return fullName || entry.registrado_por?.email || null
}

function getOrderModifierActor(order: WorkOrder) {
  const fullName = [order.modificado_por?.nombre, order.modificado_por?.apellido]
    .filter(Boolean)
    .join(" ")
    .trim()

  return fullName || order.modificado_por?.email || null
}

function getCurrentStateId(
  order: WorkOrder,
  currentProcessState?: EstadoProceso | null
) {
  return (
    currentProcessState?.id ??
    order.estado_actual_id ??
    order.estado_id ??
    order.estado_proceso_id ??
    order.estado_actual?.id ??
    order.estado_proceso?.id
  )
}

function getCurrentStateCode(
  order: WorkOrder,
  currentProcessState?: EstadoProceso | null
) {
  return normalizeStateCode(
    currentProcessState?.codigo ??
      order.estado_actual_codigo ??
      order.estado_codigo ??
      order.estado_proceso_codigo ??
      order.estado_actual?.codigo ??
      order.estado_proceso?.codigo
  )
}

function isSameState(
  first: Pick<WorkOrderFlowStep, "stateId" | "code">,
  second: Pick<WorkOrderFlowStep, "stateId" | "code">
) {
  if (first.stateId && second.stateId && first.stateId === second.stateId) {
    return true
  }

  const firstCode = normalizeStateCode(first.code)
  const secondCode = normalizeStateCode(second.code)

  return Boolean(firstCode && secondCode && firstCode === secondCode)
}

function isSameStep(first: WorkOrderFlowStep, second: WorkOrderFlowStep) {
  return (
    isSameState(first, second) &&
    (first.subState?.trim().toLowerCase() ?? "") ===
      (second.subState?.trim().toLowerCase() ?? "")
  )
}

function buildFlowSteps(
  order: WorkOrder,
  history: WorkOrderStateHistory[],
  processStates: EstadoProceso[],
  currentProcessState?: EstadoProceso | null
) {
  const statesById = new Map(processStates.map((state) => [state.id, state]))
  const statesByCode = new Map(
    processStates.map((state) => [normalizeStateCode(state.codigo), state])
  )
  const orderedHistory = history
    .map((entry, index) => ({
      entry,
      index,
      timestamp: getTimestamp(getHistoryDate(entry)),
    }))
    .sort((first, second) => {
      if (first.timestamp === null && second.timestamp === null) {
        return first.index - second.index
      }

      if (first.timestamp === null) {
        return 1
      }

      if (second.timestamp === null) {
        return -1
      }

      return first.timestamp - second.timestamp || first.index - second.index
    })
  const historySteps = orderedHistory.map(({ entry, index }) => {
    const historyCode = normalizeStateCode(entry.estado?.codigo)
    const catalogState =
      statesById.get(entry.estado_id) ??
      (historyCode ? statesByCode.get(historyCode) : undefined)
    const code = normalizeStateCode(catalogState?.codigo ?? historyCode)

    return {
      key: `history-${entry.id}-${index}`,
      stateId: catalogState?.id ?? entry.estado_id,
      code,
      name:
        catalogState?.nombre ??
        entry.estado?.nombre ??
        (code ? getReadableStateName(code) : `Estado ${entry.estado_id}`),
      subState: entry.sub_estado,
      occurredAt: getHistoryDate(entry),
      actor: getHistoryActor(entry),
      isCurrent: false,
    } satisfies WorkOrderFlowStep
  })
  const collapsedSteps = historySteps.reduce<WorkOrderFlowStep[]>(
    (steps, step) => {
      const previousStep = steps.at(-1)

      if (!previousStep || !isSameStep(previousStep, step)) {
        steps.push(step)
        return steps
      }

      previousStep.actor ??= step.actor
      previousStep.occurredAt ??= step.occurredAt

      return steps
    },
    []
  )
  const initialState = statesByCode.get(
    INITIAL_WORK_ORDER_ESTADO_PROCESO_CODE
  )
  const initialStep: WorkOrderFlowStep = {
    key: "initial-state",
    stateId: initialState?.id ?? "initial-asesor",
    code: ESTADO_PROCESO_CODES.ASESOR,
    name: initialState?.nombre ?? "Asesoría / Ingreso",
    subState: null,
    occurredAt: order.fecha_creacion ?? order.creado_en,
    actor: null,
    isCurrent: false,
  }
  const firstStep = collapsedSteps[0]

  if (!firstStep || !isSameState(firstStep, initialStep)) {
    collapsedSteps.unshift(initialStep)
  } else {
    firstStep.occurredAt ??= initialStep.occurredAt
  }

  const currentStateId = getCurrentStateId(order, currentProcessState)
  const currentCode = getCurrentStateCode(order, currentProcessState)
  const currentCatalogState =
    (currentStateId ? statesById.get(currentStateId) : undefined) ??
    (currentCode ? statesByCode.get(currentCode) : undefined)
  const currentStateDate =
    currentCode === ESTADO_PROCESO_CODES.FINALIZADO
      ? order.fecha_finalizacion ?? null
      : null
  const currentStep: WorkOrderFlowStep = {
    key: "current-state",
    stateId:
      currentCatalogState?.id ??
      currentStateId ??
      `current-${currentCode ?? order.etapa_actual}`,
    code: normalizeStateCode(currentCatalogState?.codigo ?? currentCode),
    name:
      currentCatalogState?.nombre ??
      currentProcessState?.nombre ??
      order.estado_actual?.nombre ??
      order.estado_proceso?.nombre ??
      (currentCode ? getReadableStateName(currentCode) : order.etapa_actual),
    subState: order.sub_estado_actual,
    occurredAt: currentStateDate,
    actor: getOrderModifierActor(order),
    isCurrent: true,
  }
  const lastStep = collapsedSteps.at(-1)

  if (lastStep && isSameStep(lastStep, currentStep)) {
    lastStep.isCurrent = true
    lastStep.subState = currentStep.subState ?? lastStep.subState
    lastStep.occurredAt ??= currentStep.occurredAt
    lastStep.actor = currentStep.actor ?? lastStep.actor
  } else {
    collapsedSteps.push(currentStep)
  }

  return collapsedSteps
}

function FlowStepCard({
  step,
  stepNumber,
  isFirst,
}: {
  step: WorkOrderFlowStep
  stepNumber: number
  isFirst: boolean
}) {
  const visual = getProcessStateVisual(step.code)
  const StateIcon = visual.Icon
  const shouldShowSubState =
    Boolean(step.subState) &&
    step.subState?.trim().toLowerCase() !== "pendiente"

  return (
    <div
      className={`relative flex h-full min-h-36 min-w-0 flex-col rounded-xl border p-3 shadow-sm ${
        step.isCurrent
          ? "border-primary bg-primary/5 ring-2 ring-primary/15"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${visual.iconBg} ${visual.iconText}`}
        >
          <StateIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Paso {stepNumber}
          </p>
          <p className="mt-0.5 break-words font-semibold leading-snug text-foreground">
            {step.name}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {isFirst && <Badge variant="outline">Inicio</Badge>}
        {shouldShowSubState && (
          <Badge variant="secondary">{step.subState}</Badge>
        )}
        {step.isCurrent && <Badge>Estado actual</Badge>}
      </div>

      <div className="mt-auto space-y-1.5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-1.5">
          <Clock3 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <time dateTime={step.occurredAt ?? undefined}>
            {formatTimelineDate(step.occurredAt)}
          </time>
        </div>
        {step.actor && (
          <div className="flex items-start gap-1.5">
            <UserRound
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0"
            />
            <span className="min-w-0 break-words">
              Registrado por {step.actor}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function VerticalStepConnector() {
  return (
    <div aria-hidden="true" className="flex h-10 items-center justify-center">
      <div className="flex h-full flex-col items-center">
        <span className="w-1 flex-1 rounded-full bg-primary/60" />
        <span className="size-0 shrink-0 border-x-[7px] border-t-[10px] border-x-transparent border-t-primary" />
      </div>
    </div>
  )
}

function VerticalFlowTimeline({ steps }: { steps: WorkOrderFlowStep[] }) {
  return (
    <ol aria-label="Flujo de estados de la orden" className="md:hidden">
      {steps.map((step, index) => {
        const isLastStep = index === steps.length - 1

        return (
          <li
            key={step.key}
            aria-current={step.isCurrent ? "step" : undefined}
          >
            <FlowStepCard
              step={step}
              stepNumber={index + 1}
              isFirst={index === 0}
            />
            {!isLastStep && <VerticalStepConnector />}
          </li>
        )
      })}
    </ol>
  )
}

function HorizontalStepConnector({
  isReversed,
}: {
  isReversed: boolean
}) {
  return (
    <div aria-hidden="true" className="flex h-full min-h-36 items-center">
      {isReversed ? (
        <>
          <span className="size-0 shrink-0 border-y-[7px] border-r-[10px] border-y-transparent border-r-primary" />
          <span className="h-1 flex-1 rounded-full bg-primary/60" />
        </>
      ) : (
        <>
          <span className="h-1 flex-1 rounded-full bg-primary/60" />
          <span className="size-0 shrink-0 border-y-[7px] border-l-[10px] border-y-transparent border-l-primary" />
        </>
      )}
    </div>
  )
}

function SnakeTurnConnector({
  column,
  gridTemplateColumns,
}: {
  column: number
  gridTemplateColumns: string
}) {
  return (
    <div
      role="presentation"
      className="grid h-12"
      style={{ gridTemplateColumns }}
    >
      <div
        aria-hidden="true"
        className="relative flex h-full justify-center"
        style={{ gridColumn: column * 2 - 1 }}
      >
        <span className="h-full w-1 rounded-full bg-primary/60" />
        <span className="absolute bottom-0 left-1/2 size-0 -translate-x-1/2 border-x-[7px] border-t-[10px] border-x-transparent border-t-primary" />
      </div>
    </div>
  )
}

function SnakeFlowTimeline({
  steps,
  columns,
  className,
}: {
  steps: WorkOrderFlowStep[]
  columns: number
  className: string
}) {
  const effectiveColumns = Math.min(columns, Math.max(steps.length, 1))
  const rowCount = Math.ceil(steps.length / effectiveColumns)
  const gridTemplateColumns = Array.from(
    { length: effectiveColumns * 2 - 1 },
    (_, index) => (index % 2 === 0 ? "minmax(0, 1fr)" : "2.75rem")
  ).join(" ")
  const rows = Array.from({ length: rowCount }, (_, rowIndex) =>
    steps.slice(
      rowIndex * effectiveColumns,
      (rowIndex + 1) * effectiveColumns
    )
  )

  return (
    <div
      role="list"
      aria-label="Flujo de estados de la orden"
      className={className}
    >
      {rows.map((rowSteps, rowIndex) => {
        const isReversed = rowIndex % 2 === 1
        const hasNextRow = rowIndex < rows.length - 1
        const endColumn = isReversed
          ? effectiveColumns - rowSteps.length + 1
          : rowSteps.length

        return (
          <div key={`flow-row-${rowIndex}`} role="presentation">
            <div
              role="presentation"
              className="grid items-stretch"
              style={{ gridTemplateColumns }}
            >
              {Array.from(
                { length: Math.max(rowSteps.length - 1, 0) },
                (_, connectorIndex) => {
                  const fromColumn = isReversed
                    ? effectiveColumns - connectorIndex
                    : connectorIndex + 1
                  const toColumn = isReversed
                    ? effectiveColumns - connectorIndex - 1
                    : connectorIndex + 2
                  const connectorColumn =
                    Math.min(fromColumn, toColumn) * 2

                  return (
                    <div
                      key={`connector-${rowIndex}-${connectorIndex}`}
                      role="presentation"
                      className="h-full"
                      style={{ gridColumn: connectorColumn, gridRow: 1 }}
                    >
                      <HorizontalStepConnector isReversed={isReversed} />
                    </div>
                  )
                }
              )}

              {rowSteps.map((step, itemIndex) => {
                const stepIndex = rowIndex * effectiveColumns + itemIndex
                const column = isReversed
                  ? effectiveColumns - itemIndex
                  : itemIndex + 1

                return (
                  <div
                    key={step.key}
                    role="listitem"
                    aria-current={step.isCurrent ? "step" : undefined}
                    className="min-w-0"
                    style={{ gridColumn: column * 2 - 1, gridRow: 1 }}
                  >
                    <FlowStepCard
                      step={step}
                      stepNumber={stepIndex + 1}
                      isFirst={stepIndex === 0}
                    />
                  </div>
                )
              })}
            </div>

            {hasNextRow && (
              <SnakeTurnConnector
                column={endColumn}
                gridTemplateColumns={gridTemplateColumns}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function WorkOrderFlowTimeline({
  order,
  history,
  processStates,
  currentProcessState,
  isLoading = false,
  error,
}: WorkOrderFlowTimelineProps) {
  const steps = buildFlowSteps(
    order,
    history,
    processStates,
    currentProcessState
  )

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <History className="size-4" />
          Flujo de la orden
        </CardTitle>
        <CardDescription>
          Lee los pasos numerados y sigue las flechas hasta el estado actual.
          El recorrido usa los registros disponibles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 py-2 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" />
            Cargando flujo de la orden...
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <p>
                  {error} Se muestran el ingreso y el estado actual con la
                  información disponible.
                </p>
              </div>
            )}

            {!error && history.length === 0 && steps.length > 1 && (
              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <p>
                  Esta orden no tiene pasos intermedios guardados. Se muestran
                  el ingreso y el estado actual disponibles.
                </p>
              </div>
            )}

            <VerticalFlowTimeline steps={steps} />
            <SnakeFlowTimeline
              steps={steps}
              columns={2}
              className="hidden md:block lg:hidden"
            />
            <SnakeFlowTimeline
              steps={steps}
              columns={3}
              className="hidden lg:block xl:hidden"
            />
            <SnakeFlowTimeline
              steps={steps}
              columns={4}
              className="hidden xl:block"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
