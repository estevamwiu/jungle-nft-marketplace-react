
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
    <div className="mb-8 grid gap-4 md:grid-cols-3">
      <input
        type="text"
        placeholder="Buscar NFTs..."
        value={search}
        onChange={(event) =>
          onSearchChange(event.target.value)
        }
        className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-violet-500"
      />

      <select
        value={category}
        onChange={(event) =>
          onCategoryChange(event.target.value)
        }
        className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white"
      >
        <option value="all">Todas as categorias</option>

        {categories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        value={sortOrder}
        onChange={(event) =>
          onSortChange(event.target.value)
        }
        className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white"
      >
        <option value="default">Ordenação padrão</option>
        <option value="price-asc">Menor preço</option>
        <option value="price-desc">Maior preço</option>
        <option value="name">Nome (A-Z)</option>
      </select>
    </div>
  )
}
