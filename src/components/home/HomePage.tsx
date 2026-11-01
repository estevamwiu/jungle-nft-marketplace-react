
import { useMemo, useState } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"

import { useNFTs } from "@/features/nft/hooks/use.nfts"
import { NFTCard } from "@/features/nft/components/NFTCard"
import { PromotionalBanners } from "@/components/home/PromotionalBanners"
import { MintingJournal } from "@/components/home/MintingJournal"

export function HomePage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sortOrder, setSortOrder] = useState("default")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

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
        category === "all" || nft.category === category

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

  function scrollToMarketplace() {
    document.getElementById("marketplace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  function clearFilters() {
    setSearch("")
    setCategory("all")
    setSortOrder("default")
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    category !== "all" ||
    sortOrder !== "default"

  return (
    <div className="w-full">
      <section className="relative overflow-hidden border-b border-[#493026] py-12 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[#d58d49]/10 blur-[100px]" />

        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#704b35]/20 blur-[100px]" />

        <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-start">
            <div className="mb-7 inline-flex items-center gap-2 border border-[#704b35] bg-[#281813] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-kurio-primary">
              <Sparkles size={14} />
              O futuro da arte digital
            </div>

            <h1 className="max-w-2xl text-4xl font-black uppercase leading-[1.12] tracking-[-0.06em] text-kurio-text sm:text-5xl lg:text-[3.5rem] xl:text-[4rem]">
              Seja dono do
              <span className="block text-kurio-primary">
                futuro da
              </span>
              arte digital.
            </h1>

            <p className="mt-7 max-w-lg text-sm leading-7 text-kurio-muted sm:text-base">
              Descubra, colecione e explore NFTs únicos de artistas
              e criadores digitais. Sua próxima descoberta começa aqui.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={scrollToMarketplace}
                className="inline-flex min-h-12 items-center justify-center gap-3 bg-kurio-primary px-7 py-3 text-sm font-bold uppercase tracking-wide text-kurio-bg transition-colors hover:bg-[#e6a15f]"
              >
                Explorar NFTs
                <ArrowUpRight size={18} />
              </button>

              <button
                type="button"
                onClick={scrollToMarketplace}
                className="inline-flex min-h-12 items-center justify-center gap-3 border border-[#704b35] px-6 py-3 text-sm font-bold uppercase tracking-wide text-kurio-text transition-colors hover:border-kurio-primary hover:text-kurio-primary"
              >
                Ver coleção
                <ArrowDownRight size={18} />
              </button>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-8 border-t border-[#493026] pt-7 sm:gap-12">
              <div>
                <p className="text-2xl font-bold text-kurio-text">
                  {isPending ? "..." : nfts.length}
                </p>

                <p className="mt-1 text-xs uppercase tracking-wide text-kurio-muted">
                  NFTs no catálogo
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold text-kurio-text">
                  {isPending
                    ? "..."
                    : new Set(nfts.map((nft) => nft.creator)).size}
                </p>

                <p className="mt-1 text-xs uppercase tracking-wide text-kurio-muted">
                  Criadores
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -right-4 -top-4 h-full w-full border border-[#704b35] sm:-right-6 sm:-top-6" />

            <div className="relative overflow-hidden border border-[#493026] bg-kurio-surface p-3 sm:p-4">
              <div className="relative aspect-[4/4.5] overflow-hidden bg-[#35221a]">
                <img
                  src="/images/sage-nomad.png"
                  alt="Arte digital Sage Nomad em destaque"
                  className="h-full w-full object-cover"
                />

                <div className="absolute left-4 top-4 bg-kurio-primary px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-kurio-bg">
                  Em destaque
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 px-1 pb-1 pt-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-kurio-muted">
                    Coleção Jungle
                  </p>

                  <h2 className="mt-2 text-lg font-bold text-kurio-text">
                    Jungle Ape #001
                  </h2>
                </div>

                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-kurio-muted">
                    Preço
                  </p>

                  <p className="mt-2 text-lg font-bold text-kurio-primary">
                    0.25 ETH
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-3 border border-[#704b35] bg-kurio-bg px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-kurio-primary sm:-left-6">
              Arte sem limites
            </div>
          </div>
        </div>
      </section>

      <section
        id="marketplace"
        className="scroll-mt-24 py-14 sm:py-20"
      >
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-kurio-primary">
              <span className="h-px w-8 bg-kurio-primary" />
              Descubra
            </div>

            <h2 className="text-3xl font-black uppercase tracking-tight text-kurio-text sm:text-4xl">
              Explore o marketplace
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-kurio-muted">
              Encontre obras digitais exclusivas e descubra novos criadores.
            </p>
          </div>

          <span className="text-xs uppercase tracking-wider text-kurio-muted">
            Curadoria Kurio
          </span>
        </div>

        {isPending ? (
          <div
            role="status"
            className="border border-[#493026] bg-kurio-surface px-6 py-20 text-center text-kurio-muted"
          >
            Carregando NFTs...
          </div>
        ) : isError ? (
          <div className="border border-red-900/50 bg-red-950/20 px-6 py-16 text-center">
            <p className="mb-5 text-red-400">
              Não foi possível carregar os NFTs.
            </p>

            <button
              type="button"
              onClick={() => void refetch()}
              className="bg-kurio-primary px-5 py-3 text-sm font-bold text-kurio-bg hover:bg-[#e6a15f]"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <button
                type="button"
                onClick={() =>
                  setShowMobileFilters((current) => !current)
                }
                aria-expanded={showMobileFilters}
                aria-controls="marketplace-filters"
                className="flex w-full items-center justify-between border border-[#493026] bg-kurio-surface px-5 py-4 text-sm font-bold uppercase tracking-wide text-kurio-text lg:hidden"
              >
                <span className="flex items-center gap-3">
                  <SlidersHorizontal
                    size={18}
                    className="text-kurio-primary"
                  />
                  Filtros
                </span>

                <span className="text-kurio-primary">
                  {showMobileFilters ? "−" : "+"}
                </span>
              </button>

              <aside
                id="marketplace-filters"
                className={`${showMobileFilters ? "block" : "hidden"} border border-[#493026] bg-kurio-surface p-5 lg:sticky lg:top-24 lg:block lg:self-start`}
              >
                <div className="mb-6 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-kurio-text">
                    <SlidersHorizontal
                      size={17}
                      className="text-kurio-primary"
                    />
                    Filtros
                  </h3>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase text-kurio-primary hover:text-[#e6a15f]"
                    >
                      <RotateCcw size={12} />
                      Limpar
                    </button>
                  )}
                </div>

                <div className="border-t border-[#493026] pt-6">
                  <label
                    htmlFor="marketplace-search"
                    className="mb-3 block text-xs font-bold uppercase tracking-wider text-kurio-text"
                  >
                    Buscar NFT
                  </label>

                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kurio-muted"
                    />

                    <input
                      id="marketplace-search"
                      type="search"
                      placeholder="Nome do NFT..."
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      className="h-11 w-full border border-[#493026] bg-kurio-bg pl-10 pr-3 text-xs text-kurio-text outline-none placeholder:text-kurio-muted/70 focus:border-kurio-primary"
                    />
                  </div>
                </div>

                <div className="mt-7 border-t border-[#493026] pt-6">
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-kurio-text">
                    Categorias
                  </h4>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setCategory("all")}
                      aria-pressed={category === "all"}
                      className={`flex w-full items-center justify-between px-3 py-3 text-left text-xs transition-colors ${
                        category === "all"
                          ? "bg-kurio-primary text-kurio-bg"
                          : "text-kurio-muted hover:bg-kurio-bg hover:text-kurio-text"
                      }`}
                    >
                      Todas as categorias
                      <span>{nfts.length}</span>
                    </button>

                    {categories.map((item) => {
                      const count = nfts.filter(
                        (nft) => nft.category === item
                      ).length

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCategory(item)}
                          aria-pressed={category === item}
                          className={`flex w-full items-center justify-between px-3 py-3 text-left text-xs transition-colors ${
                            category === item
                              ? "bg-kurio-primary text-kurio-bg"
                              : "text-kurio-muted hover:bg-kurio-bg hover:text-kurio-text"
                          }`}
                        >
                          <span>{item}</span>
                          <span>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-7 border-t border-[#493026] pt-6">
                  <label
                    htmlFor="marketplace-sort"
                    className="mb-3 block text-xs font-bold uppercase tracking-wider text-kurio-text"
                  >
                    Ordenar por
                  </label>

                  <select
                    id="marketplace-sort"
                    value={sortOrder}
                    onChange={(event) =>
                      setSortOrder(event.target.value)
                    }
                    className="h-11 w-full border border-[#493026] bg-kurio-bg px-3 text-xs text-kurio-text outline-none focus:border-kurio-primary"
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

                <div className="mt-7 border border-[#704b35] bg-kurio-bg p-5">
                  <Sparkles
                    size={22}
                    className="mb-4 text-kurio-primary"
                  />

                  <p className="text-sm font-bold uppercase leading-6 text-kurio-text">
                    Descubra sua próxima obra digital.
                  </p>

                  <p className="mt-3 text-xs leading-6 text-kurio-muted">
                    Explore coleções e encontre NFTs únicos na Kurio.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      clearFilters()
                      scrollToMarketplace()
                    }}
                    className="mt-5 flex items-center gap-2 text-xs font-bold uppercase text-kurio-primary hover:text-[#e6a15f]"
                  >
                    Explorar todos
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </aside>
            </div>

            <div className="min-w-0">
              <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#493026] pb-5 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-bold uppercase text-kurio-text">
                    Todos os NFTs
                  </h3>

                  <p className="mt-2 text-xs text-kurio-muted">
                    {filteredNFTs.length} NFT(s) encontrado(s)
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-kurio-primary">
                  <Sparkles size={15} />
                  Coleção digital
                </div>
              </div>

              {filteredNFTs.length === 0 ? (
                <div className="border border-[#493026] bg-kurio-surface px-6 py-16 text-center">
                  <p className="text-kurio-muted">
                    Nenhum NFT encontrado.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 bg-kurio-primary px-5 py-3 text-sm font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredNFTs.map((nft) => (
                    <NFTCard key={nft.id} nft={nft} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
      <PromotionalBanners />
      <MintingJournal />
    </div>
  )
}
