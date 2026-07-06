import { RoleGate } from "@/features/auth/components/role-gate"
import { EncuestaPlantillasTable } from "@/features/encuestas/components/encuesta-plantillas-table"
import { EncuestaRespuestasTable } from "@/features/encuestas/components/encuesta-respuestas-table"
import { ModuleHeader } from "@/components/layout/module-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardCheck } from "lucide-react"

export default function EncuestasPage() {
  return (
    <RoleGate allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <ModuleHeader
          title="Encuestas de Satisfacción"
          description="Administra las plantillas, preguntas y respuestas de la encuesta de satisfacción."
          icon={<ClipboardCheck className="size-6" />}
          iconClassName="bg-primary text-primary-foreground"
        />

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
      </div>
    </RoleGate>
  )
}
