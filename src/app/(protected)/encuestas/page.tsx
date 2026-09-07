"use client"

import { RoleGate } from "@/features/auth/components/role-gate"
import { useAuth } from "@/features/auth/auth-context"
import { hasAnyRole } from "@/features/auth/permissions"
import { EncuestaPlantillasTable } from "@/features/encuestas/components/encuesta-plantillas-table"
import { EncuestaRespuestasTable } from "@/features/encuestas/components/encuesta-respuestas-table"
import { ModuleHeader } from "@/components/layout/module-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardCheck } from "lucide-react"

export default function EncuestasPage() {
  const { user } = useAuth()
  const isAdmin = hasAnyRole(user, ["ADMIN"])

  return (
    <RoleGate allowedRoles={["ADMIN", "ASESOR"]}>
      <div className="space-y-6">
        <ModuleHeader
          title="Encuestas de Satisfacción"
          description={
            isAdmin
              ? "Administra las plantillas, preguntas y respuestas de la encuesta de satisfacción."
              : "Consulta las respuestas de la encuesta de satisfacción de tus ordenes."
          }
          icon={<ClipboardCheck className="size-6" />}
          iconClassName="bg-primary text-primary-foreground"
        />

        {isAdmin ? (
          <Tabs defaultValue="plantillas">
            <TabsList>
              <TabsTrigger value="plantillas">Plantillas y preguntas</TabsTrigger>
              <TabsTrigger value="respuestas">Respuestas</TabsTrigger>
            </TabsList>
            <TabsContent value="plantillas">
              <EncuestaPlantillasTable />
            </TabsContent>
            <TabsContent value="respuestas">
              <EncuestaRespuestasTable />
            </TabsContent>
          </Tabs>
        ) : (
          <EncuestaRespuestasTable soloPropias />
        )}
      </div>
    </RoleGate>
  )
}
