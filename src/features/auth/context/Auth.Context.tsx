
import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"

import type { User, LoginCredentials } from "../types"

import {
  loginRequest,
  getCurrentUser,
  logoutRequest,
} from "../api/auth-api"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => Promise<void>
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = "jungle-auth-token"

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const previousUserId = useRef<string | null>(null)

  useEffect(() => {
    const currentUserId = user?.id ?? null
    const previousId = previousUserId.current

    if (previousId && previousId !== currentUserId) {
      const privateQueryKeys = new Set([
        "favorites",
        "profile",
        "wallets",
        "order",
        "pending-order",
        "checkout-terminal-order",
      ])

      queryClient.removeQueries({
        predicate: (query) =>
          privateQueryKeys.has(String(query.queryKey[0])),
      })
    }

    previousUserId.current = currentUserId
  }, [queryClient, user?.id])

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const token = localStorage.getItem(STORAGE_KEY)

      if (!token) {
        if (active) setIsLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser(token)

        if (active) {
          setUser(currentUser)
        }
      } catch {
        if (active) {
          localStorage.removeItem(STORAGE_KEY)
          setUser(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [])

  async function login(
    credentials: LoginCredentials
  ): Promise<boolean> {
    try {
      const response = await loginRequest(credentials)

      localStorage.setItem(STORAGE_KEY, response.token)
      setUser(response.user)

      return true
    } catch {
      return false
    }
  }

  async function logout(): Promise<void> {
    const token = localStorage.getItem(STORAGE_KEY)

    try {
      if (token) {
        await logoutRequest(token)
      }
    } finally {
      localStorage.removeItem(STORAGE_KEY)
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
