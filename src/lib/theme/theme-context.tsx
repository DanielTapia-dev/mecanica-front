"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const DEFAULT_THEME_STORAGE_KEY = "app_theme"
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function readStoredTheme(storageKey: string, defaultTheme: Theme): Theme {
  if (typeof window === "undefined") {
    return defaultTheme
  }

  const storedValue = localStorage.getItem(storageKey)

  if (storedValue === "light" || storedValue === "dark") {
    return storedValue
  }

  return defaultTheme
}

function applyTheme(theme: Theme) {
  const root = document.documentElement

  root.dataset.theme = theme
  root.style.colorScheme = theme
  root.classList.toggle("light", theme === "light")
  root.classList.toggle("dark", theme === "dark")
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = DEFAULT_THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    let isMounted = true

    queueMicrotask(() => {
      if (!isMounted) {
        return
      }

      const storedTheme = readStoredTheme(storageKey, defaultTheme)
      setTheme(storedTheme)
      applyTheme(storedTheme)
    })

    return () => {
      isMounted = false
    }
  }, [defaultTheme, storageKey])

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      toggleTheme: () => {
        setTheme((currentTheme) => {
          const nextTheme = currentTheme === "dark" ? "light" : "dark"
          localStorage.setItem(storageKey, nextTheme)
          applyTheme(nextTheme)
          return nextTheme
        })
      },
    }),
    [theme, storageKey]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
