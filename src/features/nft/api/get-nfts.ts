import { api } from "@/lib/api/axios"
import type { NFT } from "../types"

export async function getNFTs(): Promise<NFT[]> {
  const response = await api.get<NFT[]>("/nfts")

  return response.data
}
