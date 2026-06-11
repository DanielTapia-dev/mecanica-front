import { UsersTable } from "@/components/users/users-table"

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-muted-foreground">
          Administra los usuarios y técnicos del taller
        </p>
      </div>

      <UsersTable />
    </div>
  )
}
