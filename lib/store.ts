"use client"

import type {
  User,
  Service,
  Appointment,
  RewardSettings,
  PointsHistory,
  RewardRedemption,
  AvailabilitySlot,
} from "./types"

const STORAGE_KEYS = {
  users: "rb_users",
  services: "rb_services",
  appointments: "rb_appointments",
  rewardSettings: "rb_reward_settings",
  pointsHistory: "rb_points_history",
  redemptions: "rb_redemptions",
  availability: "rb_availability",
  currentUser: "rb_current_user",
} as const

// --- Seed Data ---
const seedUsers: User[] = [
  {
    id: "admin-1",
    name: "Admin User",
    email: "admin@rewardbook.com",
    password: "admin123",
    role: "admin",
    rewardPoints: 0,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "customer-1",
    name: "Jane Doe",
    email: "jane@example.com",
    password: "jane123",
    role: "customer",
    rewardPoints: 40,
    createdAt: "2025-06-15T00:00:00Z",
  },
]

const seedServices: Service[] = [
  {
    id: "svc-1",
    name: "Haircut",
    duration: 30,
    price: 150,
    description: "Professional haircut and styling session",
    icon: "Scissors",
  },
  {
    id: "svc-2",
    name: "Consultation",
    duration: 60,
    price: 400,
    description: "One-on-one expert consultation",
    icon: "MessageSquare",
  },
  {
    id: "svc-3",
    name: "Tutoring Session",
    duration: 45,
    price: 200,
    description: "Personalized tutoring session",
    icon: "BookOpen",
  },
]

const seedAppointments: Appointment[] = [
  {
    id: "apt-1",
    userId: "customer-1",
    serviceId: "svc-1",
    date: "2025-12-10",
    time: "10:00",
    status: "completed",
    pointsEarned: 10,
    createdAt: "2025-12-08T00:00:00Z",
  },
  {
    id: "apt-2",
    userId: "customer-1",
    serviceId: "svc-2",
    date: "2025-12-20",
    time: "14:00",
    status: "completed",
    pointsEarned: 10,
    createdAt: "2025-12-18T00:00:00Z",
  },
]

const seedRewardSettings: RewardSettings = {
  pointsPerBooking: 10,
  enabled: true,
  milestones: [
    {
      id: "m-1",
      pointsRequired: 50,
      reward: "10% Discount",
      description: "Get 10% off your next booking",
      discountPercent: 10,
    },
    {
      id: "m-2",
      pointsRequired: 100,
      reward: "Free Service",
      description: "Redeem a free service of your choice",
      isFreeService: true,
    },
    {
      id: "m-3",
      pointsRequired: 200,
      reward: "25% Discount",
      description: "Get 25% off your next 3 bookings",
      discountPercent: 25,
    },
  ],
}

const seedPointsHistory: PointsHistory[] = [
  {
    id: "ph-1",
    userId: "customer-1",
    points: 10,
    type: "earned",
    description: "Booking: Haircut on Dec 10",
    date: "2025-12-10T00:00:00Z",
  },
  {
    id: "ph-2",
    userId: "customer-1",
    points: 10,
    type: "earned",
    description: "Booking: Consultation on Dec 20",
    date: "2025-12-20T00:00:00Z",
  },
  {
    id: "ph-3",
    userId: "customer-1",
    points: 20,
    type: "earned",
    description: "Welcome bonus",
    date: "2025-06-15T00:00:00Z",
  },
]

const seedAvailability: AvailabilitySlot[] = [
  { dayOfWeek: 1, startHour: 9, endHour: 16, intervalMinutes: 60 },
  { dayOfWeek: 2, startHour: 9, endHour: 16, intervalMinutes: 60 },
  { dayOfWeek: 3, startHour: 9, endHour: 16, intervalMinutes: 60 },
  { dayOfWeek: 4, startHour: 9, endHour: 16, intervalMinutes: 60 },
  { dayOfWeek: 5, startHour: 9, endHour: 16, intervalMinutes: 60 },
]

// --- Storage helpers ---
function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// --- Initialize store ---
export function initializeStore(): void {
  if (typeof window === "undefined") return
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    setItem(STORAGE_KEYS.users, seedUsers)
    setItem(STORAGE_KEYS.services, seedServices)
    setItem(STORAGE_KEYS.appointments, seedAppointments)
    setItem(STORAGE_KEYS.rewardSettings, seedRewardSettings)
    setItem(STORAGE_KEYS.pointsHistory, seedPointsHistory)
    setItem(STORAGE_KEYS.redemptions, [])
    setItem(STORAGE_KEYS.availability, seedAvailability)
  }
}

// --- Users ---
export function getUsers(): User[] {
  return getItem(STORAGE_KEYS.users, seedUsers)
}

export function getUserById(id: string): User | undefined {
  return getUsers().find((u) => u.id === id)
}

