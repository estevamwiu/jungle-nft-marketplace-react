
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { getNFTs } from "../api/get-nfts"
import type { NFTCatalogQuery } from "../types"

const allNFTsQuery: NFTCatalogQuery = {
  q: "",
  category: "all",
  sort: "default",
  page: 1,
  pageSize: 100,
}

export function useNFTs() {
  return useQuery({
    queryKey: ["nfts"],
    queryFn: async ({ signal }) =>
      (await getNFTs(allNFTsQuery, signal)).items,
  })
}

export function useNFTCatalog(query: NFTCatalogQuery) {
  return useQuery({
    queryKey: ["nft-catalog", query],
    queryFn: ({ signal }) => getNFTs(query, signal),
    placeholderData: keepPreviousData,
  })
}
