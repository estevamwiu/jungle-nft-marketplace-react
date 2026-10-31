
import { api } from "@/lib/api/axios"

import type {
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types"

export interface LoginResponse {
  user: User
  token: string
}

export interface RegisterResponse {
  user: User
  message: string
}

export async function loginRequest(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    "/auth/login",
    credentials
  )

  return response.data
}

export async function getCurrentUser(
  token: string
): Promise<User> {
  const response = await api.get<{ user: User }>(
    "/auth/me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return response.data.user
}

export async function logoutRequest(
  token: string
): Promise<void> {
  await api.post(
    "/auth/logout",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}

export async function registerRequest(
  credentials: RegisterCredentials
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>(
    "/auth/register",
    credentials
  )

  return response.data
}
