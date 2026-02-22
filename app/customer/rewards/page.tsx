"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  getRewardSettings,
  getPointsHistory,
  createRedemption,
  addPointsHistory,
} from "@/lib/store"
import type { RewardSettings, PointsHistory, RewardMilestone } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Gift,
  Star,
  TrendingUp,
  History,
  CheckCircle2,
  Lock,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"

export default function RewardsPage() {
  const { user, updatePoints, refreshUser } = useAuth()
  const [settings, setSettings] = useState<RewardSettings | null>(null)
  const [history, setHistory] = useState<PointsHistory[]>([])
  const [redeemTarget, setRedeemTarget] = useState<RewardMilestone | null>(null)
  const [showRedeemSuccess, setShowRedeemSuccess] = useState(false)

  const loadData = useCallback(() => {
    if (!user) return
    setSettings(getRewardSettings())
    const ph = getPointsHistory(user.id)
    ph.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setHistory(ph)
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRedeem = useCallback(() => {
    if (!user || !redeemTarget) return
    if (user.rewardPoints < redeemTarget.pointsRequired) {
      toast.error("Not enough points")
      return
    }

    createRedemption({
      userId: user.id,
      milestoneId: redeemTarget.id,
      redeemedAt: new Date().toISOString(),
      pointsUsed: redeemTarget.pointsRequired,
    })

    addPointsHistory({
      userId: user.id,
      points: -redeemTarget.pointsRequired,
      type: "redeemed",
      description: `Redeemed: ${redeemTarget.reward}`,
      date: new Date().toISOString(),
    })

    updatePoints(-redeemTarget.pointsRequired)
    setRedeemTarget(null)
    setShowRedeemSuccess(true)
    loadData()
  }, [user, redeemTarget, updatePoints, loadData])

  if (!user || !settings) return null

  const nextMilestone = settings.milestones
    .filter((m) => m.pointsRequired > user.rewardPoints)
    .sort((a, b) => a.pointsRequired - b.pointsRequired)[0]

  const progressPercent = nextMilestone
    ? Math.min((user.rewardPoints / nextMilestone.pointsRequired) * 100, 100)
    : 100

  const pointsToNext = nextMilestone ? nextMilestone.pointsRequired - user.rewardPoints : 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 md:pb-8 lg:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          My Rewards
        </h1>
        <p className="mt-1 text-muted-foreground">
          Earn points with every booking and unlock exclusive rewards
        </p>
      </div>

      {/* Points overview card */}
      <Card className="mb-8 overflow-hidden border-0 shadow-lg">
        <div className="bg-primary p-6 lg:p-8 text-primary-foreground">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary-foreground/80">Your Points Balance</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{user.rewardPoints}</span>
                <span className="text-lg text-primary-foreground/70">points</span>
              </div>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/15">
              <Star className="h-8 w-8" />
            </div>
          </div>

          {nextMilestone && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary-foreground/80">
                  Next reward: {nextMilestone.reward}
                </span>
                <span className="font-medium">
                  {pointsToNext} pts to go
                </span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-primary-foreground/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {history.filter((h) => h.type === "earned").reduce((sum, h) => sum + h.points, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {Math.abs(
                  history.filter((h) => h.type === "redeemed").reduce((sum, h) => sum + h.points, 0)
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Redeemed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{settings.pointsPerBooking}</p>
              <p className="text-xs text-muted-foreground mt-1">Per Booking</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Reward Milestones
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {settings.milestones
            .sort((a, b) => a.pointsRequired - b.pointsRequired)
            .map((milestone) => {
              const canRedeem = user.rewardPoints >= milestone.pointsRequired
              const progress = Math.min(
                (user.rewardPoints / milestone.pointsRequired) * 100,
                100
              )
              return (
                <Card
                  key={milestone.id}
                  className={`transition-all ${
                    canRedeem
                      ? "border-primary/30 shadow-md"
                      : "border-border"
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          canRedeem
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {canRedeem ? (
                          <Gift className="h-5 w-5" />
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </div>
                      <Badge
                        variant={canRedeem ? "default" : "secondary"}
                        className={canRedeem ? "bg-primary text-primary-foreground" : ""}
                      >
                        {milestone.pointsRequired} pts
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-card-foreground">{milestone.reward}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>

                    <div className="mt-4">
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    <Button
                      className="mt-4 w-full cursor-pointer"
                      size="sm"
                      disabled={!canRedeem}
                      onClick={() => setRedeemTarget(milestone)}
                      variant={canRedeem ? "default" : "secondary"}
                    >
                      {canRedeem ? "Redeem Now" : `${milestone.pointsRequired - user.rewardPoints} pts away`}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      </div>

      {/* Points History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          Points History
        </h2>
        {history.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        entry.type === "earned"
                          ? "bg-success/10 text-success"
                          : entry.type === "redeemed"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {entry.type === "earned" ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : entry.type === "redeemed" ? (
                        <Gift className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {entry.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(entry.date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        entry.type === "earned"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {entry.points > 0 ? "+" : ""}
                      {entry.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No activity yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Book an appointment to start earning points
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Redeem confirmation */}
      <Dialog open={!!redeemTarget} onOpenChange={(open) => { if (!open) setRedeemTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Reward</DialogTitle>
            <DialogDescription>
              Are you sure you want to redeem <strong>{redeemTarget?.reward}</strong> for{" "}
              <strong>{redeemTarget?.pointsRequired} points</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">{redeemTarget?.description}</p>
            <p className="mt-2 text-sm text-foreground">
              Your balance after redemption:{" "}
              <strong>
                {user.rewardPoints - (redeemTarget?.pointsRequired || 0)} points
              </strong>
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRedeemTarget(null)} className="cursor-pointer">
              Cancel
            </Button>
            <Button onClick={handleRedeem} className="cursor-pointer">
              Confirm Redemption
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redeem success */}
      <Dialog open={showRedeemSuccess} onOpenChange={setShowRedeemSuccess}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Reward Redeemed!</DialogTitle>
            <DialogDescription>
              Your reward will be applied to your next booking.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowRedeemSuccess(false)} className="w-full cursor-pointer">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
