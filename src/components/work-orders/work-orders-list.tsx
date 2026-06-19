"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, ClipboardList, Loader2, Search } from "lucide-react"
import { ModuleHeader } from "@/components/layout/module-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
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
import { workOrdersService } from "@/features/work-orders/services/work-orders-service"
import type { WorkOrderListItem } from "@/features/work-orders/types"
import {
  filterWorkOrders,
  getCustomerDisplayName,
  getVehicleDisplayName,
  getWorkOrderUpdatedAt,
  sortWorkOrdersByUpdatedAt,
} from "@/features/work-orders/utils"

function getAuthToken() {
  return localStorage.getItem("auth_token") ?? undefined
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible cargar las ordenes."
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
  const [orders, setOrders] = useState<WorkOrderListItem[]>([])
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadOrders() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await workOrdersService.listWorkOrders(undefined, {
          token: getAuthToken(),
        })

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
  }, [])

  const visibleOrders = query.trim()
    ? filterWorkOrders(orders, { query: query.trim() })
    : orders

  return (
    <div className="space-y-5">
      <ModuleHeader
        title="Ordenes"
        description="Consulta las ordenes existentes ordenadas por actividad reciente."
        icon={<ClipboardList className="size-6" />}
        iconClassName="bg-primary text-primary-foreground"
        actions={
          <Link href="/ordenes/nueva" className={buttonVariants()}>
            Nueva orden
          </Link>
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

          {isLoading && (
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

          {!isLoading && !error && visibleOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <ClipboardList className="size-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Sin ordenes para mostrar</p>
                <p className="text-sm text-muted-foreground">
                  Crea una nueva orden o cambia el criterio de busqueda.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && visibleOrders.length > 0 && (
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
                {visibleOrders.map((order) => (
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
                      <Link
                        href={`/ordenes/${order.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Ver
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
