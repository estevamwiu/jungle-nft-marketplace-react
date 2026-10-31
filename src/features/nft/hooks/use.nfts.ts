
import { useQuery } from "@tanstack/react-query"
import { getNFTs } from "../api/get-nfts"

export function useNFTs() {
  return useQuery({
    queryKey: ["nfts"],
    queryFn: getNFTs,
  })
}
