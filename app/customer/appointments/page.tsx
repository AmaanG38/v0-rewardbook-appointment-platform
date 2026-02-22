"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getAppointmentsByUser,
  getServiceById,
  updateAppointment,
  getAvailableSlots,
  addPointsHistory,
} from "@/lib/store"
import type { Appointment, Service } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  CalendarDays,
  Clock,
  Gift,
  CalendarX2,
  CalendarCheck,
  ArrowRightLeft,
  X,
} from "lucide-react"
import { format, addDays, isWeekend, parseISO, isPast } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

interface EnrichedAppointment extends Appointment {
  service?: Service
}

export default function AppointmentsPage() {
  const { user, updatePoints } = useAuth()
  const [appointments, setAppointments] = useState<EnrichedAppointment[]>([])
  const [rescheduleTarget, setRescheduleTarget] = useState<EnrichedAppointment | null>(null)
  const [cancelTarget, setCancelTarget] = useState<EnrichedAppointment | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined)
  const [rescheduleTime, setRescheduleTime] = useState<string | null>(null)
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([])

  const loadAppointments = useCallback(() => {
    if (!user) return
    const apts = getAppointmentsByUser(user.id).map((a) => ({
      ...a,
      service: getServiceById(a.serviceId),
    }))
    // Sort by date descending
    apts.sort((a, b) => {
      const da = `${a.date}T${a.time}`
      const db = `${b.date}T${b.time}`
      return db.localeCompare(da)
    })
    setAppointments(apts)
  }, [user])

  useEffect(() => {
    loadAppointments()
  }, [loadAppointments])

  const upcomingAppointments = appointments.filter((a) => a.status === "upcoming")
  const pastAppointments = appointments.filter((a) => a.status !== "upcoming")

  const handleCancel = useCallback(() => {
    if (!cancelTarget || !user) return
    updateAppointment(cancelTarget.id, { status: "cancelled" })
    if (cancelTarget.pointsEarned > 0) {
      addPointsHistory({
        userId: user.id,
        points: -cancelTarget.pointsEarned,
        type: "deducted",
        description: `Cancelled: ${cancelTarget.service?.name || "Appointment"}`,
        date: new Date().toISOString(),
      })
      updatePoints(-cancelTarget.pointsEarned)
    }
    toast.success("Appointment cancelled")
    setCancelTarget(null)
    loadAppointments()
  }, [cancelTarget, user, updatePoints, loadAppointments])

  const handleReschedule = useCallback(() => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return
    updateAppointment(rescheduleTarget.id, {
      date: format(rescheduleDate, "yyyy-MM-dd"),
      time: rescheduleTime,
    })
    toast.success("Appointment rescheduled")
    setRescheduleTarget(null)
    setRescheduleDate(undefined)
    setRescheduleTime(null)
    loadAppointments()
  }, [rescheduleTarget, rescheduleDate, rescheduleTime, loadAppointments])

  const handleRescheduleDateSelect = useCallback((date: Date | undefined) => {
    setRescheduleDate(date)
    setRescheduleTime(null)
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd")
      setRescheduleSlots(getAvailableSlots(dateStr))
    }
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

  const AppointmentCard = ({
    apt,
    showActions,
  }: {
    apt: EnrichedAppointment
    showActions?: boolean
  }) => (
    <Card className="transition-all hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-card-foreground">
                {apt.service?.name || "Unknown Service"}
              </h3>
              {statusBadge(apt.status)}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(parseISO(apt.date), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(apt.time)}
              </span>
              {apt.pointsEarned > 0 && (
                <span className="flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-primary" />
                  {apt.status === "cancelled" ? (
                    <span className="text-muted-foreground line-through">
                      +{apt.pointsEarned} pts
                    </span>
                  ) : (
                    <span className="text-primary font-medium">+{apt.pointsEarned} pts</span>
                  )}
                </span>
              )}
            </div>
          </div>
          {showActions && apt.status === "upcoming" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRescheduleTarget(apt)}
                className="cursor-pointer"
              >
                <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
                Reschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelTarget(apt)}
                className="text-destructive hover:bg-destructive/5 cursor-pointer"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const EmptyState = ({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) => (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
      <Button asChild className="mt-6 cursor-pointer">
        <Link href="/customer/book">Book Your First Appointment</Link>
      </Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 md:pb-8 lg:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          My Appointments
        </h1>
        <p className="mt-1 text-muted-foreground">
          View and manage your upcoming and past bookings
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="upcoming" className="cursor-pointer">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="cursor-pointer">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((apt) => (
              <AppointmentCard key={apt.id} apt={apt} showActions />
            ))
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="No upcoming appointments"
              description="Book your first appointment and start earning reward points with every visit."
            />
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-3">
          {pastAppointments.length > 0 ? (
            pastAppointments.map((apt) => (
              <AppointmentCard key={apt.id} apt={apt} />
            ))
          ) : (
            <EmptyState
              icon={CalendarX2}
              title="No past appointments"
              description="Your completed and cancelled appointments will appear here."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Reschedule Dialog */}
      <Dialog
        open={!!rescheduleTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleTarget(null)
            setRescheduleDate(undefined)
            setRescheduleTime(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Choose a new date and time for your {rescheduleTarget?.service?.name} appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={rescheduleDate}
                onSelect={handleRescheduleDateSelect}
                disabled={(date) => date < addDays(new Date(), 0) || isWeekend(date)}
              />
            </div>
            {rescheduleDate && rescheduleSlots.length > 0 && (
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">
                  Available Times - {format(rescheduleDate, "MMM d")}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {rescheduleSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setRescheduleTime(slot)}
                      className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                        rescheduleTime === slot
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground hover:border-primary/40"
                      }`}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {rescheduleDate && rescheduleSlots.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                No available slots on this date
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setRescheduleTarget(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleTime}
                className="cursor-pointer"
              >
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your {cancelTarget?.service?.name} appointment.
              {cancelTarget && cancelTarget.pointsEarned > 0 && (
                <> You will lose the <strong>{cancelTarget.pointsEarned} reward points</strong> earned from this booking.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
