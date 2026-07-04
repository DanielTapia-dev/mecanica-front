"use client"

import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme/theme-context"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isLight = theme === "light"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
      onClick={toggleTheme}
      className="inline-flex h-8 w-16 items-center rounded-full border border-border bg-muted p-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform",
          isLight ? "translate-x-8" : "translate-x-0"
        )}
      >
        {isLight ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </span>
    </button>
  )
}
