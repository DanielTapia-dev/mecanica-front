"use client"

import { useEffect, useState } from "react"
import {
  Car,
  CheckCircle2,
  ClipboardCheck,
  HeartHandshake,
  Loader2,
  Search,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { EncuestaSatisfaccionForm } from "@/features/encuestas/components/encuesta-satisfaccion-form"
import { getProcessStateVisual } from "@/features/work-orders/process-state-visuals"
import {
  ConsultaClienteApiError,
  fetchLogoPublico,
  fetchSeguimientoPorPlaca,
} from "../services/consulta-cliente-service"
import type { SeguimientoOrden } from "../types"

export function ConsultaClienteForm() {
  const [placa, setPlaca] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultados, setResultados] = useState<SeguimientoOrden[] | null>(null)
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [isEncuestaOpen, setIsEncuestaOpen] = useState(false)
  const [encuestaCompletada, setEncuestaCompletada] = useState(false)

  useEffect(() => {
    fetchLogoPublico().then(setLogoBase64)
  }, [])

  const registroInfo = resultados && resultados.length > 0 ? resultados[0] : null
  const estadoActual =
    resultados?.find((registro) => registro.tipo_registro === "ESTADO_ACTUAL") ?? registroInfo
  const mostrarBotonEncuesta =
    Boolean(estadoActual?.es_final) && !estadoActual?.encuesta_realizada && !encuestaCompletada

  async function handleConsultar() {
    const placaBuscada = placa.trim()

    if (!placaBuscada) {
      setError("Ingresa la placa del vehículo.")
      setResultados(null)
      return
    }

    setLoading(true)
    setError(null)
    setResultados(null)
    setEncuestaCompletada(false)

    try {
      const data = await fetchSeguimientoPorPlaca(placaBuscada)
      setResultados(data.seguimiento ?? [])
    } catch (err) {
      const message =
        err instanceof ConsultaClienteApiError
          ? err.message
          : "No fue posible consultar el estado del vehículo."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col">
      <div className="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-green-700 via-green-800 to-green-950 px-6 pt-8 pb-8 text-center text-white shadow-lg">
        <div
          className="absolute -top-10 -right-10 size-28 rotate-45 bg-red-600/90"
          aria-hidden="true"
        />
        <div className="relative">
          {logoBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoBase64}
              alt={registroInfo?.empresa_nombre ?? "Logo de la empresa"}
              className="mx-auto h-20 w-auto max-w-[70%] rounded-xl bg-white/95 object-contain p-2 shadow-md"
            />
          ) : (
            <div className="flex items-center justify-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                <Wrench className="size-5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight uppercase">
                {registroInfo?.empresa_nombre ?? "Servicio de Reparaciones Generales S.A."}
              </span>
            </div>
          )}
          {logoBase64 ? (
            <p className="mt-2 text-lg font-extrabold tracking-tight uppercase">
              {registroInfo?.empresa_nombre ?? "Servicio de Reparaciones Generales S.A."}
            </p>
          ) : null}
          {registroInfo?.sucursal_nombre ? (
            <p className="mt-1 text-sm font-medium text-green-100">{registroInfo.sucursal_nombre}</p>
          ) : (
            <p className="mt-1 text-sm font-medium text-green-100">Seguimiento de tu vehículo</p>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-5 px-5">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-2 shadow-md">
          <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
          <input
            id="placa"
            placeholder="Ingresa la placa del vehículo"
            autoComplete="off"
            value={placa}
            onChange={(event) => setPlaca(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleConsultar()
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleConsultar}
            disabled={loading}
            size="icon"
            className="size-9 shrink-0 rounded-full bg-green-700 hover:bg-green-800"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </Button>
        </div>
        {error ? <p className="px-2 text-center text-sm text-destructive">{error}</p> : null}

        {resultados && resultados.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No se encontraron resultados para la placa ingresada.
          </p>
        ) : null}

        {resultados && resultados.length > 0 && registroInfo ? (
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-900 dark:bg-green-950/40 dark:text-green-100">
              <Car className="size-4 text-green-700 dark:text-green-400" />
              {registroInfo.vehiculo_placa}
            </div>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-green-600" />
              <span className="text-xs font-semibold tracking-wide text-green-800 uppercase dark:text-green-300">
                Estado del proceso
              </span>
              <span className="h-px flex-1 bg-red-600" />
            </div>

            <div className="space-y-3">
              {resultados.map((registro, index) => {
                const esActual = registro.tipo_registro === "ESTADO_ACTUAL"
                const visual = getProcessStateVisual(registro.estado_codigo)
                const StateIcon = visual.Icon

                return (
                  <div
                    key={`${registro.orden_id}-${registro.tipo_registro}-${index}`}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-sm transition-colors",
                      esActual
                        ? "bg-gradient-to-r from-green-700 to-green-600 text-white"
                        : "border border-border bg-card text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        esActual ? "bg-white/15" : visual.iconBg
                      )}
                    >
                      <StateIcon
                        className={cn("size-[18px]", esActual ? "text-white" : visual.iconText)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{registro.estado_nombre}</p>
                      {registro.mensaje_cliente ? (
                        <p
                          className={cn(
                            "mt-0.5 text-xs",
                            esActual ? "text-green-50/90" : "text-muted-foreground"
                          )}
                        >
                          {registro.mensaje_cliente}
                        </p>
                      ) : null}
                    </div>
                    {!esActual ? (
                      <CheckCircle2 className="size-[18px] shrink-0 text-red-600" />
                    ) : null}
                  </div>
                )
              })}
            </div>

            {mostrarBotonEncuesta ? (
              <Button
                onClick={() => setIsEncuestaOpen(true)}
                variant="outline"
                className="w-full gap-2 rounded-full border-green-600 text-green-800 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-950/40"
              >
                <ClipboardCheck className="h-4 w-4" />
                Realizar encuesta de satisfacción
              </Button>
            ) : null}

            {encuestaCompletada ? (
              <div className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-green-700 to-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm">
                <HeartHandshake className="size-4" />
                ¡Gracias por completar la encuesta de satisfacción!
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <Dialog open={isEncuestaOpen} onOpenChange={setIsEncuestaOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Encuesta de satisfacción</DialogTitle>
            <DialogDescription>
              Tu opinión nos ayuda a mejorar el servicio del taller.
            </DialogDescription>
          </DialogHeader>
          {estadoActual ? (
            <EncuestaSatisfaccionForm
              ordenId={estadoActual.orden_id}
              onCompletado={() => {
                setEncuestaCompletada(true)
                setIsEncuestaOpen(false)
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
