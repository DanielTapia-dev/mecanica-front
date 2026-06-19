import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ModuleHeaderProps {
  actions?: ReactNode
  description: string
  icon: ReactNode
  iconClassName?: string
  title: string
}

export function ModuleHeader({
  actions,
  description,
  icon,
  iconClassName,
  title,
}: ModuleHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-xl bg-primary text-2xl text-primary-foreground",
            iconClassName
          )}
        >
          {icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>

      {actions ? <div className="sm:self-center">{actions}</div> : null}
    </div>
  )
}
