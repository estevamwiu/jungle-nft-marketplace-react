
import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { useNFTs } from "@/features/nft/hooks/use.nfts"
import { NFTCard } from "@/features/nft/components/NFTCard"
import { NFTFilters } from "@/features/nft/components/NFTFilters"


export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sortOrder, setSortOrder] = useState("default")

  const {
    data: nfts = [],
    isPending,
    isError,
    refetch,
  } = useNFTs()

  const categories = useMemo(() => {
    return [...new Set(nfts.map((nft) => nft.category))]
  }, [nfts])

  const filteredNFTs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    const result = nfts.filter((nft) => {
      const matchesSearch = nft.name
        .toLowerCase()
        .includes(normalizedSearch)

      const matchesCategory =
        category === "all" ||
        nft.category === category

      return matchesSearch && matchesCategory
    })

    switch (sortOrder) {
      case "price-asc":
        return result.sort((a, b) => a.price - b.price)

      case "price-desc":
        return result.sort((a, b) => b.price - a.price)

      case "name":
        return result.sort((a, b) =>
          a.name.localeCompare(b.name)
        )

      default:
        return result
    }
  }, [nfts, search, category, sortOrder])

  if (isPending) {
    return (
      <div className="py-20 text-center">
        <p>Carregando NFTs...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-red-400">
          Não foi possível carregar os NFTs.
        </p>

        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-violet-600 px-4 py-2 text-white"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <section className="py-10">
      <h1 className="mb-2 text-3xl font-bold">
        Explore NFTs
      </h1>

      <p className="mb-8 text-slate-400">
        Descubra NFTs exclusivos no marketplace.
      </p>

      <NFTFilters
        search={search}
        category={category}
        sortOrder={sortOrder}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onSortChange={setSortOrder}
      />

      <p className="mb-6 text-sm text-slate-400">
        {filteredNFTs.length} NFT(s) encontrado(s)
      </p>

      {filteredNFTs.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-slate-400">
            Nenhum NFT encontrado.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("")
              setCategory("all")
              setSortOrder("default")
            }}
            className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-white"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNFTs.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}
    </section>
  )
}
