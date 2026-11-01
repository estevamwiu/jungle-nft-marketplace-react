import { createContext } from "react"

import type { LoginCredentials, User } from "../types"

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => Promise<void>
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(undefined)
