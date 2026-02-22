export type UserRole = "customer" | "admin"

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  rewardPoints: number
  createdAt: string
}

export interface Service {
  id: string
  name: string
  duration: number // in minutes
  price: number
  description: string
  icon: string // lucide icon name
}

export type AppointmentStatus = "upcoming" | "completed" | "cancelled"

export interface Appointment {
  id: string
  userId: string
  serviceId: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  status: AppointmentStatus
  pointsEarned: number
  createdAt: string
}

export interface RewardMilestone {
  id: string
  pointsRequired: number
  reward: string
  description: string
  discountPercent?: number
  isFreeService?: boolean
}

export interface RewardRedemption {
  id: string
  userId: string
  milestoneId: string
  redeemedAt: string
  pointsUsed: number
}

export interface PointsHistory {
  id: string
  userId: string
  points: number
  type: "earned" | "redeemed" | "deducted"
  description: string
  date: string
}

export interface RewardSettings {
  pointsPerBooking: number
  enabled: boolean
  milestones: RewardMilestone[]
}

export interface AvailabilitySlot {
  dayOfWeek: number // 0=Sun, 1=Mon, etc.
  startHour: number
  endHour: number
  intervalMinutes: number
}
