
import { api } from "@/lib/api/axios"
import type { NFT } from "../types"


export async function getNFTById(
  id: string,
  signal?: AbortSignal
): Promise<NFT> {
  const response = await api.get<NFT>(
    `/nfts/${encodeURIComponent(id)}`,
    { signal }
  )

  return response.data
}
