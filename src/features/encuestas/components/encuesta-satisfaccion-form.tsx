"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  EncuestaPublicaApiError,
  fetchFormularioPorOrden,
  submitEncuestaRespuesta,
} from "@/features/encuestas/services/encuesta-publica-service"
import type { EncuestaPregunta } from "@/features/encuestas/types"

interface EncuestaSatisfaccionFormProps {
  ordenId: string
  onCompletado?: () => void
}

export function EncuestaSatisfaccionForm({ ordenId, onCompletado }: EncuestaSatisfaccionFormProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [preguntas, setPreguntas] = useState<EncuestaPregunta[]>([])
  const [yaRespondida, setYaRespondida] = useState(false)

  const [calificaciones, setCalificaciones] = useState<Record<string, number>>({})
  const [comentario, setComentario] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enviada, setEnviada] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadFormulario() {
      try {
        const data = await fetchFormularioPorOrden(ordenId)

        if (!isMounted) return

        if (data.ya_respondida) {
          setYaRespondida(true)
        } else {
          setPreguntas(data.plantilla?.preguntas ?? [])
        }
        setLoadError(null)
      } catch (error) {
        if (!isMounted) return
        setLoadError(
          error instanceof EncuestaPublicaApiError
            ? error.message
            : "No fue posible cargar el formulario de encuesta."
        )
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadFormulario()

    return () => {
      isMounted = false
    }
  }, [ordenId])

  const handleSubmit = async () => {
    const items = preguntas.map((pregunta) => ({
      pregunta_id: pregunta.id,
      calificacion: calificaciones[pregunta.id],
    }))

    if (items.some((item) => !item.calificacion)) {
      setSubmitError("Por favor califica todas las preguntas.")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await submitEncuestaRespuesta({
        orden_id: ordenId,
        comentario_general: comentario.trim() || undefined,
        items,
      })
      setEnviada(true)
      onCompletado?.()
    } catch (error) {
      setSubmitError(
        error instanceof EncuestaPublicaApiError
          ? error.message
          : "No fue posible enviar la encuesta."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando encuesta...
      </div>
    )
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError}</p>
  }

  if (yaRespondida || enviada) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="text-sm font-medium text-foreground">¡Gracias por tu respuesta!</p>
        <p className="text-sm text-muted-foreground">
          Ya hemos registrado tu encuesta de satisfacción para esta orden.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {preguntas.map((pregunta) => (
        <div key={pregunta.id} className="space-y-2">
          <p className="text-sm font-medium text-foreground">{pregunta.texto_pregunta}</p>
          {pregunta.descripcion_ayuda && (
            <p className="text-xs text-muted-foreground">{pregunta.descripcion_ayuda}</p>
          )}
          <div className="flex items-center gap-2">
            {Array.from(
              { length: pregunta.escala_max - pregunta.escala_min + 1 },
              (_, index) => pregunta.escala_min + index
            ).map((valor) => {
              const seleccionado = calificaciones[pregunta.id] === valor
              return (
                <button
                  key={valor}
                  type="button"
                  onClick={() =>
                    setCalificaciones((prev) => ({ ...prev, [pregunta.id]: valor }))
                  }
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                    seleccionado
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  {valor}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pregunta.etiqueta_min}</span>
            <span>{pregunta.etiqueta_max}</span>
          </div>
        </div>
      ))}

      <div className="space-y-2">
        <label htmlFor="comentario_general" className="text-sm font-medium text-foreground">
          Comentarios adicionales (opcional)
        </label>
        <textarea
          id="comentario_general"
          rows={3}
          value={comentario}
          onChange={(event) => setComentario(event.target.value)}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button onClick={handleSubmit} disabled={isSubmitting || preguntas.length === 0} className="w-full gap-2">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
        {isSubmitting ? "Enviando..." : "Enviar encuesta"}
      </Button>
    </div>
  )
}
