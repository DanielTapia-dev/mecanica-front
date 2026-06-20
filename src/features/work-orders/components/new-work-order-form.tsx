"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CarFront,
  Loader2,
  Plus,
  UserCheck,
  Search,
  UserRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/auth-context"
import type { AuthUser } from "@/features/auth/types"
import type { CustomerSummary } from "@/features/work-orders/types"
import { workOrdersService } from "@/features/work-orders/services/work-orders-service"
import { cn } from "@/lib/utils"

const textareaClassName =
  "min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"

const emptyVehicleForm = {
  placa: "",
  vin: "",
  marca: "",
  modelo: "",
  anio: "",
  color: "",
  kilometraje: "",
}

const emptyCustomerForm = {
  nombre: "",
  apellido: "",
  documento: "",
  telefono: "",
  email: "",
  direccion: "",
}

type JsonRecord = Record<string, unknown>

function getAuthToken() {
  return localStorage.getItem("auth_token") ?? undefined
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No fue posible completar la accion."
}

function getCustomerName(customer: CustomerSummary) {
  return [customer.nombre, customer.apellido].filter(Boolean).join(" ")
}

function trimOptional(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue || undefined
}

function parseRequiredNumber(value: string) {
  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return undefined
}

function readNestedId(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]

    if (isRecord(value)) {
      const id = readString(value, ["id", "uuid", "codigo"])

      if (id) {
        return id
      }
    }
  }

  return undefined
}

function readTokenPayload(token?: string) {
  if (!token) {
    return undefined
  }

  const [, payload] = token.split(".")

  if (!payload) {
    return undefined
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "="
    )
    const decodedPayload = atob(paddedPayload)
    const parsedPayload = JSON.parse(decodedPayload) as unknown

    return isRecord(parsedPayload) ? parsedPayload : undefined
  } catch {
    return undefined
  }
}

function getSessionScope(user: AuthUser | null, token?: string) {
  const userRecord: JsonRecord = isRecord(user) ? user : {}
  const tokenPayload: JsonRecord = readTokenPayload(token) ?? {}

  const empresaId =
    readString(userRecord, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readString(tokenPayload, ["empresa_id", "empresaId", "id_empresa", "empresa"]) ??
    readNestedId(userRecord, ["empresa"]) ??
    readNestedId(tokenPayload, ["empresa"])
  const sucursalId =
    readString(userRecord, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readString(tokenPayload, ["sucursal_id", "sucursalId", "id_sucursal", "sucursal"]) ??
    readNestedId(userRecord, ["sucursal"]) ??
    readNestedId(tokenPayload, ["sucursal"])

  return {
    empresa_id: empresaId,
    sucursal_id: sucursalId,
  }
}

interface SelectableButtonProps {
  selected: boolean
  children: React.ReactNode
  onClick: () => void
}

function SelectableButton({ selected, children, onClick }: SelectableButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border px-3 py-2 text-left transition-colors",
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background hover:bg-muted"
      )}
    >
      {children}
    </button>
  )
}

