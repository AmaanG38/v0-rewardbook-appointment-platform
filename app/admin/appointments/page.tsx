"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  getAppointments,
  getServiceById,
  getUserById,
  getServices,
  updateAppointment,
} from "@/lib/store"
import type { Appointment, Service, User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CalendarDays,
  Search,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"

interface EnrichedAppointment extends Appointment {
  service?: Service
  customer?: User
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<EnrichedAppointment[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterService, setFilterService] = useState<string>("all")
  const [filterDate, setFilterDate] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")

  const loadData = useCallback(() => {
    const apts = getAppointments().map((a) => ({
      ...a,
      service: getServiceById(a.serviceId),
      customer: getUserById(a.userId),
    }))
    apts.sort((a, b) => {
      const da = `${a.date}T${a.time}`
      const db = `${b.date}T${b.time}`
      return db.localeCompare(da)
    })
    setAppointments(apts)
    setServices(getServices())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStatusChange = useCallback(
    (id: string, status: "completed" | "cancelled") => {
      updateAppointment(id, { status })
      toast.success(`Appointment marked as ${status}`)
      loadData()
    },
    [loadData]
  )

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (filterStatus !== "all" && apt.status !== filterStatus) return false
      if (filterService !== "all" && apt.serviceId !== filterService) return false
      if (filterDate && apt.date !== filterDate) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = apt.customer?.name.toLowerCase().includes(query)
        const matchesEmail = apt.customer?.email.toLowerCase().includes(query)
        const matchesService = apt.service?.name.toLowerCase().includes(query)
        if (!matchesName && !matchesEmail && !matchesService) return false
      }
      return true
    })
  }, [appointments, filterStatus, filterService, filterDate, searchQuery])

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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Appointments
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage all customer appointments
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] cursor-pointer">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
                  <SelectItem value="upcoming" className="cursor-pointer">Upcoming</SelectItem>
                  <SelectItem value="completed" className="cursor-pointer">Completed</SelectItem>
                  <SelectItem value="cancelled" className="cursor-pointer">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterService} onValueChange={setFilterService}>
                <SelectTrigger className="w-[160px] cursor-pointer">
                  <SelectValue placeholder="Service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Services</SelectItem>
                  {services.map((svc) => (
                    <SelectItem key={svc.id} value={svc.id} className="cursor-pointer">
                      {svc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-[160px]"
              />
              {(filterStatus !== "all" || filterService !== "all" || filterDate || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterStatus("all")
                    setFilterService("all")
                    setFilterDate("")
                    setSearchQuery("")
                  }}
                  className="text-muted-foreground cursor-pointer"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-sm text-muted-foreground">
                    <th className="px-6 py-3 text-left font-medium">Customer</th>
                    <th className="px-6 py-3 text-left font-medium">Service</th>
                    <th className="px-6 py-3 text-left font-medium">Date</th>
                    <th className="px-6 py-3 text-left font-medium">Time</th>
                    <th className="px-6 py-3 text-left font-medium">Points</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="text-sm hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {apt.customer?.name.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">
                              {apt.customer?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {apt.customer?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-card-foreground">
                        {apt.service?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format(parseISO(apt.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatTime(apt.time)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-primary font-medium">
                          +{apt.pointsEarned}
                        </span>
                      </td>
                      <td className="px-6 py-4">{statusBadge(apt.status)}</td>
                      <td className="px-6 py-4 text-right">
                        {apt.status === "upcoming" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(apt.id, "completed")}
                                className="cursor-pointer"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4 text-success" />
                                Mark Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(apt.id, "cancelled")}
                                className="text-destructive cursor-pointer"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Mark Cancelled
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No appointments found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery || filterStatus !== "all" || filterService !== "all" || filterDate
                  ? "Try adjusting your filters"
                  : "Appointments will appear here as customers book services"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Showing {filteredAppointments.length} of {appointments.length} appointments
      </p>
    </div>
  )
}