export function getUserByEmail(email: string): User | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function createUser(user: Omit<User, "id" | "createdAt" | "rewardPoints">): User {
  const users = getUsers()
  const newUser: User = {
    ...user,
    id: `user-${Date.now()}`,
    rewardPoints: 0,
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  setItem(STORAGE_KEYS.users, users)
  return newUser
}

export function updateUser(id: string, updates: Partial<User>): User | undefined {
  const users = getUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return undefined
  users[idx] = { ...users[idx], ...updates }
  setItem(STORAGE_KEYS.users, users)
  return users[idx]
}

// --- Services ---
export function getServices(): Service[] {
  return getItem(STORAGE_KEYS.services, seedServices)
}

export function getServiceById(id: string): Service | undefined {
  return getServices().find((s) => s.id === id)
}

export function createService(service: Omit<Service, "id">): Service {
  const services = getServices()
  const newService: Service = { ...service, id: `svc-${Date.now()}` }
  services.push(newService)
  setItem(STORAGE_KEYS.services, services)
  return newService
}

export function updateService(id: string, updates: Partial<Service>): Service | undefined {
  const services = getServices()
  const idx = services.findIndex((s) => s.id === id)
  if (idx === -1) return undefined
  services[idx] = { ...services[idx], ...updates }
  setItem(STORAGE_KEYS.services, services)
  return services[idx]
}

export function deleteService(id: string): boolean {
  const services = getServices()
  const filtered = services.filter((s) => s.id !== id)
  if (filtered.length === services.length) return false
  setItem(STORAGE_KEYS.services, filtered)
  return true
}

// --- Appointments ---
export function getAppointments(): Appointment[] {
  return getItem(STORAGE_KEYS.appointments, seedAppointments)
}

export function getAppointmentsByUser(userId: string): Appointment[] {
  return getAppointments().filter((a) => a.userId === userId)
}

export function createAppointment(apt: Omit<Appointment, "id" | "createdAt">): Appointment {
  const appointments = getAppointments()
  const newApt: Appointment = {
    ...apt,
    id: `apt-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  appointments.push(newApt)
  setItem(STORAGE_KEYS.appointments, appointments)
  return newApt
}

export function updateAppointment(id: string, updates: Partial<Appointment>): Appointment | undefined {
  const appointments = getAppointments()
  const idx = appointments.findIndex((a) => a.id === id)
  if (idx === -1) return undefined
  appointments[idx] = { ...appointments[idx], ...updates }
  setItem(STORAGE_KEYS.appointments, appointments)
  return appointments[idx]
}

// --- Reward Settings ---
export function getRewardSettings(): RewardSettings {
  return getItem(STORAGE_KEYS.rewardSettings, seedRewardSettings)
}

export function updateRewardSettings(settings: RewardSettings): void {
  setItem(STORAGE_KEYS.rewardSettings, settings)
}

// --- Points History ---
export function getPointsHistory(userId?: string): PointsHistory[] {
  const all = getItem<PointsHistory[]>(STORAGE_KEYS.pointsHistory, seedPointsHistory)
  return userId ? all.filter((p) => p.userId === userId) : all
}

export function addPointsHistory(entry: Omit<PointsHistory, "id">): PointsHistory {
  const history = getItem<PointsHistory[]>(STORAGE_KEYS.pointsHistory, [])
  const newEntry: PointsHistory = { ...entry, id: `ph-${Date.now()}` }
  history.push(newEntry)
  setItem(STORAGE_KEYS.pointsHistory, history)
  return newEntry
}

// --- Redemptions ---
export function getRedemptions(userId?: string): RewardRedemption[] {
  const all = getItem<RewardRedemption[]>(STORAGE_KEYS.redemptions, [])
  return userId ? all.filter((r) => r.userId === userId) : all
}

export function createRedemption(redemption: Omit<RewardRedemption, "id">): RewardRedemption {
  const redemptions = getItem<RewardRedemption[]>(STORAGE_KEYS.redemptions, [])
  const newRedemption: RewardRedemption = { ...redemption, id: `rd-${Date.now()}` }
  redemptions.push(newRedemption)
  setItem(STORAGE_KEYS.redemptions, redemptions)
  return newRedemption
}

// --- Availability ---
export function getAvailability(): AvailabilitySlot[] {
  return getItem(STORAGE_KEYS.availability, seedAvailability)
}

export function updateAvailability(slots: AvailabilitySlot[]): void {
  setItem(STORAGE_KEYS.availability, slots)
}

// --- Auth helpers ---
export function getCurrentUser(): User | null {
  return getItem<User | null>(STORAGE_KEYS.currentUser, null)
}

export function setCurrentUser(user: User | null): void {
  setItem(STORAGE_KEYS.currentUser, user)
}

export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEYS.currentUser)
}

// --- Slot generation ---
export function generateTimeSlots(date: string): string[] {
  const d = new Date(date + "T00:00:00")
  const dayOfWeek = d.getDay()
  const availability = getAvailability()
  const slot = availability.find((s) => s.dayOfWeek === dayOfWeek)
  if (!slot) return []

  const slots: string[] = []
  for (let hour = slot.startHour; hour < slot.endHour; hour += slot.intervalMinutes / 60) {
    const h = Math.floor(hour)
    const m = Math.round((hour - h) * 60)
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
  }
  return slots
}

export function getAvailableSlots(date: string, serviceId?: string): string[] {
  const allSlots = generateTimeSlots(date)
  const appointments = getAppointments().filter(
    (a) => a.date === date && a.status !== "cancelled"
  )
  return allSlots.filter(
    (slot) => !appointments.some((a) => a.time === slot && (!serviceId || a.serviceId === serviceId))
  )
}
