"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import type { User } from "./types"
import {
  initializeStore,
  getCurrentUser,
  setCurrentUser,
  getUserByEmail,
  createUser,
  updateUser,
  logout as storeLogout,
} from "./store"

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  register: (name: string, email: string, password: string, role: "customer" | "admin") => { success: boolean; error?: string }
  logout: () => void
  refreshUser: () => void
  updatePoints: (points: number) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeStore()
    const stored = getCurrentUser()
    if (stored) {
      // Refresh from store to get latest data
      const fresh = getUserByEmail(stored.email)
      if (fresh) {
        setUser(fresh)
        setCurrentUser(fresh)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback((email: string, password: string) => {
    const found = getUserByEmail(email)
    if (!found) return { success: false, error: "No account found with this email" }
    if (found.password !== password) return { success: false, error: "Incorrect password" }
    setUser(found)
    setCurrentUser(found)
    return { success: true }
  }, [])

  const register = useCallback(
    (name: string, email: string, password: string, role: "customer" | "admin") => {
      const existing = getUserByEmail(email)
      if (existing) return { success: false, error: "An account with this email already exists" }
      const newUser = createUser({ name, email, password, role })
      setUser(newUser)
      setCurrentUser(newUser)
      return { success: true }
    },
    []
  )

  const logout = useCallback(() => {
    storeLogout()
    setUser(null)
  }, [])

  const refreshUser = useCallback(() => {
    if (!user) return
    const fresh = getUserByEmail(user.email)
    if (fresh) {
      setUser(fresh)
      setCurrentUser(fresh)
    }
  }, [user])

  const updatePoints = useCallback(
    (points: number) => {
      if (!user) return
      const updated = updateUser(user.id, {
        rewardPoints: user.rewardPoints + points,
      })
      if (updated) {
        setUser(updated)
        setCurrentUser(updated)
      }
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, updatePoints }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
