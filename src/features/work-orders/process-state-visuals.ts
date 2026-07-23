import {
  CheckCircle2,
  CalendarClock,
  CarFront,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  Hammer,
  KeyRound,
  PackageCheck,
  Paintbrush,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { EstadoProcesoCode } from "@/features/estados-proceso/constants"

export interface ProcessStateVisual {
  Icon: LucideIcon
  cardAccent: string
  dot: string
  iconBg: string
  iconText: string
  moduleIcon: string
}

const processStateVisuals: Partial<Record<EstadoProcesoCode, ProcessStateVisual>> = {
  ASESOR: {
    Icon: ClipboardList,
    cardAccent: "hover:border-primary/50",
    dot: "bg-primary",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    moduleIcon: "bg-primary text-primary-foreground",
  },
  JEFE_TALLER: {
    Icon: ClipboardCheck,
    cardAccent: "hover:border-sky-500/50",
    dot: "bg-sky-500",
    iconBg: "bg-sky-500/15",
    iconText: "text-sky-400",
    moduleIcon: "bg-sky-500 text-white",
  },
  REPUESTOS: {
    Icon: PackageCheck,
    cardAccent: "hover:border-rose-500/50",
    dot: "bg-rose-500",
    iconBg: "bg-rose-500/15",
    iconText: "text-rose-400",
    moduleIcon: "bg-rose-500 text-white",
  },
  PROGRAMAR_CITA: {
    Icon: CalendarClock,
    cardAccent: "hover:border-red-500/50",
    dot: "bg-red-500",
    iconBg: "bg-red-500/15",
    iconText: "text-red-400",
    moduleIcon: "bg-red-500 text-white",
  },
  ENDEREZADA: {
    Icon: Hammer,
    cardAccent: "hover:border-amber-500/50",
    dot: "bg-amber-500",
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-400",
    moduleIcon: "bg-amber-500 text-white",
  },
  PINTURA: {
    Icon: Paintbrush,
    cardAccent: "hover:border-fuchsia-500/50",
    dot: "bg-fuchsia-500",
    iconBg: "bg-fuchsia-500/15",
    iconText: "text-fuchsia-400",
    moduleIcon: "bg-fuchsia-500 text-white",
  },
  ENSAMBLAJE: {
    Icon: ClipboardCheck,
    cardAccent: "hover:border-cyan-500/50",
    dot: "bg-cyan-500",
    iconBg: "bg-cyan-500/15",
    iconText: "text-cyan-400",
    moduleIcon: "bg-cyan-500 text-white",
  },
  MECANICA: {
    Icon: Wrench,
    cardAccent: "hover:border-blue-500/50",
    dot: "bg-blue-500",
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-400",
    moduleIcon: "bg-blue-500 text-white",
  },
  LAVADO: {
    Icon: Droplets,
    cardAccent: "hover:border-emerald-500/50",
    dot: "bg-emerald-500",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-400",
    moduleIcon: "bg-emerald-500 text-white",
  },
  FINALIZADO: {
    Icon: CheckCircle2,
    cardAccent: "hover:border-emerald-500/50",
    dot: "bg-emerald-500",
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-400",
    moduleIcon: "bg-emerald-500 text-white",
  },
  CONTROL_CALIDAD: {
    Icon: ShieldCheck,
    cardAccent: "hover:border-teal-500/50",
    dot: "bg-teal-500",
    iconBg: "bg-teal-500/15",
    iconText: "text-teal-400",
    moduleIcon: "bg-teal-500 text-white",
  },
  AUTO_INGRESADO: {
    Icon: CarFront,
    cardAccent: "hover:border-blue-500/50",
    dot: "bg-blue-500",
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-400",
    moduleIcon: "bg-blue-500 text-white",
  },
  ENTREGAR_AUTO: {
    Icon: KeyRound,
    cardAccent: "hover:border-lime-500/50",
    dot: "bg-lime-500",
    iconBg: "bg-lime-500/15",
    iconText: "text-lime-400",
    moduleIcon: "bg-lime-500 text-white",
  },
}

const defaultProcessStateVisual = processStateVisuals.ASESOR as ProcessStateVisual

export function getProcessStateVisual(stateCode?: string | null) {
  return stateCode
    ? processStateVisuals[stateCode as EstadoProcesoCode] ?? defaultProcessStateVisual
    : defaultProcessStateVisual
}
