"use client"

import { useState, useEffect, useCallback } from "react"
import { getRewardSettings, updateRewardSettings } from "@/lib/store"
import type { RewardSettings, RewardMilestone } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Gift, Plus, Pencil, Trash2, Sparkles, ToggleLeft } from "lucide-react"
import { toast } from "sonner"

interface MilestoneFormData {
  pointsRequired: number
  reward: string
  description: string
  discountPercent: number
  isFreeService: boolean
}

const defaultMilestoneForm: MilestoneFormData = {
  pointsRequired: 50,
  reward: "",
  description: "",
  discountPercent: 0,
  isFreeService: false,
}

export default function AdminRewardsPage() {
  const [settings, setSettings] = useState<RewardSettings | null>(null)
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<RewardMilestone | null>(null)
  const [deleteMilestone, setDeleteMilestone] = useState<RewardMilestone | null>(null)
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormData>(defaultMilestoneForm)

  useEffect(() => {
    setSettings(getRewardSettings())
  }, [])

  const save = useCallback(
    (newSettings: RewardSettings) => {
      updateRewardSettings(newSettings)
      setSettings(newSettings)
    },
    []
  )

  const handleToggleEnabled = useCallback(() => {
    if (!settings) return
    const updated = { ...settings, enabled: !settings.enabled }
    save(updated)
    toast.success(updated.enabled ? "Rewards enabled" : "Rewards disabled")
  }, [settings, save])

  const handlePointsPerBookingChange = useCallback(
    (value: number) => {
      if (!settings) return
      const updated = { ...settings, pointsPerBooking: value }
      save(updated)
    },
    [settings, save]
  )

  const handleSaveMilestone = useCallback(() => {
    if (!settings) return
    if (!milestoneForm.reward.trim()) {
      toast.error("Reward name is required")
      return
    }
    if (milestoneForm.pointsRequired <= 0) {
      toast.error("Points must be greater than 0")
      return
    }

    let newMilestones: RewardMilestone[]

    if (editingMilestone) {
      newMilestones = settings.milestones.map((m) =>
        m.id === editingMilestone.id
          ? {
              ...m,
              pointsRequired: milestoneForm.pointsRequired,
              reward: milestoneForm.reward,
              description: milestoneForm.description,
              discountPercent: milestoneForm.isFreeService ? undefined : milestoneForm.discountPercent,
              isFreeService: milestoneForm.isFreeService,
            }
          : m
      )
      toast.success("Milestone updated")
    } else {
      const newMilestone: RewardMilestone = {
        id: `m-${Date.now()}`,
        pointsRequired: milestoneForm.pointsRequired,
        reward: milestoneForm.reward,
        description: milestoneForm.description,
        discountPercent: milestoneForm.isFreeService ? undefined : milestoneForm.discountPercent,
        isFreeService: milestoneForm.isFreeService,
      }
      newMilestones = [...settings.milestones, newMilestone]
      toast.success("Milestone created")
    }

    save({ ...settings, milestones: newMilestones })
    setShowMilestoneDialog(false)
    setEditingMilestone(null)
    setMilestoneForm(defaultMilestoneForm)
  }, [settings, milestoneForm, editingMilestone, save])

  const handleDeleteMilestone = useCallback(() => {
    if (!settings || !deleteMilestone) return
    const newMilestones = settings.milestones.filter((m) => m.id !== deleteMilestone.id)
    save({ ...settings, milestones: newMilestones })
    toast.success("Milestone deleted")
    setDeleteMilestone(null)
  }, [settings, deleteMilestone, save])

  const openEditMilestone = (milestone: RewardMilestone) => {
    setEditingMilestone(milestone)
    setMilestoneForm({
      pointsRequired: milestone.pointsRequired,
      reward: milestone.reward,
      description: milestone.description,
      discountPercent: milestone.discountPercent || 0,
      isFreeService: milestone.isFreeService || false,
    })
    setShowMilestoneDialog(true)
  }

  if (!settings) return null

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Reward Rules
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure how customers earn and redeem reward points
        </p>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Toggle Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              Reward System
            </CardTitle>
            <CardDescription>Enable or disable the reward point system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  Rewards are {settings.enabled ? "active" : "inactive"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {settings.enabled
                    ? "Customers earn points on every booking"
                    : "No points will be awarded for bookings"}
                </p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={handleToggleEnabled}
                className="cursor-pointer"
                aria-label="Toggle reward system"
              />
            </div>
          </CardContent>
        </Card>

        {/* Points Per Booking Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              Points Per Booking
            </CardTitle>
            <CardDescription>How many points customers earn per appointment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  type="number"
                  value={settings.pointsPerBooking}
                  onChange={(e) => handlePointsPerBookingChange(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  className="text-lg font-semibold h-12"
                />
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                points per booking
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Gift className="h-5 w-5 text-muted-foreground" />
            Redemption Milestones
          </h2>
          <Button
            onClick={() => {
              setEditingMilestone(null)
              setMilestoneForm(defaultMilestoneForm)
              setShowMilestoneDialog(true)
            }}
            size="sm"
            className="cursor-pointer"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Milestone
          </Button>
        </div>

        {settings.milestones.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {settings.milestones
              .sort((a, b) => a.pointsRequired - b.pointsRequired)
              .map((milestone) => (
                <Card key={milestone.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Gift className="h-5 w-5" />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer"
                          onClick={() => openEditMilestone(milestone)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="sr-only">Edit milestone</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive cursor-pointer"
                          onClick={() => setDeleteMilestone(milestone)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete milestone</span>
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-card-foreground">{milestone.reward}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {milestone.pointsRequired} points
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {milestone.isFreeService
                          ? "Free Service"
                          : milestone.discountPercent
                          ? `${milestone.discountPercent}% off`
                          : "Custom"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Gift className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No milestones configured</p>
              <p className="text-xs text-muted-foreground">
                Add milestones to give customers rewards to work toward
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Milestone Dialog */}
      <Dialog
        open={showMilestoneDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowMilestoneDialog(false)
            setEditingMilestone(null)
            setMilestoneForm(defaultMilestoneForm)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? "Edit Milestone" : "Add Milestone"}
            </DialogTitle>
            <DialogDescription>
              {editingMilestone
                ? "Update the milestone details"
                : "Create a new reward milestone for customers"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="m-reward">Reward Name</Label>
              <Input
                id="m-reward"
                value={milestoneForm.reward}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, reward: e.target.value })}
                placeholder="e.g. 10% Discount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-desc">Description</Label>
              <Input
                id="m-desc"
                value={milestoneForm.description}
                onChange={(e) =>
                  setMilestoneForm({ ...milestoneForm, description: e.target.value })
                }
                placeholder="e.g. Get 10% off your next booking"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-points">Points Required</Label>
              <Input
                id="m-points"
                type="number"
                value={milestoneForm.pointsRequired}
                onChange={(e) =>
                  setMilestoneForm({
                    ...milestoneForm,
                    pointsRequired: parseInt(e.target.value) || 0,
                  })
                }
                min={1}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="text-sm font-medium">Free Service</Label>
                <p className="text-xs text-muted-foreground">Reward is a completely free service</p>
              </div>
              <Switch
                checked={milestoneForm.isFreeService}
                onCheckedChange={(v) =>
                  setMilestoneForm({ ...milestoneForm, isFreeService: v })
                }
                className="cursor-pointer"
              />
            </div>
            {!milestoneForm.isFreeService && (
              <div className="space-y-2">
                <Label htmlFor="m-discount">Discount Percentage</Label>
                <Input
                  id="m-discount"
                  type="number"
                  value={milestoneForm.discountPercent}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      discountPercent: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={100}
                />
              </div>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMilestoneDialog(false)
                  setEditingMilestone(null)
                  setMilestoneForm(defaultMilestoneForm)
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveMilestone} className="cursor-pointer">
                {editingMilestone ? "Save Changes" : "Create Milestone"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteMilestone}
        onOpenChange={(open) => { if (!open) setDeleteMilestone(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the &quot;{deleteMilestone?.reward}&quot; milestone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMilestone}
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
