"use client"

import { AuthProvider } from "@/features/auth/auth-context"
import { AuthGuard } from "@/features/auth/components/auth-guard"
import { Sidebar, Header } from "@/components/layout/sidebar"
import { ThemeProvider } from "@/lib/theme/theme-context"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard>
          <Sidebar />
          <div className="lg:pl-64">
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  )
}
