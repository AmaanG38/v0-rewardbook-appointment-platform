"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getServices,
  getAvailableSlots,
  createAppointment,
  addPointsHistory,
  getRewardSettings,
} from "@/lib/store"
import type { Service } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Scissors,
  MessageSquare,
  BookOpen,
  Clock,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  Gift,
  Wrench,
} from "lucide-react"
import { format, addDays, isWeekend } from "date-fns"
import { toast } from "sonner"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Scissors,
  MessageSquare,
  BookOpen,
  Wrench,
}

export default function BookPage() {
  const { user, updatePoints } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [step, setStep] = useState<"service" | "datetime" | "confirm">("service")
  const [showSuccess, setShowSuccess] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)

  useEffect(() => {
    setServices(getServices())
  }, [])

  const handleDateSelect = useCallback((date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime(null)
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd")
      const slots = getAvailableSlots(dateStr)
      setAvailableSlots(slots)
    }
  }, [])

  const handleConfirmBooking = useCallback(() => {
    if (!user || !selectedService || !selectedDate || !selectedTime) return

    const settings = getRewardSettings()
    const points = settings.enabled ? settings.pointsPerBooking : 0
    const dateStr = format(selectedDate, "yyyy-MM-dd")

    createAppointment({
      userId: user.id,
      serviceId: selectedService.id,
      date: dateStr,
      time: selectedTime,
      status: "upcoming",
      pointsEarned: points,
    })

    if (points > 0) {
      addPointsHistory({
        userId: user.id,
        points,
        type: "earned",
        description: `Booking: ${selectedService.name} on ${format(selectedDate, "MMM d")}`,
        date: new Date().toISOString(),
      })
      updatePoints(points)
    }

    setEarnedPoints(points)
    setShowSuccess(true)
  }, [user, selectedService, selectedDate, selectedTime, updatePoints])

  const resetBooking = useCallback(() => {
    setSelectedService(null)
    setSelectedDate(undefined)
    setSelectedTime(null)
    setStep("service")
    setShowSuccess(false)
    setEarnedPoints(0)
  }, [])

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const hour12 = h % 12 || 12
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24 md:pb-8 lg:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Book an Appointment
        </h1>
        <p className="mt-1 text-muted-foreground">
          Choose a service, pick a time, and earn reward points
        </p>
      </div>

      {/* Step indicators */}
      <div className="mb-8 flex items-center gap-2">
        {[
          { key: "service", label: "Service" },
          { key: "datetime", label: "Date & Time" },
          { key: "confirm", label: "Confirm" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                step === s.key
                  ? "bg-primary text-primary-foreground"
                  : ["service", "datetime", "confirm"].indexOf(step) >
                    ["service", "datetime", "confirm"].indexOf(s.key)
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`hidden text-sm font-medium sm:inline ${
                step === s.key ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < 2 && (
              <div className="mx-2 h-px w-6 bg-border sm:w-12" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === "service" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || CalendarDays
            const isSelected = selectedService?.id === service.id
            return (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? "ring-2 ring-primary border-primary shadow-md"
                    : "border-border hover:border-primary/30"
                }`}
                onClick={() => setSelectedService(service)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <CardTitle className="text-lg text-card-foreground">{service.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration} min
                    </div>
                    <span className="text-lg font-bold text-foreground">
                      R{service.price}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {step === "service" && selectedService && (
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setStep("datetime")} size="lg" className="cursor-pointer">
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === "datetime" && selectedService && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">Select a Date</h3>
            <Card>
              <CardContent className="p-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) =>
                    date < addDays(new Date(), 0) || isWeekend(date)
                  }
                  className="rounded-md"
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              {selectedDate
                ? `Available Times - ${format(selectedDate, "EEEE, MMM d")}`
                : "Select a date first"}
            </h3>
            {selectedDate && availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                      selectedTime === slot
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border text-foreground hover:border-primary/40 hover:bg-accent"
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            ) : selectedDate ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">No slots available</p>
                  <p className="text-xs text-muted-foreground">Try a different date</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <CalendarDays className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">Pick a date to see available slots</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setStep("service")} className="cursor-pointer">
              Back
            </Button>
            {selectedTime && (
              <Button onClick={() => setStep("confirm")} size="lg" className="cursor-pointer">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === "confirm" && selectedService && selectedDate && selectedTime && (
        <div className="mx-auto max-w-lg">
          <Card className="overflow-hidden">
            <div className="bg-primary px-6 py-5 text-primary-foreground">
              <h3 className="text-lg font-semibold">Booking Summary</h3>
              <p className="text-sm text-primary-foreground/80">Review your appointment details</p>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="text-base font-semibold text-card-foreground">{selectedService.name}</p>
                </div>
                <span className="text-xl font-bold text-card-foreground">R{selectedService.price}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-base font-medium text-card-foreground">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="text-base font-medium text-card-foreground">{formatTime(selectedTime)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-base font-medium text-card-foreground">{selectedService.duration} minutes</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                  <Gift className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-secondary-foreground">
                    +{getRewardSettings().enabled ? getRewardSettings().pointsPerBooking : 0} pts
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep("datetime")}
                  className="flex-1 cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  className="flex-1 cursor-pointer"
                  size="lg"
                >
                  Confirm Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Booking Confirmed!</DialogTitle>
            <DialogDescription className="text-center">
              Your appointment has been booked successfully.
              {earnedPoints > 0 && (
                <>
                  {" "}You earned{" "}
                  <span className="font-semibold text-primary">{earnedPoints} reward points</span>!
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={resetBooking}
              className="flex-1 cursor-pointer"
            >
              Book Another
            </Button>
            <Button
              onClick={() => {
                resetBooking()
                window.location.href = "/customer/appointments"
              }}
              className="flex-1 cursor-pointer"
            >
              View Bookings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
