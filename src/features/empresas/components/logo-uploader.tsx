"use client"

import { useCallback, useId, useRef, useState } from "react"
import { ImageIcon, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// La columna mecanica.empresas.logobase64 es VARCHAR(500000); se guarda como
// data URL completa (incluye el prefijo "data:<mime>;base64,") para poder
// renderizarla directamente sin necesidad de una columna aparte de mime-type.
const MAX_LOGO_BASE64_LENGTH = 500000
const MAX_LOGO_FILE_BYTES = Math.floor((MAX_LOGO_BASE64_LENGTH * 3) / 4)
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]

interface LogoUploaderProps {
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
}

export function LogoUploader({ value, onChange, disabled }: LogoUploaderProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(
    (file: File | undefined) => {
      setError(null)
      if (!file) return

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Formato no soportado. Use PNG, JPG, WEBP, GIF o SVG.")
        return
      }

      if (file.size > MAX_LOGO_FILE_BYTES) {
        setError(
          `El archivo supera el tamaño máximo permitido (${Math.floor(MAX_LOGO_FILE_BYTES / 1024)} KB).`
        )
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === "string") {
          if (result.length > MAX_LOGO_BASE64_LENGTH) {
            setError("El archivo es demasiado grande una vez codificado.")
            return
          }
          onChange(result)
        }
      }
      reader.onerror = () => setError("No fue posible leer el archivo seleccionado.")
      reader.readAsDataURL(file)
    },
    [onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      if (disabled) return
      processFile(e.dataTransfer.files?.[0])
    },
    [disabled, processFile]
  )

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setError(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="grid gap-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-input/50 px-4 py-6 text-center transition-colors",
          !disabled && "cursor-pointer hover:bg-input",
          isDragging && "border-primary bg-primary/5",
          disabled && "opacity-60"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Logo de la empresa"
            className="h-20 w-20 rounded-md border border-border object-contain bg-background"
          />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        )}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Upload className="h-3.5 w-3.5" />
          Arrastre una imagen aquí o haga clic para seleccionarla
        </div>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WEBP, GIF o SVG — máx. {Math.floor(MAX_LOGO_FILE_BYTES / 1024)} KB
        </p>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        disabled={disabled}
        onChange={(e) => processFile(e.target.files?.[0])}
      />
      {value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit gap-1"
          disabled={disabled}
          onClick={handleRemove}
        >
          <X className="h-3.5 w-3.5" />
          Quitar logo
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
