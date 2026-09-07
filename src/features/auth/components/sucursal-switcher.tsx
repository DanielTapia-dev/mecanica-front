"use client"

import { useEffect, useState } from "react"
import { Building2, Check, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/features/auth/auth-context"
import { fetchSucursales, SucursalesApiError } from "@/features/sucursales/services/sucursales-service"
import type { Sucursal } from "@/features/sucursales/types"

export function SucursalSwitcher() {
  const { user, sessionScope, canSwitchSucursal, switchSucursal } = useAuth()

  const [isOpen, setIsOpen] = useState(false)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    let isMounted = true

    async function loadSucursales() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetchSucursales()

        if (isMounted) {
          setSucursales(
            response.sucursales.filter(
              (sucursal) =>
                !user?.empresaId ||
                sucursal.empresa_id === user.empresaId
            )
          )
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof SucursalesApiError
              ? err.message
              : "No fue posible cargar las sucursales."
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSucursales()

    return () => {
      isMounted = false
    }
  }, [isOpen, user?.empresaId])

  if (!canSwitchSucursal) {
    return null
  }

  const handleSelect = (sucursal: Sucursal) => {
    switchSucursal(sucursal.id, sucursal.nombre)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 w-full justify-start gap-2 text-xs"
        >
          <MapPin className="h-3.5 w-3.5" />
          Cambiar sucursal
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Cambiar sucursal</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selecciona la sucursal cuya informacion deseas visualizar. Este cambio
            afecta los listados de todos los modulos.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando sucursales...
          </div>
        ) : error ? (
          <p className="py-4 text-sm text-destructive">{error}</p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto py-2">
            {sucursales.map((sucursal) => {
              const isActive = sucursal.id === sessionScope.sucursal_id

              return (
                <button
                  key={sucursal.id}
                  type="button"
                  onClick={() => handleSelect(sucursal)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted/50"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-foreground">
                    {sucursal.nombre}
                  </span>
                  {isActive && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              )
            })}
            {sucursales.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No hay sucursales disponibles.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
