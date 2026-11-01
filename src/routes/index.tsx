
import { createFileRoute } from "@tanstack/react-router"
import { HomePage } from "@/components/home/HomePage"
import type { EthAmount, NFTNetwork } from "@/features/nft/types"
import {
  compareEth,
  formatEth,
  isEthAmount,
} from "@/lib/money"

type SortOrder =
  | "default"
  | "recent"
  | "price-asc"
  | "price-desc"
  | "name"

interface CatalogSearch {
  q?: string
  category?: string
  network?: NFTNetwork
  sort?: SortOrder
  min?: EthAmount
  max?: EthAmount
  page?: number
}

const sortOrders: SortOrder[] = [
  "default",
  "recent",
  "price-asc",
  "price-desc",
  "name",
]

function parsePrice(value: unknown): EthAmount | undefined {
  const parsed =
    typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : typeof value === "string"
        ? value
        : null

  return isEthAmount(parsed) ? formatEth(parsed) : undefined
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): CatalogSearch => {
    const min = parsePrice(search.min)
    const max = parsePrice(search.max)
    const hasPriceRange =
      min !== undefined && max !== undefined

    return {
      q:
        typeof search.q === "string"
          ? search.q.slice(0, 100)
          : "",
      category:
        typeof search.category === "string"
          ? search.category
          : "all",
      network:
        search.network === "Ethereum" ||
        search.network === "Polygon" ||
        search.network === "Solana"
          ? search.network
          : undefined,
      sort:
        sortOrders.find((sort) => sort === search.sort) ??
        "default",
      min:
        hasPriceRange && compareEth(min, max) <= 0
          ? min
          : hasPriceRange
            ? max
            : undefined,
      max:
        hasPriceRange && compareEth(min, max) <= 0
          ? max
          : hasPriceRange
            ? min
            : undefined,
      page:
        typeof search.page === "number" ||
        typeof search.page === "string"
          ? Math.max(
              1,
              Math.min(1000, Math.floor(Number(search.page)) || 1)
            )
          : 1,
    }
  },
  component: HomeRoute,
})

function HomeRoute() {
  const filters = Route.useSearch()
  const navigate = Route.useNavigate()

  return (
    <HomePage
      catalog={{
        q: filters.q ?? "",
        category: filters.category ?? "all",
        network: filters.network ?? "all",
        sort: filters.sort ?? "default",
        min: filters.min,
        max: filters.max,
        page: filters.page ?? 1,
      }}
      onCatalogChange={(update) =>
        void navigate({
          replace: update.q !== undefined,
          search: (previous) => {
            const next = { ...previous, ...update }

            return {
              q: next.q || undefined,
              category:
                (next.category ?? "all") === "all"
                  ? undefined
                  : next.category,
              network:
                next.network === "all" ? undefined : next.network,
              sort:
                (next.sort ?? "default") === "default"
                  ? undefined
                  : next.sort,
              min: next.min,
              max: next.max,
              page: (next.page ?? 1) === 1 ? undefined : next.page,
            }
          },
        })
      }
    />
  )
}
