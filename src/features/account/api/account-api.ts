import { api } from "@/lib/api/axios"
import type {
  ProfileData,
  StoredWallets,
} from "../types"

export async function getProfile(
  token: string,
  signal?: AbortSignal
): Promise<ProfileData> {
  const response = await api.get<ProfileData>("/profile", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  return response.data
}

export async function saveProfile(
  profile: ProfileData,
  token: string
): Promise<ProfileData> {
  const response = await api.put<ProfileData>("/profile", profile, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return response.data
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  token: string
): Promise<void> {
  await api.patch(
    "/profile/password",
    { currentPassword, newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  )
}

export async function getWallets(
  token: string,
  signal?: AbortSignal
): Promise<StoredWallets> {
  const response = await api.get<StoredWallets>("/wallets", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  return response.data
}

export async function saveWallets(
  wallets: StoredWallets,
  token: string
): Promise<StoredWallets> {
  const response = await api.put<StoredWallets>("/wallets", wallets, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return response.data
}
