
import { Search, SlidersHorizontal, ArrowDownUp } from "lucide-react"

interface NFTFiltersProps {
  search: string
  category: string
  sortOrder: string
  categories: string[]
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onSortChange: (value: string) => void
}

export function NFTFilters({
  search,
  category,
  sortOrder,
  categories,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: NFTFiltersProps) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      <div className="space-y-2">
        <label
          htmlFor="nft-search"
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-kurio-muted"
        >
          <Search size={13} />
          Buscar NFTs
        </label>

        <div className="relative">
          <Search
            size={17}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-kurio-muted"
          />

          <input
            id="nft-search"
            type="search"
            autoComplete="off"
            placeholder="Nome do NFT..."
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            className="h-12 w-full border border-[#493026] bg-kurio-bg pl-11 pr-4 text-sm text-kurio-text outline-none transition-colors placeholder:text-kurio-muted/70 focus:border-kurio-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="nft-category"
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-kurio-muted"
        >
          <SlidersHorizontal size={13} />
          Categoria
        </label>

        <select
          id="nft-category"
          autoComplete="off"
          value={category}
          onChange={(event) =>
            onCategoryChange(event.target.value)
          }
          className="h-12 w-full border border-[#493026] bg-kurio-bg px-4 text-sm text-kurio-text outline-none transition-colors focus:border-kurio-primary"
        >
          <option value="all">
            Todas as categorias
          </option>

          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="nft-sort"
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-kurio-muted"
        >
          <ArrowDownUp size={13} />
          Ordenar por
        </label>

        <select
          id="nft-sort"
          autoComplete="off"
          value={sortOrder}
          onChange={(event) =>
            onSortChange(event.target.value)
          }
          className="h-12 w-full border border-[#493026] bg-kurio-bg px-4 text-sm text-kurio-text outline-none transition-colors focus:border-kurio-primary"
        >
          <option value="default">
            Ordenação padrão
          </option>

          <option value="price-asc">
            Menor preço
          </option>

          <option value="price-desc">
            Maior preço
          </option>

          <option value="name">
            Nome (A-Z)
          </option>
        </select>
      </div>
    </div>
  )
}
