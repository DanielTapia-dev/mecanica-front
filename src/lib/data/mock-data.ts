export type Department = "enderezado" | "pintura" | "mecanica" | "lavado"

export type UserRole = "admin" | "supervisor" | "tecnico"

export type JobStatus = "pendiente" | "en_progreso" | "completado" | "pausado"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: Department
  avatar?: string
  phone: string
  status: "activo" | "inactivo"
}

export interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
  owner: string
  ownerPhone: string
}

export interface Job {
  id: string
  vehicleId: string
  vehicle: Vehicle
  department: Department
  status: JobStatus
  assignedTo: string
  description: string
  createdAt: string
  updatedAt: string
  estimatedCompletion: string
  priority: "baja" | "media" | "alta" | "urgente"
  notes: string[]
  progress: number
}

export const departmentConfig: Record<Department, { label: string; color: string; icon: string }> = {
  enderezado: { label: "Enderezado", color: "bg-amber-500", icon: "🔨" },
  pintura: { label: "Pintura", color: "bg-purple-500", icon: "🎨" },
  mecanica: { label: "Mecánica", color: "bg-blue-500", icon: "⚙️" },
  lavado: { label: "Lavado", color: "bg-emerald-500", icon: "💧" },
}

export const statusConfig: Record<JobStatus, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-muted text-muted-foreground" },
  en_progreso: { label: "En Progreso", color: "bg-blue-500/20 text-blue-400" },
  completado: { label: "Completado", color: "bg-emerald-500/20 text-emerald-400" },
  pausado: { label: "Pausado", color: "bg-amber-500/20 text-amber-400" },
}

export const priorityConfig: Record<string, { label: string; color: string }> = {
  baja: { label: "Baja", color: "bg-muted text-muted-foreground" },
  media: { label: "Media", color: "bg-blue-500/20 text-blue-400" },
  alta: { label: "Alta", color: "bg-amber-500/20 text-amber-400" },
  urgente: { label: "Urgente", color: "bg-red-500/20 text-red-400" },
}

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Carlos Rodríguez",
    email: "carlos@mecanica.com",
    role: "admin",
    department: "mecanica",
    phone: "+52 555 123 4567",
    status: "activo",
  },
  {
    id: "2",
    name: "María González",
    email: "maria@mecanica.com",
    role: "supervisor",
    department: "pintura",
    phone: "+52 555 234 5678",
    status: "activo",
  },
  {
    id: "3",
    name: "Juan Pérez",
    email: "juan@mecanica.com",
    role: "tecnico",
    department: "enderezado",
    phone: "+52 555 345 6789",
    status: "activo",
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana@mecanica.com",
    role: "tecnico",
    department: "lavado",
    phone: "+52 555 456 7890",
    status: "activo",
  },
  {
    id: "5",
    name: "Roberto Sánchez",
    email: "roberto@mecanica.com",
    role: "tecnico",
    department: "mecanica",
    phone: "+52 555 567 8901",
    status: "inactivo",
  },
  {
    id: "6",
    name: "Laura Hernández",
    email: "laura@mecanica.com",
    role: "supervisor",
    department: "enderezado",
    phone: "+52 555 678 9012",
    status: "activo",
  },
]

export const mockVehicles: Vehicle[] = [
  {
    id: "v1",
    plate: "ABC-123",
    brand: "Toyota",
    model: "Corolla",
    year: 2020,
    color: "Blanco",
    owner: "Pedro López",
    ownerPhone: "+52 555 111 2222",
  },
  {
    id: "v2",
    plate: "XYZ-789",
    brand: "Honda",
    model: "Civic",
    year: 2019,
    color: "Negro",
    owner: "Sandra Ruiz",
    ownerPhone: "+52 555 333 4444",
  },
  {
    id: "v3",
    plate: "DEF-456",
    brand: "Nissan",
    model: "Sentra",
    year: 2021,
    color: "Gris",
    owner: "Miguel Ángel Torres",
    ownerPhone: "+52 555 555 6666",
  },
  {
    id: "v4",
    plate: "GHI-321",
    brand: "Volkswagen",
    model: "Jetta",
    year: 2018,
    color: "Rojo",
    owner: "Carmen Vega",
    ownerPhone: "+52 555 777 8888",
  },
  {
    id: "v5",
    plate: "JKL-654",
    brand: "Ford",
    model: "Focus",
    year: 2022,
    color: "Azul",
    owner: "Francisco Díaz",
    ownerPhone: "+52 555 999 0000",
  },
]

