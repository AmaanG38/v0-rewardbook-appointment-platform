"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getServices,
  createService,
  updateService,
  deleteService,
  getAvailability,
  updateAvailability,
} from "@/lib/store"
import type { Service, AvailabilitySlot } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
  Scissors,
  MessageSquare,
  BookOpen,
  Wrench,
  CalendarDays,
} from "lucide-react"
import { toast } from "sonner"

const ICON_OPTIONS = [
  { value: "Scissors", label: "Scissors", Icon: Scissors },
  { value: "MessageSquare", label: "Chat", Icon: MessageSquare },
  { value: "BookOpen", label: "Book", Icon: BookOpen },
  { value: "Wrench", label: "Wrench", Icon: Wrench },
  { value: "CalendarDays", label: "Calendar", Icon: CalendarDays },
]

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Scissors,
  MessageSquare,
  BookOpen,
  Wrench,
  CalendarDays,
}

interface ServiceFormData {
  name: string
  duration: number
  price: number
  description: string
  icon: string
}

const defaultFormData: ServiceFormData = {
  name: "",
  duration: 30,
  price: 0,
  description: "",
  icon: "Scissors",
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [availability, setAvailabilityState] = useState<AvailabilitySlot[]>([])
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData)

  const loadData = useCallback(() => {
    setServices(getServices())
    setAvailabilityState(getAvailability())
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSaveService = useCallback(() => {
    if (!formData.name.trim()) {
      toast.error("Service name is required")
      return
    }
    if (formData.price <= 0) {
      toast.error("Price must be greater than 0")
      return
    }

    if (editingService) {
      updateService(editingService.id, formData)
      toast.success("Service updated")
    } else {
      createService(formData)
      toast.success("Service created")
    }

    setShowServiceDialog(false)
    setEditingService(null)
    setFormData(defaultFormData)
    loadData()
  }, [formData, editingService, loadData])

  const handleDeleteService = useCallback(() => {
    if (!deleteTarget) return
    deleteService(deleteTarget.id)
    toast.success("Service deleted")
    setDeleteTarget(null)
    loadData()
  }, [deleteTarget, loadData])

  const openEditDialog = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      duration: service.duration,
      price: service.price,
      description: service.description,
      icon: service.icon,
    })
    setShowServiceDialog(true)
  }

  const openCreateDialog = () => {
    setEditingService(null)
    setFormData(defaultFormData)
    setShowServiceDialog(true)
  }

  const toggleDay = (dayOfWeek: number) => {
    const existing = availability.find((s) => s.dayOfWeek === dayOfWeek)
    let newAvailability: AvailabilitySlot[]
    if (existing) {
      newAvailability = availability.filter((s) => s.dayOfWeek !== dayOfWeek)
    } else {
      newAvailability = [
        ...availability,
        { dayOfWeek, startHour: 9, endHour: 16, intervalMinutes: 60 },
      ]
    }
    newAvailability.sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    setAvailabilityState(newAvailability)
    updateAvailability(newAvailability)
    toast.success(existing ? `${DAYS[dayOfWeek].label} disabled` : `${DAYS[dayOfWeek].label} enabled`)
  }

  const updateSlot = (dayOfWeek: number, field: keyof AvailabilitySlot, value: number) => {
    const newAvailability = availability.map((s) => {
      if (s.dayOfWeek === dayOfWeek) {
        return { ...s, [field]: value }
      }
      return s
    })
    setAvailabilityState(newAvailability)
    updateAvailability(newAvailability)
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Services & Availability
        </h1>
        <p className="mt-1 text-muted-foreground">Manage your services and booking availability</p>
      </div>

      {/* Services Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Services
          </h2>
          <Button onClick={openCreateDialog} size="sm" className="cursor-pointer">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Service
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || Settings
            return (
              <Card key={service.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => openEditDialog(service)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="sr-only">Edit service</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive cursor-pointer"
                        onClick={() => setDeleteTarget(service)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete service</span>
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-card-foreground">{service.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration} min
                    </span>
                    <span className="font-bold text-card-foreground">R{service.price}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Availability Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          Availability Schedule
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {DAYS.map((day) => {
                const slot = availability.find((s) => s.dayOfWeek === day.value)
                const isEnabled = !!slot
                return (
                  <div
                    key={day.value}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleDay(day.value)}
                        className="cursor-pointer"
                        aria-label={`Toggle ${day.label}`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          isEnabled ? "text-card-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {day.label}
                      </span>
                    </div>
                    {isEnabled && slot && (
                      <div className="flex items-center gap-3 ml-12 sm:ml-0">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            From
                          </Label>
                          <Select
                            value={slot.startHour.toString()}
                            onValueChange={(v) => updateSlot(day.value, "startHour", parseInt(v))}
                          >
                            <SelectTrigger className="w-[100px] h-8 text-xs cursor-pointer">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 14 }, (_, i) => i + 6).map((h) => (
                                <SelectItem key={h} value={h.toString()} className="cursor-pointer">
                                  {`${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            To
                          </Label>
                          <Select
                            value={slot.endHour.toString()}
                            onValueChange={(v) => updateSlot(day.value, "endHour", parseInt(v))}
                          >
                            <SelectTrigger className="w-[100px] h-8 text-xs cursor-pointer">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 14 }, (_, i) => i + 7).map((h) => (
                                <SelectItem key={h} value={h.toString()} className="cursor-pointer">
                                  {`${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            Every
                          </Label>
                          <Select
                            value={slot.intervalMinutes.toString()}
                            onValueChange={(v) =>
                              updateSlot(day.value, "intervalMinutes", parseInt(v))
                            }
                          >
                            <SelectTrigger className="w-[90px] h-8 text-xs cursor-pointer">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30" className="cursor-pointer">30 min</SelectItem>
                              <SelectItem value="60" className="cursor-pointer">60 min</SelectItem>
                              <SelectItem value="90" className="cursor-pointer">90 min</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Dialog */}
      <Dialog
        open={showServiceDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowServiceDialog(false)
            setEditingService(null)
            setFormData(defaultFormData)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Update the service details below"
                : "Fill in the details to create a new service"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="svc-name">Service Name</Label>
              <Input
                id="svc-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Haircut"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="svc-duration">Duration (min)</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                  }
                  min={15}
                  step={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-price">Price (R)</Label>
                <Input
                  id="svc-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: parseInt(e.target.value) || 0 })
                  }
                  min={0}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-desc">Description</Label>
              <Textarea
                id="svc-desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the service"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: opt.value })}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all cursor-pointer ${
                      formData.icon === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                    title={opt.label}
                  >
                    <opt.Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowServiceDialog(false)
                  setEditingService(null)
                  setFormData(defaultFormData)
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveService} className="cursor-pointer">
                {editingService ? "Save Changes" : "Create Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.name}&quot;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
