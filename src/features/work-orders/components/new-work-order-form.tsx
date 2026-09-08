"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CarFront, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { aseguradorasService } from "@/features/aseguradoras/services/aseguradoras-service"
import type { Aseguradora } from "@/features/aseguradoras/types"
import { useAuth } from "@/features/auth/auth-context"
import { brokersService } from "@/features/brokers/services/brokers-service"
import type { Broker } from "@/features/brokers/types"
import { workOrdersService } from "@/features/work-orders/services/work-orders-service"

const emptyVehicleForm = {
  cliente_nombre: "",
  cliente_cedula: "",
  placa: "",
  marca: "",
  modelo: "",
}

const NO_CATALOG_OPTION_VALUE = "Seleccionar"

const emptyOrderForm = {
  broker_id: NO_CATALOG_OPTION_VALUE,
  aseguradora_id: NO_CATALOG_OPTION_VALUE,
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible crear la orden."
}

export function NewWorkOrderForm() {
  const router = useRouter()
  const { sessionScope } = useAuth()
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm)
  const [orderForm, setOrderForm] = useState(emptyOrderForm)
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [aseguradoras, setAseguradoras] = useState<Aseguradora[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFormComplete =
    Object.values(vehicleForm).every((value) => Boolean(value.trim())) &&
    orderForm.aseguradora_id !== NO_CATALOG_OPTION_VALUE

  useEffect(() => {
    let isMounted = true

    async function loadCatalogs() {
      if (!sessionScope.empresa_id || !sessionScope.sucursal_id) {
        setBrokers([])
        setAseguradoras([])
        setCatalogError(null)
        return
      }

      setIsLoadingCatalogs(true)
      setCatalogError(null)

      try {
        const [brokersResult, aseguradorasResult] = await Promise.allSettled([
          brokersService.listBrokersByEmpresa(sessionScope.empresa_id),
          aseguradorasService.listAseguradorasByEmpresa(sessionScope.empresa_id),
        ])

        if (isMounted) {
          setBrokers(
            brokersResult.status === "fulfilled"
              ? brokersResult.value.filter((broker) => broker.activo)
              : []
          )
          setAseguradoras(
            aseguradorasResult.status === "fulfilled"
              ? aseguradorasResult.value.filter((aseguradora) => aseguradora.activo)
              : []
          )
          setCatalogError(
            aseguradorasResult.status === "rejected"
              ? "No fue posible cargar las aseguradoras. Este campo es obligatorio; recarga la pagina para intentarlo nuevamente."
              : brokersResult.status === "rejected"
                ? "No fue posible cargar los brokers. Puedes continuar porque Broker es opcional."
                : null
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingCatalogs(false)
        }
      }
    }

    void loadCatalogs()

    return () => {
      isMounted = false
    }
  }, [sessionScope.empresa_id, sessionScope.sucursal_id])

  function updateVehicleField(field: keyof typeof vehicleForm, value: string) {
    setVehicleForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  function updateOrderField(field: keyof typeof orderForm, value: string) {
    setOrderForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    if (!isFormComplete) {
      setSubmitError(
        "Completa todos los campos obligatorios. Solo Broker es opcional."
      )
      return
    }

    if (!sessionScope.empresa_id || !sessionScope.sucursal_id || !sessionScope.user_id) {
      setSubmitError(
        "No encontramos empresa, sucursal y usuario en tu sesion. Cierra sesion y vuelve a ingresar."
      )
      return
    }

    setIsSubmitting(true)

    try {
      const placa = vehicleForm.placa.trim().toUpperCase()
      const clienteNombre = vehicleForm.cliente_nombre.trim()
      const clienteCedula = vehicleForm.cliente_cedula.trim()
      const marca = vehicleForm.marca.trim()
      const modelo = vehicleForm.modelo.trim()
      const brokerId =
        orderForm.broker_id === NO_CATALOG_OPTION_VALUE ? null : orderForm.broker_id
      const aseguradoraId = orderForm.aseguradora_id
      const existingVehicle = await workOrdersService.findVehicleByPlate(placa)

      const vehicle =
        existingVehicle ??
        await workOrdersService.createVehicle(
          {
            empresa_id: sessionScope.empresa_id,
            sucursal_id: sessionScope.sucursal_id,
            placa,
            cliente_nombre: clienteNombre,
            cliente_cedula: clienteCedula,
            marca,
            modelo,
          }
        )

      const order = await workOrdersService.createWorkOrder({
        empresa_id: sessionScope.empresa_id,
        sucursal_id: sessionScope.sucursal_id,
        vehiculo_id: vehicle.id,
        creado_por_usuario_id: sessionScope.user_id,
        broker_id: brokerId,
        aseguradora_id: aseguradoraId,
      })

      router.push(`/ordenes/${order.id}`)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nueva orden</h1>
        <p className="text-sm text-muted-foreground">
          Registra el vehiculo para abrir la orden de trabajo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CarFront className="size-4" />
            Datos del vehiculo
          </CardTitle>
          <CardDescription>
            Completa todos los datos del cliente y del vehiculo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-2 md:col-span-2 xl:col-span-4">
            <Label htmlFor="placa">Placa</Label>
            <Input
              id="placa"
              value={vehicleForm.placa}
              onChange={(event) => updateVehicleField("placa", event.target.value)}
              placeholder="ABC123"
              className="h-11 text-base font-semibold uppercase"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cliente_nombre">Nombre del cliente</Label>
            <Input
              id="cliente_nombre"
              value={vehicleForm.cliente_nombre}
              onChange={(event) => updateVehicleField("cliente_nombre", event.target.value)}
              placeholder="Cliente Prueba"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cliente_cedula">Cedula del cliente</Label>
            <Input
              id="cliente_cedula"
              value={vehicleForm.cliente_cedula}
              onChange={(event) => updateVehicleField("cliente_cedula", event.target.value)}
              placeholder="9999999999"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              value={vehicleForm.marca}
              onChange={(event) => updateVehicleField("marca", event.target.value)}
              placeholder="Toyota"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="modelo">Modelo</Label>
            <Input
              id="modelo"
              value={vehicleForm.modelo}
              onChange={(event) => updateVehicleField("modelo", event.target.value)}
              placeholder="Corolla"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Datos de la orden
          </CardTitle>
          <CardDescription>
            La aseguradora es obligatoria. Solo Broker es opcional.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="broker">Broker (opcional)</Label>
            <Select
              value={orderForm.broker_id}
              onValueChange={(value) =>
                updateOrderField("broker_id", value ?? NO_CATALOG_OPTION_VALUE)
              }
            >
              <SelectTrigger id="broker" className="w-full bg-input border-border">
                <SelectValue
                  placeholder={isLoadingCatalogs ? "Cargando brokers..." : "Seleccionar"}
                >
                  {(value: string) =>
                    brokers.find((broker) => broker.id === value)?.nombre ?? "Seleccionar"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATALOG_OPTION_VALUE}>Seleccionar</SelectItem>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    {broker.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="aseguradora">Aseguradora</Label>
            <Select
              required
              value={orderForm.aseguradora_id}
              onValueChange={(value) =>
                updateOrderField("aseguradora_id", value ?? NO_CATALOG_OPTION_VALUE)
              }
            >
              <SelectTrigger
                id="aseguradora"
                className="w-full bg-input border-border"
                aria-required="true"
              >
                <SelectValue
                  placeholder={
                    isLoadingCatalogs ? "Cargando aseguradoras..." : "Seleccionar"
                  }
                >
                  {(value: string) =>
                    aseguradoras.find((aseguradora) => aseguradora.id === value)?.nombre ??
                    "Seleccionar"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATALOG_OPTION_VALUE}>Seleccionar</SelectItem>
                {aseguradoras.map((aseguradora) => (
                  <SelectItem key={aseguradora.id} value={aseguradora.id}>
                    {aseguradora.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {catalogError && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <AlertCircle className="size-4" />
          {catalogError}
        </div>
      )}

      {submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {submitError}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || !isFormComplete}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Crear orden
        </Button>
      </div>
    </form>
  )
}
