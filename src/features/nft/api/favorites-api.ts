import { api } from "@/lib/api/axios"

export async function getFavorites(
  token: string,
  signal?: AbortSignal
): Promise<string[]> {
  const response = await api.get<string[]>("/favorites", {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  return response.data
}

export async function addFavorite(
  nftId: string,
  token: string
): Promise<string[]> {
  const response = await api.put<string[]>(
    `/favorites/${encodeURIComponent(nftId)}`,
    undefined,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  return response.data
}

export async function removeFavorite(
  nftId: string,
  token: string
): Promise<string[]> {
  const response = await api.delete<string[]>(
    `/favorites/${encodeURIComponent(nftId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  return response.data
}
