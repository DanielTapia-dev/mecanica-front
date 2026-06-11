"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getJobsByDepartment,
  getUsersByDepartment,
  getUserById,
  departmentConfig,
  statusConfig,
  priorityConfig,
  mockVehicles,
  type Department,
  type Job,
  type JobStatus,
} from "@/lib/mock-data"
import {
  MoreHorizontal,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Filter,
} from "lucide-react"

interface DepartmentViewProps {
  department: Department
}

export function DepartmentView({ department }: DepartmentViewProps) {
  const config = departmentConfig[department]
  const initialJobs = getJobsByDepartment(department)
  const users = getUsersByDepartment(department)

  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
      job.vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
      job.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: jobs.length,
    pendiente: jobs.filter((j) => j.status === "pendiente").length,
    enProgreso: jobs.filter((j) => j.status === "en_progreso").length,
    completado: jobs.filter((j) => j.status === "completado").length,
    pausado: jobs.filter((j) => j.status === "pausado").length,
  }

  const updateJobStatus = (jobId: string, status: JobStatus) => {
    setJobs(
      jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status,
              progress:
                status === "completado"
                  ? 100
                  : status === "en_progreso"
                  ? Math.max(j.progress, 10)
                  : j.progress,
              updatedAt: new Date().toISOString(),
            }
          : j
      )
    )
  }

  const updateJobProgress = (jobId: string, progress: number) => {
    setJobs(
      jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              progress,
              status: progress === 100 ? "completado" : progress > 0 ? "en_progreso" : j.status,
              updatedAt: new Date().toISOString(),
            }
          : j
      )
    )
  }

  const handleAddJob = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const vehicleId = formData.get("vehicle") as string
    const vehicle = mockVehicles.find((v) => v.id === vehicleId)!
    
    const newJob: Job = {
      id: `j${Date.now()}`,
      vehicleId,
      vehicle,
      department,
      status: "pendiente",
      assignedTo: formData.get("assignedTo") as string,
      description: formData.get("description") as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedCompletion: formData.get("estimatedCompletion") as string,
      priority: formData.get("priority") as Job["priority"],
      notes: [],
      progress: 0,
    }
    setJobs([...jobs, newJob])
    setIsAddOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl ${config.color} flex items-center justify-center text-2xl`}>
          {config.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{config.label}</h1>
          <p className="text-muted-foreground">
            Gestiona los trabajos del departamento de {config.label.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className={`h-10 w-10 rounded-lg ${config.color}/20 flex items-center justify-center`}>
                <span className="text-lg">{config.icon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendiente}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold text-foreground">{stats.enProgreso}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold text-foreground">{stats.completado}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="lista" className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-muted">
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar trabajos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 bg-input border-border"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (value) {
                  setStatusFilter(value)
                }
              }}
            >
              <SelectTrigger className="w-40 bg-input border-border">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Trabajo
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <form onSubmit={handleAddJob}>
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Nuevo Trabajo</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                      Registre un nuevo trabajo para el departamento de {config.label.toLowerCase()}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Vehículo</Label>
                      <Select name="vehicle" required>
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Seleccionar vehículo" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockVehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.plate} - {v.brand} {v.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Descripción</Label>
                      <Input
                        name="description"
                        placeholder="Descripción del trabajo"
                        required
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Asignar a</Label>
                        <Select name="assignedTo" required>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="Técnico" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Prioridad</Label>
                        <Select name="priority" required>
                          <SelectTrigger className="bg-input border-border">
                            <SelectValue placeholder="Prioridad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baja">Baja</SelectItem>
                            <SelectItem value="media">Media</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Fecha estimada de entrega</Label>
                      <Input
                        name="estimatedCompletion"
                        type="datetime-local"
                        required
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Trabajo</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* List View */}
        <TabsContent value="lista" className="space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <div className="rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-muted/50">
                      <TableHead className="text-muted-foreground">Vehículo</TableHead>
                      <TableHead className="text-muted-foreground">Descripción</TableHead>
                      <TableHead className="text-muted-foreground">Asignado</TableHead>
                      <TableHead className="text-muted-foreground">Prioridad</TableHead>
                      <TableHead className="text-muted-foreground">Estado</TableHead>
                      <TableHead className="text-muted-foreground">Progreso</TableHead>
                      <TableHead className="text-muted-foreground w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => {
                      const assignedUser = getUserById(job.assignedTo)
                      return (
                        <TableRow
                          key={job.id}
                          className="border-border hover:bg-muted/50 cursor-pointer"
                          onClick={() => setSelectedJob(job)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {job.vehicle.brand} {job.vehicle.model}
                              </p>
                              <p className="text-sm text-muted-foreground">{job.vehicle.plate}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground max-w-[200px] truncate">
                            {job.description}
                          </TableCell>
                          <TableCell className="text-foreground">
                            {assignedUser?.name || "Sin asignar"}
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityConfig[job.priority].color}>
                              {priorityConfig[job.priority].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig[job.status].color}>
                              {statusConfig[job.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={job.progress} className="h-2 w-16" />
                              <span className="text-sm text-muted-foreground">{job.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover border-border">
                                {job.status !== "en_progreso" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateJobStatus(job.id, "en_progreso")
                                    }}
                                  >
                                    <Play className="mr-2 h-4 w-4" />
                                    Iniciar
                                  </DropdownMenuItem>
                                )}
                                {job.status === "en_progreso" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateJobStatus(job.id, "pausado")
                                    }}
                                  >
                                    <Pause className="mr-2 h-4 w-4" />
                                    Pausar
                                  </DropdownMenuItem>
                                )}
                                {job.status !== "completado" && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateJobStatus(job.id, "completado")
                                    }}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Completar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kanban View */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {(["pendiente", "en_progreso", "pausado", "completado"] as JobStatus[]).map((status) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${statusConfig[status].color.split(" ")[0]}`} />
                    {statusConfig[status].label}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {filteredJobs.filter((j) => j.status === status).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {filteredJobs
                    .filter((job) => job.status === status)
                    .map((job) => (
                      <Card
                        key={job.id}
                        className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedJob(job)}
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {job.vehicle.brand} {job.vehicle.model}
                              </p>
                              <p className="text-xs text-muted-foreground">{job.vehicle.plate}</p>
                            </div>
                            <Badge className={`${priorityConfig[job.priority].color} text-xs`}>
                              {priorityConfig[job.priority].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Progreso</span>
                              <span className="text-foreground">{job.progress}%</span>
                            </div>
                            <Progress value={job.progress} className="h-1" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="bg-card border-border max-w-2xl">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center gap-2">
                  {selectedJob.vehicle.brand} {selectedJob.vehicle.model}
                  <Badge className={statusConfig[selectedJob.status].color}>
                    {statusConfig[selectedJob.status].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Placa: {selectedJob.vehicle.plate} | Propietario: {selectedJob.vehicle.owner}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Descripción</Label>
                    <p className="text-foreground mt-1">{selectedJob.description}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Prioridad</Label>
                    <div className="mt-1">
                      <Badge className={priorityConfig[selectedJob.priority].color}>
                        {priorityConfig[selectedJob.priority].label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Asignado a</Label>
                    <p className="text-foreground mt-1">
                      {getUserById(selectedJob.assignedTo)?.name || "Sin asignar"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Teléfono del cliente</Label>
                    <p className="text-foreground mt-1">{selectedJob.vehicle.ownerPhone}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Progreso del trabajo</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Progress value={selectedJob.progress} className="flex-1 h-2" />
                    <span className="text-foreground font-medium">{selectedJob.progress}%</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {[0, 25, 50, 75, 100].map((p) => (
                      <Button
                        key={p}
                        variant={selectedJob.progress === p ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateJobProgress(selectedJob.id, p)}
                      >
                        {p}%
                      </Button>
                    ))}
                  </div>
                </div>
                {selectedJob.notes.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Notas</Label>
                    <ul className="mt-2 space-y-1">
                      {selectedJob.notes.map((note, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedJob(null)}>
                  Cerrar
                </Button>
                {selectedJob.status !== "completado" && (
                  <Button
                    onClick={() => {
                      updateJobStatus(selectedJob.id, "completado")
                      setSelectedJob(null)
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Marcar como completado
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
