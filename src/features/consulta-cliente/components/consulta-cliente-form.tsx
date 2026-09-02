"use client"

import { useState } from "react"
import { Car, CheckCircle2, ClipboardCheck, Loader2, Search, Wrench } from "lucide-react"
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
import {
  ConsultaClienteApiError,
  fetchSeguimientoPorPlaca,
} from "../services/consulta-cliente-service"
import type { SeguimientoOrden } from "../types"

export function ConsultaClienteForm() {
  const [placa, setPlaca] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultados, setResultados] = useState<SeguimientoOrden[] | null>(null)
  const [isEncuestaOpen, setIsEncuestaOpen] = useState(false)
  const [encuestaCompletada, setEncuestaCompletada] = useState(false)

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
      <div className="rounded-b-[2rem] bg-primary px-6 pt-8 pb-12 text-center text-primary-foreground shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Wrench className="size-5" />
          </div>
          <span className="text-lg font-semibold">
            {registroInfo?.empresa_nombre ?? "SRG Centro de Colisiones"}
          </span>
        </div>
        {registroInfo?.sucursal_nombre ? (
          <p className="mt-1 text-sm text-primary-foreground/80">{registroInfo.sucursal_nombre}</p>
        ) : (
          <p className="mt-1 text-sm text-primary-foreground/80">Seguimiento de tu vehículo</p>
        )}
      </div>

      <div className="-mt-7 space-y-5 px-5">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-2 shadow-md">
          <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
          <input
            id="placa"
            placeholder="Ingresa la placa del vehículo"
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
            className="size-9 shrink-0 rounded-full"
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
            <div className="flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground">
              <Car className="size-4 text-primary" />
              {registroInfo.vehiculo_placa}
            </div>

            <p className="text-center text-xs font-semibold tracking-wide text-primary uppercase">
              Estado del proceso
            </p>

            <div className="space-y-3">
              {resultados.map((registro, index) => {
                const esActual = registro.tipo_registro === "ESTADO_ACTUAL"

                return (
                  <div
                    key={`${registro.orden_id}-${registro.tipo_registro}-${index}`}
                    className={cn(
                      "flex items-start gap-3 rounded-2xl px-4 py-3.5 shadow-sm transition-colors",
                      esActual
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        esActual ? "bg-primary-foreground/15" : "bg-emerald-500/15"
                      )}
                    >
                      {esActual ? (
                        <Wrench className="size-[18px]" />
                      ) : (
                        <CheckCircle2 className="size-[18px] text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{registro.estado_nombre}</p>
                      {registro.mensaje_cliente ? (
                        <p
                          className={cn(
                            "mt-0.5 text-xs",
                            esActual ? "text-primary-foreground/85" : "text-muted-foreground"
                          )}
                        >
                          {registro.mensaje_cliente}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            {mostrarBotonEncuesta ? (
              <Button
                onClick={() => setIsEncuestaOpen(true)}
                variant="outline"
                className="w-full gap-2 rounded-full"
              >
                <ClipboardCheck className="h-4 w-4" />
                Realizar encuesta de satisfacción
              </Button>
            ) : null}

            {encuestaCompletada ? (
              <p className="text-center text-sm text-muted-foreground">
                ¡Gracias por completar la encuesta de satisfacción!
              </p>
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
