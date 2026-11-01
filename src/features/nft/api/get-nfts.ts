import { api } from "@/lib/api/axios"
import type {
  NFTCatalogQuery,
  NFTCatalogResponse,
} from "../types"

export async function getNFTs(
  query: NFTCatalogQuery,
  signal?: AbortSignal
): Promise<NFTCatalogResponse> {
  const response = await api.get<NFTCatalogResponse>("/nfts", {
    params: {
      q: query.q || undefined,
      category:
        query.category === "all" ? undefined : query.category,
      sort: query.sort === "default" ? undefined : query.sort,
      min: query.min,
      max: query.max,
      page: query.page,
      pageSize: query.pageSize,
    },
    signal,
  })

  return response.data
}
