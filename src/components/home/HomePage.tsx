import { useEffect, useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight } from "lucide-react"

import { useNFTCatalog } from "@/features/nft/hooks/use.nfts"
import { NFTCard } from "@/features/nft/components/NFTCard"
import { PromotionalBanners } from "@/components/home/PromotionalBanners"
import { MintingJournal } from "@/components/home/MintingJournal"
import type {
  EthAmount,
  NFTNetwork,
  NFTSortOrder,
} from "@/features/nft/types"
import { compareEth, formatEth } from "@/lib/money"

const tabs: { label: string; sort: NFTSortOrder }[] = [
  { label: "Todos os NFTs", sort: "default" },
  { label: "Novos lançamentos", sort: "recent" },
  { label: "Em alta", sort: "price-desc" },
]

const collectionFilters = [
  { value: "Digital Art", label: "Arte digital" },
  { value: "Photography", label: "Fotografia" },
  { value: "Music", label: "Música" },
  { value: "3D Art", label: "Arte 3D" },
  { value: "Collectibles", label: "Colecionáveis" },
  { value: "Generative", label: "Generativa" },
  { value: "Games", label: "Jogos" },
  { value: "Subscriptions", label: "Assinaturas" },
  { value: "Utility", label: "Utilidade" },
] as const

const networkFilters: NFTNetwork[] = [
  "Ethereum",
  "Polygon",
  "Solana",
]

