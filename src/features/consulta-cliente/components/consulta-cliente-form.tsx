"use client"

import { useState } from "react"
import { Loader2, Search, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ConsultaClienteApiError,
  fetchSeguimientoPorPlaca,
} from "../services/consulta-cliente-service"
import type { SeguimientoOrden } from "../types"

const tipoRegistroLabels: Record<string, string> = {
  ESTADO_ACTUAL: "Estado actual",
  HISTORIAL: "Historial",
}

export function ConsultaClienteForm() {
  const [placa, setPlaca] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultados, setResultados] = useState<SeguimientoOrden[] | null>(null)

  const registroInfo = resultados && resultados.length > 0 ? resultados[0] : null

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
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
            <Wrench className="size-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">
            {registroInfo?.empresa_nombre ?? "AutoTaller Pro"}
          </span>
        </div>
        {registroInfo?.sucursal_nombre ? (
          <span className="text-sm text-muted-foreground">
            {registroInfo.sucursal_nombre}
          </span>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consulta de estado del vehículo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="placa">Placa del vehículo</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="placa"
                placeholder="Ej. ABC-1234"
                value={placa}
                onChange={(event) => setPlaca(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleConsultar()
                  }
                }}
              />
              <Button onClick={handleConsultar} disabled={loading} className="sm:w-auto">
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Search />
                )}
                Consultar Estado
              </Button>
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {resultados && resultados.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No se encontraron resultados para la placa ingresada.
        </p>
      ) : null}

      {resultados && resultados.length > 0 && registroInfo ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Orden</p>
                <p className="text-base font-semibold text-foreground">
                  {registroInfo.orden_codigo}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Placa</p>
                <p className="text-base font-semibold text-foreground">
                  {registroInfo.vehiculo_placa}
                </p>
              </div>
            </CardContent>
          </Card>

          {resultados.map((registro, index) => (
            <Card key={`${registro.orden_id}-${registro.tipo_registro}-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">{registro.estado_nombre}</CardTitle>
                <Badge
                  variant={
                    registro.tipo_registro === "ESTADO_ACTUAL" ? "default" : "outline"
                  }
                >
                  {tipoRegistroLabels[registro.tipo_registro] ?? registro.tipo_registro}
                </Badge>
              </CardHeader>
              {registro.mensaje_cliente ? (
                <CardContent>
                  <p className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                    {registro.mensaje_cliente}
                  </p>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}
