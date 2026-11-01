export type EthAmount = string

export interface NFT {
  id: string
  name: string
  description: string
  image: string
  price: EthAmount
  creator: string
  category: string
  available: boolean
  availableQuantity: number
}

export type NFTSortOrder =
  | "default"
  | "recent"
  | "price-asc"
  | "price-desc"
  | "name"

export interface NFTCatalogQuery {
  q: string
  category: string
  sort: NFTSortOrder
  min?: EthAmount
  max?: EthAmount
  page: number
  pageSize?: number
}

export interface NFTCatalogResponse {
  items: NFT[]
  featured: NFT[]
  categories: Array<{ name: string; count: number }>
  priceRange: { min: EthAmount; max: EthAmount }
  total: number
  allTotal: number
  page: number
  pageSize: number
  totalPages: number
}
