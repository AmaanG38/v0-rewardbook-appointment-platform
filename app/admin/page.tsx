"use client"

import { useState, useEffect } from "react"
import {
  getAppointments,
  getUsers,
  getServices,
  getServiceById,
  getUserById,
  getRedemptions,
} from "@/lib/store"
import type { Appointment, Service, User } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CalendarDays,
  Users,
  DollarSign,
  Gift,
  Clock,
  TrendingUp,
} from "lucide-react"
import { format, parseISO, isToday } from "date-fns"

interface DashboardStats {
  todayAppointments: number
  totalCustomers: number
  totalRevenue: number
  pointsRedeemed: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pointsRedeemed: 0,
  })
  const [recentAppointments, setRecentAppointments] = useState<
    (Appointment & { service?: Service; customer?: User })[]
  >([])

  useEffect(() => {
    const appointments = getAppointments()
    const users = getUsers()
    const services = getServices()
    const redemptions = getRedemptions()

    const todayStr = format(new Date(), "yyyy-MM-dd")
    const todayAppointments = appointments.filter(
      (a) => a.date === todayStr && a.status !== "cancelled"
    ).length
    const totalCustomers = users.filter((u) => u.role === "customer").length

    const completedApts = appointments.filter((a) => a.status === "completed")
    const totalRevenue = completedApts.reduce((sum, a) => {
      const svc = services.find((s) => s.id === a.serviceId)
      return sum + (svc?.price || 0)
    }, 0)

    const pointsRedeemed = redemptions.reduce((sum, r) => sum + r.pointsUsed, 0)

    setStats({ todayAppointments, totalCustomers, totalRevenue, pointsRedeemed })

    // Recent appointments (last 10)
    const sorted = [...appointments]
      .sort((a, b) => {
        const da = `${a.date}T${a.time}`
        const db = `${b.date}T${b.time}`
        return db.localeCompare(da)
      })
      .slice(0, 10)
      .map((a) => ({
        ...a,
        service: getServiceById(a.serviceId),
        customer: getUserById(a.userId),
      }))
    setRecentAppointments(sorted)
  }, [])

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-primary/10 text-primary border-0">Upcoming</Badge>
      case "completed":
        return <Badge className="bg-success/10 text-success border-0">Completed</Badge>
      case "cancelled":
        return <Badge variant="secondary" className="text-muted-foreground">Cancelled</Badge>
      default:
        return null
    }
  }

  const statCards = [
    {
      label: "Today's Appointments",
      value: stats.todayAppointments,
      icon: CalendarDays,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: "Total Revenue",
      value: `R${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Points Redeemed",
      value: stats.pointsRedeemed,
      icon: Gift,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your business performance</p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-card-foreground">{card.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-sm text-muted-foreground">
                    <th className="px-6 py-3 text-left font-medium">Customer</th>
                    <th className="px-6 py-3 text-left font-medium">Service</th>
                    <th className="px-6 py-3 text-left font-medium">Date</th>
                    <th className="px-6 py-3 text-left font-medium">Time</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentAppointments.map((apt) => (
                    <tr key={apt.id} className="text-sm">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {apt.customer?.name.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{apt.customer?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{apt.customer?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-card-foreground">{apt.service?.name || "Unknown"}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(parseISO(apt.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{formatTime(apt.time)}</td>
                      <td className="px-6 py-4">{statusBadge(apt.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No appointments yet</p>
              <p className="text-xs text-muted-foreground">
                Appointments will appear here as customers book services
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
