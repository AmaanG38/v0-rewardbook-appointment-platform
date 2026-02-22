"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck, Gift, ArrowRight, User, Shield } from "lucide-react"
import { toast } from "sonner"

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"customer" | "admin">("customer")
  const [error, setError] = useState("")
  const { login, register } = useAuth()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (mode === "login") {
      const result = login(email, password)
      if (result.success) {
        toast.success("Welcome back!")
        const user = { role } as { role: string }
        // Re-read from context after login
        const stored = localStorage.getItem("rb_current_user")
        if (stored) {
          const parsed = JSON.parse(stored)
          router.push(parsed.role === "admin" ? "/admin" : "/customer/book")
        }
      } else {
        setError(result.error || "Login failed")
      }
    } else {
      if (!name.trim()) {
        setError("Name is required")
        return
      }
      const result = register(name, email, password, role)
      if (result.success) {
        toast.success("Account created successfully!")
        router.push(role === "admin" ? "/admin" : "/customer/book")
      } else {
        setError(result.error || "Registration failed")
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">RewardBook</span>
          </div>
        </div>
        <div className="space-y-8">
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight">
            Book appointments. Earn rewards. Get more value.
          </h1>
          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            The modern booking platform that rewards your loyalty. Every appointment earns you points toward discounts and free services.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <span className="text-primary-foreground/90">Effortless online booking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15">
                <Gift className="h-5 w-5" />
              </div>
              <span className="text-primary-foreground/90">Earn points on every visit</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/15">
                <ArrowRight className="h-5 w-5" />
              </div>
              <span className="text-primary-foreground/90">Redeem for discounts and freebies</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-primary-foreground/50">
          Demo accounts: admin@rewardbook.com / admin123 or jane@example.com / jane123
        </p>
      </div>

      {/* Right side - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">RewardBook</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {mode === "login"
                ? "Sign in to manage your bookings and rewards"
                : "Get started with RewardBook today"}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label className="text-foreground">Account Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all ${
                      role === "customer"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <div>
                      <div className="text-sm font-medium">Customer</div>
                      <div className="text-xs text-muted-foreground">Book services</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all ${
                      role === "admin"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <div>
                      <div className="text-sm font-medium">Admin</div>
                      <div className="text-xs text-muted-foreground">Manage business</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="h-11 w-full text-base font-medium cursor-pointer">
              {mode === "login" ? "Sign In" : "Create Account"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                {"Don't have an account? "}
                <button
                  onClick={() => { setMode("register"); setError("") }}
                  className="font-medium text-primary hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("login"); setError("") }}
                  className="font-medium text-primary hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Demo credentials for mobile */}
          <Card className="lg:hidden border-dashed">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Demo Accounts</CardTitle>
              <CardDescription className="text-xs">Use these to explore the app</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-1 text-xs text-muted-foreground font-mono">
              <p>Admin: admin@rewardbook.com / admin123</p>
              <p>Customer: jane@example.com / jane123</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