interface CatalogFilters {
  q: string
  category: string
  network: NFTNetwork | "all"
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
    network: catalog.network,
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  function scrollToMarketplace() {
    document.getElementById("marketplace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  function changeCategory(value: string) {
    onCatalogChange({ category: value, page: 1 })
  }

  function changeNetwork(value: NFTNetwork | "all") {
    onCatalogChange({
      network:
        catalog.network === value && value !== "all" ? "all" : value,
      page: 1,
    })
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
      network: "all",
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
      <section className="relative mt-5 grid min-h-[220px] items-center gap-10 overflow-hidden rounded-xl border border-[#493026] bg-kurio-surface px-5 py-5 sm:min-h-[250px] lg:min-h-0 lg:grid-cols-2 lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-12">
        <div className="relative z-10 w-[68%] max-w-xl lg:w-full">
          <p className="text-[10px] text-kurio-text lg:text-xs">
            Bem-vindo à Kurio
          </p>

          <h1 className="mt-4 text-[1.4rem] font-bold uppercase leading-[1.2] text-kurio-text sm:text-3xl lg:mt-5 lg:text-[43px] lg:leading-[70px]">
            Seja dono da cultura digital
          </h1>

          <p className="mt-3 max-w-md text-[10px] leading-4 text-kurio-muted sm:text-xs lg:mt-5 lg:text-sm lg:leading-6">
            Descubra NFTs selecionados de criadores emergentes e
            consagrados. Colecione arte digital rara, apoie artistas e
            tenha uma parte da cultura da internet.
          </p>

          <button
            type="button"
            onClick={scrollToMarketplace}
            className="mt-4 rounded bg-kurio-primary px-4 py-2 text-[10px] font-bold uppercase text-kurio-bg transition-colors hover:bg-[#e6a15f] lg:mt-7 lg:px-6 lg:py-3 lg:text-xs"
          >
            Explorar
          </button>

        </div>

        <div className="absolute inset-y-0 right-0 w-[52%] lg:relative lg:inset-auto lg:w-full lg:justify-self-end">
          {heroNFT ? (
            <div className="relative h-full w-full lg:mx-auto lg:aspect-square lg:h-auto lg:max-w-[450px] lg:ml-auto lg:mr-0">
              <Link
                to="/nft/$id"
                params={{ id: heroNFT.id }}
                className="block h-full w-full overflow-hidden bg-[#35221a] lg:aspect-square lg:rounded-2xl"
              >
                <img
                  src={heroNFT.image}
                  alt={`${heroNFT.name} em destaque`}
                  fetchPriority="high"
                  className="h-full w-full object-cover object-[center_30%]"
                />
              </Link>

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-kurio-surface via-kurio-surface/25 to-transparent lg:hidden"
              />

              {featuredSlides.length > 1 && (
                <div
                  role="group"
                  aria-label="Destaques da página inicial"
                  className="absolute bottom-3 right-3 flex justify-center gap-1 lg:static lg:mt-4 lg:gap-2"
                >
                  {featuredSlides.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-label={`Mostrar destaque ${item.name}`}
                      aria-current={index === slide}
                      onClick={() => setSlide(index)}
                      className="flex h-5 w-5 items-center justify-center rounded lg:h-6 lg:w-6"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          index === slide
                            ? "bg-kurio-primary"
                            : "bg-kurio-primary/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="skeleton-shimmer h-full w-full max-w-[450px] bg-kurio-surface lg:aspect-square lg:h-auto lg:rounded-2xl" />
          )}
        </div>
      </section>

      <section id="marketplace" className="scroll-mt-24 py-10">
        {isPending ? (
          <div
            role="status"
            className="grid gap-12 lg:grid-cols-[310px_minmax(0,1fr)]"
          >
            <span className="sr-only">Carregando NFTs...</span>

            <aside aria-hidden="true">
              <div className="space-y-5 bg-kurio-surface px-5 py-5">
                <div className="skeleton-shimmer h-10 bg-kurio-bg" />
                <div className="skeleton-shimmer h-5 w-28 bg-kurio-bg" />
                <div className="space-y-3">
                  {Array.from({ length: 7 }, (_, index) => (
                    <div
                      key={index}
                      className="skeleton-shimmer h-5 bg-kurio-bg"
                    />
                  ))}
                </div>
                <div className="skeleton-shimmer mt-8 h-5 w-36 bg-kurio-bg" />
                <div className="space-y-4">
                  <div className="skeleton-shimmer h-1 bg-kurio-bg" />
                  <div className="skeleton-shimmer h-1 bg-kurio-bg" />
                  <div className="skeleton-shimmer h-10 bg-kurio-bg" />
                </div>
              </div>
              <div className="skeleton-shimmer mt-8 aspect-[4/4.3] bg-kurio-surface" />
            </aside>

            <div className="min-w-0" aria-hidden="true">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-6">
                  <div className="skeleton-shimmer h-5 w-28 bg-kurio-surface" />
                  <div className="skeleton-shimmer h-5 w-32 bg-kurio-surface" />
                  <div className="skeleton-shimmer h-5 w-16 bg-kurio-surface" />
                </div>
                <div className="skeleton-shimmer h-5 w-44 bg-kurio-surface" />
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-7 sm:gap-y-10 xl:grid-cols-3">
                {Array.from({ length: 9 }, (_, index) => (
                  <div key={index}>
                    <div className="skeleton-shimmer bg-kurio-surface px-4 pb-8 pt-5">
                      <div className="skeleton-shimmer aspect-square rounded-xl bg-[#35221a]" />
                    </div>
                    <div className="skeleton-shimmer mt-3 h-5 w-3/4 bg-kurio-surface" />
                    <div className="skeleton-shimmer mt-1 h-5 w-1/3 bg-kurio-surface" />
                  </div>
                ))}
              </div>

              <div className="mt-12 flex justify-end gap-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={index}
                    className="skeleton-shimmer h-7 w-7 bg-kurio-surface"
                  />
                ))}
              </div>
            </div>
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
              <button
                type="button"
                aria-expanded={mobileFiltersOpen}
                aria-controls="marketplace-filters"
                onClick={() => setMobileFiltersOpen((open) => !open)}
                className="mb-4 flex w-full items-center justify-between border border-[#493026] bg-kurio-surface px-4 py-3 text-sm font-bold text-kurio-text lg:hidden"
              >
                Filtros do catálogo
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`transition-transform ${
                    mobileFiltersOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                id="marketplace-filters"
                className={`${
                  mobileFiltersOpen ? "block" : "hidden lg:block"
                } bg-kurio-surface px-5 py-5`}
              >
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

                  {collectionFilters.map((filter) => {
                    const count =
                      categories.find(
                        (item) => item.name === filter.value
                      )?.count ?? 0

                    return (
                      <li key={filter.value}>
                        <button
                          type="button"
                          aria-pressed={category === filter.value}
                          onClick={() => changeCategory(filter.value)}
                          className={categoryButton(
                            category === filter.value
                          )}
                        >
                          <span>{filter.label}</span>
                          <span className="text-kurio-text">{count}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>

                <h2 className="mt-8 text-base font-bold text-kurio-text">
                  Faixa de preço
                </h2>

                <div className="mt-4 space-y-3 px-2">
                  <label className="block">
                    <span className="sr-only">Preço mínimo em ETH</span>
                    <input
                      type="range"
                      name="minPrice"
                      autoComplete="off"
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
                      name="maxPrice"
                      autoComplete="off"
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
                    className="rounded bg-kurio-primary px-5 py-2 text-sm font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
                  >
                    Aplicar
                  </button>
                </div>

                <h2 className="mt-8 text-base font-bold text-kurio-text">
                  Rede
                </h2>

                <ul className="mt-3 px-2">
                  {networkFilters.map((network) => (
                    <li key={network}>
                      <button
                        type="button"
                        aria-pressed={catalog.network === network}
                        onClick={() => changeNetwork(network)}
                        className={categoryButton(
                          catalog.network === network
                        )}
                      >
                        {network}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {offerNFT && (
                <Link
                  to="/nft/$id"
                  params={{ id: offerNFT.id }}
                  className="mt-8 hidden bg-[#2a1a10] pt-5 lg:block"
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
                        className={`rounded-none border-b-2 pb-1 text-sm transition-colors hover:text-kurio-primary focus-visible:outline-2 focus-visible:outline-kurio-primary ${
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
                    autoComplete="off"
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
                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-7 sm:gap-y-10 xl:grid-cols-3">
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
                              ? "rounded bg-kurio-primary text-kurio-bg"
                              : "rounded border border-[#704b35] text-kurio-text hover:border-kurio-primary"
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
                        className="flex h-7 w-7 items-center justify-center rounded border border-[#704b35] text-kurio-text hover:border-kurio-primary disabled:opacity-40"
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
