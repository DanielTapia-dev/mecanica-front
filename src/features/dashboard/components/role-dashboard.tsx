"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight, CarFront, ClipboardList, Headset } from "lucide-react"
import { ModuleHeader } from "@/components/layout/module-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ReceptionActionCardProps {
  badge: string
  description: string
  href: string
  icon: ReactNode
  label: string
  title: string
}

function ReceptionActionCard({
  badge,
  description,
  href,
  icon,
  label,
  title,
}: ReceptionActionCardProps) {
  return (
    <Card className="group border-border bg-card transition-colors hover:border-primary/50">
      <CardContent className="flex min-h-52 flex-col justify-between gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <Badge variant="outline">{badge}</Badge>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <Link
          href={href}
          className={buttonVariants({ className: "w-full justify-between" })}
        >
          {label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardContent>
    </Card>
  )
}

function ReceptionActionsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ReceptionActionCard
        badge="Orden"
        description="Crear orden desde placa, cliente y motivo."
        href="/ordenes/nueva"
        icon={<CarFront className="size-5" />}
        label="Iniciar ingreso"
        title="Ingresar vehiculo"
      />
      <ReceptionActionCard
        badge="Ordenes"
        description="Revisar ordenes existentes por fecha reciente."
        href="/ordenes"
        icon={<ClipboardList className="size-5" />}
        label="Ver lista"
        title="Lista de Ordenes"
      />
    </div>
  )
}

export function ReceptionDashboard() {
  return (
    <section className="space-y-6">
      <ModuleHeader
        title="Recepcion"
        description="Gestiona el ingreso de vehiculos y la consulta de ordenes."
        icon={<Headset className="size-6" />}
        iconClassName="bg-primary text-primary-foreground"
      />
      <ReceptionActionsGrid />
    </section>
  )
}
