"use client"

import { AuthProvider } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Sidebar, Header } from "@/components/layout/sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <Sidebar />
        <div className="lg:pl-64">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </AuthGuard>
    </AuthProvider>
  )
}