export function NewWorkOrderForm() {
  const router = useRouter()
  const { user } = useAuth()
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm)
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm)
  const [customerQuery, setCustomerQuery] = useState("")
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null)
  const [motivoIngreso, setMotivoIngreso] = useState("")
  const [observacionInterna, setObservacionInterna] = useState("")
  const [observacionCliente, setObservacionCliente] = useState("")
  const [requiereRepuestos, setRequiereRepuestos] = useState(false)
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingCustomer, setIsChangingCustomer] = useState(false)
  const [customerError, setCustomerError] = useState<string | null>(null)
  const [customerModalError, setCustomerModalError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [hasSearchedCustomers, setHasSearchedCustomers] = useState(false)

  const vehicleYear = parseRequiredNumber(vehicleForm.anio)
  const vehicleMileage = parseRequiredNumber(vehicleForm.kilometraje)
  const isVehicleComplete =
    Boolean(vehicleForm.placa.trim()) &&
    Boolean(vehicleForm.marca.trim()) &&
    Boolean(vehicleForm.modelo.trim()) &&
    vehicleYear !== undefined &&
    vehicleMileage !== undefined
  const shouldShowCustomerPicker = !selectedCustomer || isChangingCustomer
  const selectableCustomers = selectedCustomer
    ? customers.filter((customer) => customer.id !== selectedCustomer.id)
    : customers

  function updateVehicleField(field: keyof typeof vehicleForm, value: string) {
    setVehicleForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  function updateCustomerField(field: keyof typeof customerForm, value: string) {
    setCustomerForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
  }

  function handleStartCustomerChange() {
    setSelectedCustomer(null)
    setIsChangingCustomer(true)
    setCustomerQuery("")
    setCustomers([])
    setCustomerError(null)
    setHasSearchedCustomers(false)
  }

  function handleSelectCustomer(customer: CustomerSummary) {
    setSelectedCustomer(customer)
    setIsChangingCustomer(false)
  }

  async function loadCustomers(query = customerQuery) {
    setIsLoadingCustomers(true)
    setCustomerError(null)
    setHasSearchedCustomers(true)

    try {
      const result = await workOrdersService.listCustomers(
        { query: query.trim() || undefined },
        { token: getAuthToken() }
      )
      setCustomers(result.data)
    } catch (error) {
      setCustomers([])
      setCustomerError(getErrorMessage(error))
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCustomerModalError(null)
    const token = getAuthToken()
    const scope = getSessionScope(user, token)
    const nombre = customerForm.nombre.trim()
    const apellido = customerForm.apellido.trim()
    const documento = customerForm.documento.trim()

    if (!scope.empresa_id || !scope.sucursal_id) {
      setCustomerModalError(
        "No encontramos empresa y sucursal en tu sesion. Cierra sesion y vuelve a ingresar."
      )
      return
    }

    if (!nombre || !apellido || !documento) {
      setCustomerModalError("Ingresa nombre, apellido y documento del cliente.")
      return
    }

    setIsCreatingCustomer(true)

    try {
      const customer = await workOrdersService.createCustomer(
        {
          empresa_id: scope.empresa_id,
          sucursal_id: scope.sucursal_id,
          nombre,
          apellido,
          cedula: documento,
          documento,
          telefono: trimOptional(customerForm.telefono),
          email: trimOptional(customerForm.email),
          direccion: trimOptional(customerForm.direccion),
        },
        { token }
      )

      setSelectedCustomer(customer)
      setCustomers((currentCustomers) => {
        if (currentCustomers.some((item) => item.id === customer.id)) {
          return currentCustomers
        }

        return [customer, ...currentCustomers]
      })
      setCustomerForm(emptyCustomerForm)
      setIsCustomerDialogOpen(false)
      setIsChangingCustomer(false)
    } catch (error) {
      setCustomerModalError(getErrorMessage(error))
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    if (!isVehicleComplete || vehicleYear === undefined || vehicleMileage === undefined) {
      setSubmitError("Completa placa, marca, modelo, anio y kilometraje del vehiculo.")
      return
    }

    if (!selectedCustomer) {
      setSubmitError("Asigna el cliente del vehiculo.")
      return
    }

    if (!motivoIngreso.trim()) {
      setSubmitError("Ingresa el motivo de ingreso.")
      return
    }

    const token = getAuthToken()
    const scope = getSessionScope(user, token)

    if (!scope.empresa_id || !scope.sucursal_id) {
      setSubmitError(
        "No encontramos empresa y sucursal en tu sesion. Cierra sesion y vuelve a ingresar."
      )
      return
    }

    setIsSubmitting(true)

    try {
      const nextStage = requiereRepuestos
        ? "Repuestos"
        : "Seleccion de departamento"
      const vehicle = await workOrdersService.createVehicle(
        {
          empresa_id: scope.empresa_id,
          sucursal_id: scope.sucursal_id,
          cliente_id: selectedCustomer.id,
          placa: vehicleForm.placa.trim().toUpperCase(),
          vin: trimOptional(vehicleForm.vin)?.toUpperCase(),
          marca: vehicleForm.marca.trim(),
          modelo: vehicleForm.modelo.trim(),
          anio: vehicleYear,
          color: trimOptional(vehicleForm.color),
          kilometraje: vehicleMileage,
        },
        { token }
      )

      const order = await workOrdersService.createWorkOrder(
        {
          empresa_id: scope.empresa_id,
          sucursal_id: scope.sucursal_id,
          cliente_id: selectedCustomer.id,
          vehiculo_id: vehicle.id,
          estado_general: "Pendiente",
          etapa_actual: nextStage,
          repuestos_completos: false,
          departamento_actual_id: null,
          actividad_actual: requiereRepuestos
            ? "Ingreso registrado, pendiente de repuestos"
            : "Ingreso registrado, pendiente de departamento",
          motivo_ingreso: motivoIngreso.trim(),
          observacion_interna: trimOptional(observacionInterna),
          observacion_cliente: trimOptional(observacionCliente),
          requiere_repuestos: requiereRepuestos,
          creado_por_usuario_id: user?.id,
        },
        { token }
      )

      router.push(`/ordenes/${order.id}`)
    } catch (error) {
      setSubmitError(getErrorMessage(error))
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ingreso de vehiculo</h1>
          <p className="text-sm text-muted-foreground">
            Registra el vehiculo, asigna su cliente y crea la orden de trabajo.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CarFront className="size-4" />
              Datos del vehiculo
            </CardTitle>
            <CardDescription>
              Captura primero la informacion completa del vehiculo que llega al taller.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="placa">Placa</Label>
              <Input
                id="placa"
                value={vehicleForm.placa}
                onChange={(event) => updateVehicleField("placa", event.target.value)}
                placeholder="ABC123"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vin">Numero de chasis (opcional)</Label>
              <Input
                id="vin"
                value={vehicleForm.vin}
                onChange={(event) => updateVehicleField("vin", event.target.value)}
                placeholder="Numero de chasis"
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

            <div className="grid gap-2">
              <Label htmlFor="anio">Anio</Label>
              <Input
                id="anio"
                type="number"
                min="1900"
                max="2100"
                value={vehicleForm.anio}
                onChange={(event) => updateVehicleField("anio", event.target.value)}
                placeholder="2022"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={vehicleForm.color}
                onChange={(event) => updateVehicleField("color", event.target.value)}
                placeholder="Blanco opcional"
              />
            </div>

            <div className="grid gap-2 md:col-span-2 xl:col-span-1">
              <Label htmlFor="kilometraje">Kilometraje</Label>
              <Input
                id="kilometraje"
                type="number"
                min="0"
                value={vehicleForm.kilometraje}
                onChange={(event) => updateVehicleField("kilometraje", event.target.value)}
                placeholder="45000"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4" />
              Cliente del vehiculo
            </CardTitle>
            <CardDescription>
              Al final del ingreso, asigna el cliente propietario o responsable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedCustomer && (
              <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <UserCheck className="size-4" />
                  </div>
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium uppercase text-primary">
                        Cliente asignado
                      </p>
                      <Badge>Asignado</Badge>
                    </div>
                    <p className="font-medium text-foreground">
                      {getCustomerName(selectedCustomer)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[
                        selectedCustomer.documento,
                        selectedCustomer.telefono,
                        selectedCustomer.email,
                      ]
                        .filter(Boolean)
                        .join(" | ") || "Cliente seleccionado"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStartCustomerChange}
                  disabled={isChangingCustomer}
                >
                  Cambiar cliente
                </Button>
              </div>
            )}

            {shouldShowCustomerPicker && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-3">
                {selectedCustomer && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Busca otro cliente o crea uno nuevo para reemplazar el asignado.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsChangingCustomer(false)}
                    >
                      Mantener cliente
                    </Button>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={customerQuery}
                    onChange={(event) => setCustomerQuery(event.target.value)}
                    placeholder="Buscar por nombre, documento, telefono o email"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void loadCustomers()}
                    disabled={isLoadingCustomers}
                  >
                    {isLoadingCustomers ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                    Buscar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setCustomerModalError(null)
                      setIsCustomerDialogOpen(true)
                    }}
                  >
                    <Plus className="size-4" />
                    Nuevo cliente
                  </Button>
                </div>

                {customerError && (
                  <p className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="size-4" />
                    {customerError}
                  </p>
                )}

                <div className="grid max-h-72 gap-2 overflow-auto pr-1 md:grid-cols-2">
                  {selectableCustomers.map((customer) => (
                    <SelectableButton
                      key={customer.id}
                      selected={false}
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{getCustomerName(customer)}</p>
                          <p className="text-xs text-muted-foreground">
                            {[customer.documento, customer.telefono, customer.email]
                              .filter(Boolean)
                              .join(" | ")}
                          </p>
                        </div>
                        <Badge variant="outline">Seleccionar</Badge>
                      </div>
                    </SelectableButton>
                  ))}
                </div>

                {!hasSearchedCustomers && !selectedCustomer && !customerError && (
                  <p className="text-sm text-muted-foreground">
                    Busca un cliente existente o crea uno nuevo.
                  </p>
                )}

                {hasSearchedCustomers &&
                  !isLoadingCustomers &&
                  selectableCustomers.length === 0 &&
                  !customerError && (
                    <p className="text-sm text-muted-foreground">
                      No encontramos otro cliente con esa busqueda. Puedes crear uno nuevo.
                    </p>
                  )}
              </div>
            )}

            {selectedCustomer && !isChangingCustomer && (
              <p className="text-sm text-muted-foreground">
                La orden se creara para el cliente asignado. Usa Cambiar cliente si no es el correcto.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos de ingreso</CardTitle>
            <CardDescription>Motivo, observaciones iniciales y repuestos.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="motivo_ingreso">Motivo de ingreso</Label>
              <textarea
                id="motivo_ingreso"
                value={motivoIngreso}
                onChange={(event) => setMotivoIngreso(event.target.value)}
                className={textareaClassName}
                placeholder="Describe el motivo del ingreso"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="observacion_interna">Observacion interna</Label>
              <textarea
                id="observacion_interna"
                value={observacionInterna}
                onChange={(event) => setObservacionInterna(event.target.value)}
                className={textareaClassName}
                placeholder="Notas internas del taller"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="observacion_cliente">Observacion visible para cliente</Label>
              <textarea
                id="observacion_cliente"
                value={observacionCliente}
                onChange={(event) => setObservacionCliente(event.target.value)}
                className={textareaClassName}
                placeholder="Mensaje publico inicial"
              />
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 lg:col-span-2">
              <input
                type="checkbox"
                checked={requiereRepuestos}
                onChange={(event) => setRequiereRepuestos(event.target.checked)}
                className="size-4 accent-primary"
              />
              <span className="text-sm font-medium text-foreground">Requiere repuestos</span>
            </label>
          </CardContent>
        </Card>

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
            disabled={
              isSubmitting ||
              !isVehicleComplete ||
              !selectedCustomer ||
              !motivoIngreso.trim()
            }
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Crear orden
          </Button>
        </div>
      </form>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleCreateCustomer}>
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
              <DialogDescription>
                Crea el cliente y quedara asignado al vehiculo del ingreso.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cliente_nombre">Nombre</Label>
                <Input
                  id="cliente_nombre"
                  value={customerForm.nombre}
                  onChange={(event) => updateCustomerField("nombre", event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cliente_apellido">Apellido</Label>
                <Input
                  id="cliente_apellido"
                  value={customerForm.apellido}
                  onChange={(event) => updateCustomerField("apellido", event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cliente_documento">Documento</Label>
                <Input
                  id="cliente_documento"
                  value={customerForm.documento}
                  onChange={(event) => updateCustomerField("documento", event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cliente_telefono">Telefono</Label>
                <Input
                  id="cliente_telefono"
                  value={customerForm.telefono}
                  onChange={(event) => updateCustomerField("telefono", event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cliente_email">Email</Label>
                <Input
                  id="cliente_email"
                  type="email"
                  value={customerForm.email}
                  onChange={(event) => updateCustomerField("email", event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cliente_direccion">Direccion</Label>
                <Input
                  id="cliente_direccion"
                  value={customerForm.direccion}
                  onChange={(event) => updateCustomerField("direccion", event.target.value)}
                />
              </div>
            </div>

            {customerModalError && (
              <p className="mb-4 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="size-4" />
                {customerModalError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomerDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingCustomer}>
                {isCreatingCustomer && <Loader2 className="size-4 animate-spin" />}
                Crear y asignar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
