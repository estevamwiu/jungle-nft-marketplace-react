import { useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, Search } from "lucide-react"

import { useNFTCatalog } from "@/features/nft/hooks/use.nfts"
import { NFTCard } from "@/features/nft/components/NFTCard"
import { PromotionalBanners } from "@/components/home/PromotionalBanners"
import { MintingJournal } from "@/components/home/MintingJournal"
import type {
  EthAmount,
  NFTSortOrder,
} from "@/features/nft/types"
import { compareEth, formatEth } from "@/lib/money"

const tabs: { label: string; sort: NFTSortOrder }[] = [
  { label: "Todos os NFTs", sort: "default" },
  { label: "Novos lançamentos", sort: "recent" },
  { label: "Em alta", sort: "price-desc" },
]

interface CatalogFilters {
  q: string
  category: string
  sort: NFTSortOrder
  min?: EthAmount
  max?: EthAmount
  page: number
}

interface HomePageProps {
  catalog: CatalogFilters
  onCatalogChange: (update: Partial<CatalogFilters>) => void
}

export function HomePage({
  catalog,
  onCatalogChange,
}: HomePageProps) {
  const { q: search, category, sort: sortOrder, min, max, page } =
    catalog
  const {
    data: catalogData,
    isPending,
    isError,
    isPlaceholderData,
    refetch,
  } = useNFTCatalog({
    q: search,
    category,
    sort: sortOrder,
    min,
    max,
    page,
  })
  const nfts = catalogData?.featured ?? []
  const categories = catalogData?.categories ?? []
  const bounds = catalogData?.priceRange ?? { min: "0", max: "0" }
  const [slide, setSlide] = useState(0)

  const appliedRange = useMemo<[EthAmount, EthAmount] | null>(
    () =>
      min !== undefined && max !== undefined ? [min, max] : null,
    [min, max]
  )
  const rangeKey = `${min ?? ""}:${max ?? ""}`
  const [draftRangeState, setDraftRangeState] = useState<{
    key: string
    range: [EthAmount, EthAmount] | null
  } | null>(null)
  const draftRange =
    draftRangeState?.key === rangeKey
      ? draftRangeState.range
      : appliedRange

  const draftMin = draftRange?.[0] ?? bounds.min
  const draftMax = draftRange?.[1] ?? bounds.max

  function setDraftRange(range: [EthAmount, EthAmount] | null) {
    setDraftRangeState({ key: rangeKey, range })
  }

  const filteredNFTs = catalogData?.items ?? []
  const totalPages = catalogData?.totalPages ?? 1
  const currentPage = catalogData?.page ?? page
  const serverPage = catalogData?.page
  const visibleNFTs = filteredNFTs

  useEffect(() => {
    if (
      !isPlaceholderData &&
      serverPage !== undefined &&
      serverPage !== page
    ) {
      onCatalogChange({ page: serverPage })
    }
  }, [isPlaceholderData, onCatalogChange, page, serverPage])

  const featuredSlides = nfts.slice(0, 3)
  const heroNFT = featuredSlides[slide] ?? featuredSlides[0]
  const offerNFT = nfts[1] ?? nfts[0]

  function scrollToMarketplace() {
    document.getElementById("marketplace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  // Toda mudança de filtro reinicia a paginação.
  function changeSearch(value: string) {
    onCatalogChange({ q: value, page: 1 })
  }

  function changeCategory(value: string) {
    onCatalogChange({ category: value, page: 1 })
  }

  function changeSort(value: string) {
    if (
      value === "default" ||
      value === "recent" ||
      value === "price-asc" ||
      value === "price-desc" ||
      value === "name"
    ) {
      onCatalogChange({ sort: value, page: 1 })
    }
  }

  function applyPrice() {
    onCatalogChange({
      min: draftMin,
      max: draftMax,
      page: 1,
    })
  }

  function clearFilters() {
    onCatalogChange({
      q: "",
      category: "all",
      sort: "default",
      min: undefined,
      max: undefined,
      page: 1,
    })
    setDraftRange(null)
  }

  const categoryButton = (active: boolean) =>
    `flex w-full items-center justify-between py-1.5 text-left text-sm transition-colors hover:text-kurio-primary ${
      active ? "font-bold text-kurio-primary" : "text-kurio-muted"
    }`

  return (
    <div className="w-full">
      <section className="grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-12">
        <div className="max-w-xl">
          <p className="text-xs text-kurio-text">Bem-vindo à Kurio</p>

          <h1 className="mt-5 text-4xl font-bold uppercase leading-[1.5] text-kurio-text lg:text-[2.75rem]">
            Seja dono do futuro da arte digital
          </h1>

          <p className="mt-5 max-w-md text-sm leading-6 text-kurio-muted">
            Descubra NFTs selecionados de criadores emergentes e
            consagrados. Colecione arte digital rara, apoie artistas e
            tenha uma parte da cultura da internet.
          </p>

          <button
            type="button"
            onClick={scrollToMarketplace}
            className="mt-7 bg-kurio-primary px-6 py-3 text-xs font-bold uppercase text-kurio-bg transition-colors hover:bg-[#e6a15f]"
          >
            Explorar
          </button>

          {featuredSlides.length > 1 && (
            <div
              role="group"
              aria-label="Destaques da página inicial"
              className="mt-10 flex gap-2"
            >
              {featuredSlides.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Mostrar destaque ${item.name}`}
                  aria-current={index === slide}
                  onClick={() => setSlide(index)}
                  className={`h-2.5 w-2.5 rounded-full ${
                    index === slide
                      ? "bg-kurio-primary"
                      : "bg-kurio-primary/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="justify-self-center lg:justify-self-end">
          {heroNFT ? (
            <Link
              to="/nft/$id"
              params={{ id: heroNFT.id }}
              className="block aspect-square w-full max-w-[450px] overflow-hidden rounded-2xl bg-[#35221a]"
            >
              <img
                src={heroNFT.image}
                alt={`${heroNFT.name} em destaque`}
                className="h-full w-full object-cover"
              />
            </Link>
          ) : (
            <div className="aspect-square w-full max-w-[450px] rounded-2xl bg-kurio-surface" />
          )}
        </div>
      </section>

      <section id="marketplace" className="scroll-mt-24 py-10">
        {isPending ? (
          <div
            role="status"
            className="bg-kurio-surface px-6 py-20 text-center text-sm text-kurio-muted"
          >
            Carregando NFTs...
          </div>
        ) : isError ? (
          <div className="border border-red-900/50 bg-red-950/20 px-6 py-16 text-center">
            <p className="mb-5 text-sm text-red-400">
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
          <div className="grid gap-12 lg:grid-cols-[310px_minmax(0,1fr)]">
            <aside aria-label="Filtros">
              <div className="bg-kurio-surface px-5 py-5">
                <label htmlFor="marketplace-search" className="sr-only">
                  Buscar NFT por nome
                </label>

                <div className="relative mb-6">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kurio-muted"
                  />

                  <input
                    id="marketplace-search"
                    type="search"
                    placeholder="Buscar NFT..."
                    value={search}
                    onChange={(event) => changeSearch(event.target.value)}
                    className="h-10 w-full border border-[#493026] bg-kurio-bg pl-9 pr-3 text-sm text-kurio-text outline-none placeholder:text-kurio-muted focus:border-kurio-primary"
                  />
                </div>

                <h2 className="text-base font-bold text-kurio-text">
                  Coleções
                </h2>

                <ul className="mt-3 px-2">
                  <li>
                    <button
                      type="button"
                      aria-pressed={category === "all"}
                      onClick={() => changeCategory("all")}
                      className={categoryButton(category === "all")}
                    >
                      <span>Todas</span>
                      <span className="text-kurio-text">
                        {catalogData?.allTotal ?? 0}
                      </span>
                    </button>
                  </li>

                  {categories.map((item) => (
                    <li key={item.name}>
                      <button
                        type="button"
                        aria-pressed={category === item.name}
                        onClick={() => changeCategory(item.name)}
                        className={categoryButton(
                          category === item.name
                        )}
                      >
                        <span>{item.name}</span>
                        <span className="text-kurio-text">{item.count}</span>
                      </button>
                    </li>
                  ))}
                </ul>

                <h2 className="mt-8 text-base font-bold text-kurio-text">
                  Faixa de preço
                </h2>

                <div className="mt-4 space-y-3 px-2">
                  <label className="block">
                    <span className="sr-only">Preço mínimo em ETH</span>
                    <input
                      type="range"
                      min={bounds.min}
                      max={bounds.max}
                      step="0.01"
                      value={draftMin}
                      onChange={(event) =>
                        setDraftRange([
                          compareEth(event.target.value, draftMax) < 0
                            ? event.target.value
                            : draftMax,
                          draftMax,
                        ])
                      }
                      className="h-1 w-full accent-[#d58d49]"
                    />
                  </label>

                  <label className="block">
                    <span className="sr-only">Preço máximo em ETH</span>
                    <input
                      type="range"
                      min={bounds.min}
                      max={bounds.max}
                      step="0.01"
                      value={draftMax}
                      onChange={(event) =>
                        setDraftRange([
                          draftMin,
                          compareEth(event.target.value, draftMin) > 0
                            ? event.target.value
                            : draftMin,
                        ])
                      }
                      className="h-1 w-full accent-[#d58d49]"
                    />
                  </label>

                  <p className="text-sm text-kurio-muted">
                    Preço: {formatEth(draftMin)} - {formatEth(draftMax)} ETH
                  </p>

                  <button
                    type="button"
                    onClick={applyPrice}
                    className="bg-kurio-primary px-4 py-2 text-sm font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
                  >
                    Aplicar
                  </button>
                </div>
              </div>

              {offerNFT && (
                <Link
                  to="/nft/$id"
                  params={{ id: offerNFT.id }}
                  className="mt-8 block bg-[#2a1a10] pt-5"
                >
                  <p className="px-5 text-xl font-bold uppercase text-kurio-primary">
                    NFT em destaque
                  </p>

                  <p className="mt-2 text-center font-bold uppercase text-kurio-text">
                    Oferta limitada
                  </p>

                  <img
                    src={offerNFT.image}
                    alt={offerNFT.name}
                    className="mt-3 aspect-[4/4.3] w-full rounded-2xl object-cover"
                  />
                </Link>
              )}
            </aside>

            <div className="min-w-0">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div
                  role="group"
                  aria-label="Atalhos de ordenação"
                  className="flex flex-wrap gap-6"
                >
                  {tabs.map((tab) => {
                    const active = sortOrder === tab.sort

                    return (
                      <button
                        key={tab.label}
                        type="button"
                        aria-pressed={active}
                        onClick={() => changeSort(tab.sort)}
                        className={`border-b-2 pb-1 text-sm transition-colors hover:text-kurio-primary ${
                          active
                            ? "border-kurio-primary font-bold text-kurio-primary"
                            : "border-transparent text-kurio-text"
                        }`}
                      >
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                <div className="relative flex items-center gap-1 text-sm text-kurio-text">
                  <label htmlFor="marketplace-sort">Ordenar por:</label>

                  <select
                    id="marketplace-sort"
                    value={sortOrder}
                    onChange={(event) =>
                      changeSort(event.target.value)
                    }
                    className="cursor-pointer appearance-none bg-transparent pr-6 text-sm text-kurio-text outline-none focus-visible:outline-2 focus-visible:outline-kurio-primary"
                  >
                    <option value="default" className="bg-kurio-bg">
                      Ordenação padrão
                    </option>
                    <option value="recent" className="bg-kurio-bg">
                      Listados recentemente
                    </option>
                    <option value="price-asc" className="bg-kurio-bg">
                      Menor preço
                    </option>
                    <option value="price-desc" className="bg-kurio-bg">
                      Maior preço
                    </option>
                    <option value="name" className="bg-kurio-bg">
                      Nome (A-Z)
                    </option>
                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-0"
                  />
                </div>
              </div>

              {filteredNFTs.length === 0 ? (
                <div className="bg-kurio-surface px-6 py-16 text-center">
                  <p className="text-sm text-kurio-muted">
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
                <>
                  <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleNFTs.map((nft) => (
                      <NFTCard key={nft.id} nft={nft} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <nav
                      aria-label="Paginação do catálogo"
                      className="mt-12 flex items-center justify-end gap-2"
                    >
                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1
                      ).map((number) => (
                        <button
                          key={number}
                          type="button"
                          aria-label={`Página ${number}`}
                          aria-current={
                            number === currentPage ? "page" : undefined
                          }
                          onClick={() =>
                            onCatalogChange({ page: number })
                          }
                          className={`h-7 w-7 text-sm font-bold ${
                            number === currentPage
                              ? "bg-kurio-primary text-kurio-bg"
                              : "border border-[#704b35] text-kurio-text hover:border-kurio-primary"
                          }`}
                        >
                          {number}
                        </button>
                      ))}

                      <button
                        type="button"
                        aria-label="Próxima página"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          onCatalogChange({ page: currentPage + 1 })
                        }
                        className="flex h-7 w-7 items-center justify-center border border-[#704b35] text-kurio-text hover:border-kurio-primary disabled:opacity-40"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </nav>
                  )}
                </>
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