export const mockJobs: Job[] = [
  {
    id: "j1",
    vehicleId: "v1",
    vehicle: mockVehicles[0],
    department: "enderezado",
    status: "en_progreso",
    assignedTo: "3",
    description: "Reparación de golpe lateral derecho",
    createdAt: "2024-01-15T10:00:00",
    updatedAt: "2024-01-16T14:30:00",
    estimatedCompletion: "2024-01-18T18:00:00",
    priority: "alta",
    notes: ["Golpe severo en puerta", "Requiere cambio de panel"],
    progress: 45,
  },
  {
    id: "j2",
    vehicleId: "v2",
    vehicle: mockVehicles[1],
    department: "pintura",
    status: "pendiente",
    assignedTo: "2",
    description: "Pintura completa - cambio de color",
    createdAt: "2024-01-14T09:00:00",
    updatedAt: "2024-01-14T09:00:00",
    estimatedCompletion: "2024-01-20T18:00:00",
    priority: "media",
    notes: ["Cliente solicita color azul metálico"],
    progress: 0,
  },
  {
    id: "j3",
    vehicleId: "v3",
    vehicle: mockVehicles[2],
    department: "mecanica",
    status: "en_progreso",
    assignedTo: "1",
    description: "Cambio de transmisión",
    createdAt: "2024-01-12T08:00:00",
    updatedAt: "2024-01-15T16:00:00",
    estimatedCompletion: "2024-01-17T18:00:00",
    priority: "urgente",
    notes: ["Transmisión dañada", "Repuesto en camino"],
    progress: 70,
  },
  {
    id: "j4",
    vehicleId: "v4",
    vehicle: mockVehicles[3],
    department: "lavado",
    status: "completado",
    assignedTo: "4",
    description: "Lavado completo y detailing",
    createdAt: "2024-01-16T11:00:00",
    updatedAt: "2024-01-16T15:00:00",
    estimatedCompletion: "2024-01-16T15:00:00",
    priority: "baja",
    notes: ["Incluye pulido de faros"],
    progress: 100,
  },
  {
    id: "j5",
    vehicleId: "v5",
    vehicle: mockVehicles[4],
    department: "enderezado",
    status: "pausado",
    assignedTo: "6",
    description: "Reparación de chasis frontal",
    createdAt: "2024-01-10T07:00:00",
    updatedAt: "2024-01-13T12:00:00",
    estimatedCompletion: "2024-01-22T18:00:00",
    priority: "alta",
    notes: ["Esperando autorización de seguro", "Daño estructural detectado"],
    progress: 25,
  },
  {
    id: "j6",
    vehicleId: "v1",
    vehicle: mockVehicles[0],
    department: "pintura",
    status: "pendiente",
    assignedTo: "2",
    description: "Pintura de puerta reparada",
    createdAt: "2024-01-16T08:00:00",
    updatedAt: "2024-01-16T08:00:00",
    estimatedCompletion: "2024-01-19T18:00:00",
    priority: "media",
    notes: ["Seguimiento de trabajo j1"],
    progress: 0,
  },
  {
    id: "j7",
    vehicleId: "v2",
    vehicle: mockVehicles[1],
    department: "mecanica",
    status: "en_progreso",
    assignedTo: "5",
    description: "Revisión de frenos",
    createdAt: "2024-01-15T14:00:00",
    updatedAt: "2024-01-16T10:00:00",
    estimatedCompletion: "2024-01-16T18:00:00",
    priority: "alta",
    notes: ["Balatas delanteras desgastadas"],
    progress: 80,
  },
  {
    id: "j8",
    vehicleId: "v3",
    vehicle: mockVehicles[2],
    department: "lavado",
    status: "pendiente",
    assignedTo: "4",
    description: "Lavado de motor",
    createdAt: "2024-01-16T16:00:00",
    updatedAt: "2024-01-16T16:00:00",
    estimatedCompletion: "2024-01-17T12:00:00",
    priority: "baja",
    notes: ["Después de reparación mecánica"],
    progress: 0,
  },
]

export const getDepartmentStats = () => {
  const stats = {
    enderezado: { total: 0, enProgreso: 0, completados: 0 },
    pintura: { total: 0, enProgreso: 0, completados: 0 },
    mecanica: { total: 0, enProgreso: 0, completados: 0 },
    lavado: { total: 0, enProgreso: 0, completados: 0 },
  }

  mockJobs.forEach((job) => {
    stats[job.department].total++
    if (job.status === "en_progreso") stats[job.department].enProgreso++
    if (job.status === "completado") stats[job.department].completados++
  })

  return stats
}

export const getJobsByDepartment = (department: Department) => {
  return mockJobs.filter((job) => job.department === department)
}

export const getUsersByDepartment = (department: Department) => {
  return mockUsers.filter((user) => user.department === department)
}

export const getUserById = (id: string) => {
  return mockUsers.find((user) => user.id === id)
}
