"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const THEME_STORAGE_KEY = "app_theme"
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function readStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark"
  }

  return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement

  root.dataset.theme = theme
  root.style.colorScheme = theme
  root.classList.toggle("light", theme === "light")
  root.classList.toggle("dark", theme === "dark")
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const storedTheme = readStoredTheme()
    setTheme(storedTheme)
    applyTheme(storedTheme)
  }, [])

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      toggleTheme: () => {
        setTheme((currentTheme) => {
          const nextTheme = currentTheme === "dark" ? "light" : "dark"
          localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
          applyTheme(nextTheme)
          return nextTheme
        })
      },
    }),
    [theme]
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
