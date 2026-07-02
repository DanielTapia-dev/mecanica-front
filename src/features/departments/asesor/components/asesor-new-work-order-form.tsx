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

function optionalText(value: string) {
  const normalizedValue = value.trim()

  return normalizedValue || undefined
}

export function AsesorNewWorkOrderForm() {
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

  const isVehicleComplete = Boolean(vehicleForm.placa.trim())

  useEffect(() => {
    let isMounted = true

    async function loadCatalogs() {
      if (!sessionScope.empresa_id) {
        setBrokers([])
        setAseguradoras([])
        setCatalogError(null)
        return
      }

      setIsLoadingCatalogs(true)
      setCatalogError(null)

      try {
        const [brokersList, aseguradorasList] = await Promise.all([
          brokersService.listBrokersByEmpresa(sessionScope.empresa_id),
          aseguradorasService.listAseguradorasByEmpresa(sessionScope.empresa_id),
        ])

        if (isMounted) {
          setBrokers(brokersList.filter((broker) => broker.activo))
          setAseguradoras(
            aseguradorasList.filter((aseguradora) => aseguradora.activo)
          )
        }
      } catch (error) {
        if (isMounted) {
          setBrokers([])
          setAseguradoras([])
          setCatalogError(getErrorMessage(error))
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
  }, [sessionScope.empresa_id])

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

    if (!isVehicleComplete) {
      setSubmitError("Completa la placa.")
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
      const clienteNombre = optionalText(vehicleForm.cliente_nombre)
      const clienteCedula = optionalText(vehicleForm.cliente_cedula)
      const marca = optionalText(vehicleForm.marca)
      const modelo = optionalText(vehicleForm.modelo)
      const brokerId =
        orderForm.broker_id === NO_CATALOG_OPTION_VALUE ? null : orderForm.broker_id
      const aseguradoraId =
        orderForm.aseguradora_id === NO_CATALOG_OPTION_VALUE
          ? null
          : orderForm.aseguradora_id
      const existingVehicle = await workOrdersService.findVehicleByPlate(placa)

      const vehicle =
        existingVehicle ??
        await workOrdersService.createVehicle(
          {
            empresa_id: sessionScope.empresa_id,
            sucursal_id: sessionScope.sucursal_id,
            placa,
            ...(clienteNombre ? { cliente_nombre: clienteNombre } : {}),
            ...(clienteCedula ? { cliente_cedula: clienteCedula } : {}),
            ...(marca ? { marca } : {}),
            ...(modelo ? { modelo } : {}),
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CarFront className="size-4" />
            Datos del vehiculo
          </CardTitle>
          <CardDescription>
            Ingresa la placa para buscar o crear el vehiculo. Los demas datos son opcionales.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-2 md:col-span-2 xl:col-span-4">
            <Label htmlFor="asesor_placa">Placa</Label>
            <Input
              id="asesor_placa"
              value={vehicleForm.placa}
              onChange={(event) => updateVehicleField("placa", event.target.value)}
              placeholder="ABC123"
              className="h-11 text-base font-semibold uppercase"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="asesor_cliente_nombre">Nombre del cliente (opcional)</Label>
            <Input
              id="asesor_cliente_nombre"
              value={vehicleForm.cliente_nombre}
              onChange={(event) => updateVehicleField("cliente_nombre", event.target.value)}
              placeholder="Cliente Prueba"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="asesor_cliente_cedula">Cedula del cliente (opcional)</Label>
            <Input
              id="asesor_cliente_cedula"
              value={vehicleForm.cliente_cedula}
              onChange={(event) => updateVehicleField("cliente_cedula", event.target.value)}
              placeholder="9999999999"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="asesor_marca">Marca (opcional)</Label>
            <Input
              id="asesor_marca"
              value={vehicleForm.marca}
              onChange={(event) => updateVehicleField("marca", event.target.value)}
              placeholder="Toyota"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="asesor_modelo">Modelo (opcional)</Label>
            <Input
              id="asesor_modelo"
              value={vehicleForm.modelo}
              onChange={(event) => updateVehicleField("modelo", event.target.value)}
              placeholder="Corolla"
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
            Broker y aseguradora son opcionales y se envian como ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="asesor_broker">Broker (opcional)</Label>
            <Select
              value={orderForm.broker_id}
              onValueChange={(value) =>
                updateOrderField("broker_id", value ?? NO_CATALOG_OPTION_VALUE)
              }
            >
              <SelectTrigger
                id="asesor_broker"
                className="w-full bg-input border-border"
              >
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
            <Label htmlFor="asesor_aseguradora">Aseguradora (opcional)</Label>
            <Select
              value={orderForm.aseguradora_id}
              onValueChange={(value) =>
                updateOrderField("aseguradora_id", value ?? NO_CATALOG_OPTION_VALUE)
              }
            >
              <SelectTrigger
                id="asesor_aseguradora"
                className="w-full bg-input border-border"
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
          No fue posible cargar broker o aseguradora. Puedes continuar sin esos datos.
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
          disabled={isSubmitting || !isVehicleComplete}
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Crear orden
        </Button>
      </div>
    </form>
  )
}
