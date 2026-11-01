
import { useEffect, useRef, useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { isAxiosError } from "axios"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  ZoomIn,
} from "lucide-react"

import { useNFT } from "@/features/nft/hooks/use.nft"
import { useNFTs } from "@/features/nft/hooks/use.nfts"
import { useCart } from "@/features/cart/hooks/use.cart"
import { useAuth } from "@/features/auth/hooks/use-auth"
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "@/features/nft/api/favorites-api"
import { formatEth, multiplyEth } from "@/lib/money"

export const Route = createFileRoute("/nft/$id")({
  component: NFTDetailsPage,
})

function NFTDetailsPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { addItem } = useCart()
  const { isAuthenticated, user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details")
  const [imageExpanded, setImageExpanded] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)
  const imageCloseButtonRef = useRef<HTMLButtonElement>(null)
  const token = localStorage.getItem("jungle-auth-token")
  const favoritesKey = ["favorites", user?.id]
  const favoritesQuery = useQuery({
    queryKey: favoritesKey,
    queryFn: ({ signal }) =>
      token
        ? getFavorites(token, signal)
        : Promise.reject(new Error("Sessão não encontrada.")),
    enabled: Boolean(isAuthenticated && user && token),
  })
  const favoriteMutation = useMutation({
    mutationFn: ({
      nftId,
      shouldAdd,
    }: {
      nftId: string
      shouldAdd: boolean
    }) => {
      if (!token) {
        throw new Error("Sessão não encontrada.")
      }

      return shouldAdd
        ? addFavorite(nftId, token)
        : removeFavorite(nftId, token)
    },
    onMutate: async ({ nftId, shouldAdd }) => {
      await queryClient.cancelQueries({ queryKey: favoritesKey })
      const previous =
        queryClient.getQueryData<string[]>(favoritesKey)
      queryClient.setQueryData<string[]>(favoritesKey, (current = []) =>
        shouldAdd
          ? [...new Set([...current, nftId])]
          : current.filter((favoriteId) => favoriteId !== nftId)
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favoritesKey, context.previous)
      } else {
        queryClient.removeQueries({
          queryKey: favoritesKey,
          exact: true,
        })
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: favoritesKey }),
  })
  const isFavorite = favoritesQuery.data?.includes(id) ?? false

  useEffect(() => {
    if (!imageExpanded) {
      return
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    imageCloseButtonRef.current?.focus()

    function handleDialogKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setImageExpanded(false)
      } else if (event.key === "Tab") {
        event.preventDefault()
        imageCloseButtonRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleDialogKeyDown)

    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown)
      previouslyFocused?.focus()
    }
  }, [imageExpanded])

  const {
    data: nft,
    isPending,
    isError,
    error,
    refetch,
  } = useNFT(id)

  const { data: allNFTs = [] } = useNFTs()

  if (isPending) {
    return (
      <section
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
      >
        <p className="text-sm text-kurio-muted">
          Carregando detalhes do NFT...
        </p>
      </section>
    )
  }

  if (isError) {
    const isNotFound =
      isAxiosError(error) && error.response?.status === 404

    return (
      <section className="py-24 text-center">
        <h1 className="text-2xl font-bold text-kurio-text">
          {isNotFound
            ? "NFT não encontrado"
            : "Erro ao carregar NFT"}
        </h1>

        <p className="mt-4 text-sm text-kurio-muted">
          {isNotFound
            ? "O NFT solicitado não existe."
            : "Não foi possível carregar os detalhes."}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {!isNotFound && (
            <button
              type="button"
              onClick={() => void refetch()}
              className="bg-kurio-primary px-5 py-3 text-sm font-bold text-kurio-bg"
            >
              Tentar novamente
            </button>
          )}

          <Link
            to="/"
            className="border border-[#704b35] px-5 py-3 text-sm text-kurio-text transition-colors hover:border-kurio-primary"
          >
            Voltar ao catálogo
          </Link>
        </div>
      </section>
    )
  }

  const relatedNFTs = allNFTs
    .filter((item) => item.id !== nft.id)
    .sort((a, b) => {
      const aMatches = a.category === nft.category ? 1 : 0
      const bMatches = b.category === nft.category ? 1 : 0
      return bMatches - aMatches
    })
    .slice(0, 5)

  const safeQuantity = Math.min(
    quantity,
    Math.max(nft.availableQuantity, 1)
  )
  const totalPrice = multiplyEth(nft.price, safeQuantity)

  function handleAddToCart() {
    if (!nft || !nft.available || nft.availableQuantity < 1) {
      return
    }

    for (let index = 0; index < safeQuantity; index++) {
      addItem(nft)
    }

    setAddedToCart(true)
  }

    function handleBuy() {
      if (!nft || !nft.available || nft.availableQuantity < 1) {
        return
      }

  handleAddToCart()
  void navigate({ to: "/cart" })
}

  function handleToggleFavorite() {
    if (!isAuthenticated || !user) {
      void navigate({
        to: "/login",
        search: { returnTo: `/nft/${encodeURIComponent(id)}` },
      })
      return
    }

    favoriteMutation.mutate({
      nftId: id,
      shouldAdd: !isFavorite,
    })
  }

  return (
    <div className="pb-16 pt-8 sm:pt-10">
      <nav
        aria-label="Navegação estrutural"
        className="mb-7 flex flex-wrap items-center gap-2 text-xs"
      >
        <Link
          to="/"
          className="text-kurio-muted transition-colors hover:text-kurio-primary"
        >
          Início
        </Link>

        <span className="text-kurio-muted">/</span>

        <Link
          to="/"
          hash="marketplace"
          className="text-kurio-muted transition-colors hover:text-kurio-primary"
        >
          Mercado
        </Link>

        <span className="text-kurio-muted">/</span>

        <span className="font-bold text-kurio-text">
          {nft.name}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[48%_1fr] lg:gap-10">
        <div>
          <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 sm:grid-cols-[82px_minmax(0,1fr)] sm:gap-5">
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className={`aspect-square overflow-hidden rounded-md border-2 ${
                    item === 0
                      ? "border-kurio-primary"
                      : "border-[#493026]"
                  }`}
                >
                  <img
                    src={nft.image}
                    alt={`${nft.name} - miniatura ${item + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-md border border-[#493026] bg-kurio-surface p-3">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-[#35221a]">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => setImageExpanded(true)}
                  aria-label="Ampliar imagem do NFT"
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-kurio-bg/80 text-kurio-text transition-colors hover:text-kurio-primary"
                >
                  <ZoomIn size={19} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-kurio-muted">
            {nft.category}
          </p>

          <h1 className="text-3xl font-black tracking-tight text-kurio-text sm:text-4xl">
            {nft.name}
          </h1>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#493026] pb-5">
            <p className="text-2xl font-black text-kurio-primary">
              {formatEth(nft.price)} ETH
            </p>

            <span
              className={`text-xs font-bold ${
                nft.available
                  ? "text-[#c9a77b]"
                  : "text-red-400"
              }`}
            >
              {nft.available
                ? `● ${nft.availableQuantity} edição(ões) disponíveis`
                : "● Indisponível"}
            </span>
          </div>

          <div className="mt-5">
            <h2 className="mb-3 text-sm font-bold text-kurio-text">
              Sobre este NFT:
            </h2>

            <p className="text-sm leading-7 text-kurio-muted">
              {nft.description}
            </p>
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-bold text-kurio-text">
              Edição:
            </h2>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[#704b35] px-3 py-1 text-[11px] text-kurio-muted">
                Coleção digital
              </span>

              <span className="rounded-full border border-[#704b35] px-3 py-1 text-[11px] text-kurio-muted">
                {nft.category}
              </span>

              <span className="rounded-full border border-[#704b35] px-3 py-1 text-[11px] text-kurio-muted">
                {nft.available ? "Disponível" : "Esgotado"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={!nft.available || quantity === 1}
                aria-label="Diminuir quantidade"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-kurio-primary text-kurio-bg transition-opacity disabled:opacity-40"
              >
                <Minus size={18} />
              </button>

              <span className="min-w-6 text-center text-base font-bold text-kurio-text">
                {safeQuantity}
              </span>

              <button
                type="button"
                onClick={() =>
                  setQuantity((value) =>
                    Math.min(value + 1, nft.availableQuantity)
                  )
                }
                disabled={
                  !nft.available ||
                  quantity >= nft.availableQuantity
                }
                aria-label="Aumentar quantidade"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-kurio-primary text-kurio-bg transition-opacity disabled:opacity-40"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex flex-1 flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleBuy}
                disabled={!nft.available}
                className="inline-flex min-w-32 items-center justify-center gap-2 rounded bg-kurio-primary px-6 py-3 text-xs font-bold uppercase text-kurio-bg transition-colors hover:bg-[#e6a15f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={16} />
                Comprar
              </button>

              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={
                  favoritesQuery.isPending || favoriteMutation.isPending
                }
                aria-pressed={isFavorite}
                className={`inline-flex items-center justify-center gap-2 rounded border px-4 py-3 text-xs font-bold transition-colors ${
                  isFavorite
                    ? "border-kurio-primary bg-kurio-primary/10 text-kurio-primary"
                    : "border-[#80502e] text-kurio-primary hover:bg-kurio-surface"
                }`}
              >
                <Heart
                  size={16}
                  fill={isFavorite ? "currentColor" : "none"}
                />
                {isFavorite ? "Favoritado" : "Favoritar"}
              </button>
            </div>
          </div>

          {favoriteMutation.isError && (
            <p role="alert" className="mt-3 text-xs text-red-400">
              Não foi possível atualizar o favorito. Tente novamente.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#493026] pb-5">
            <p className="text-xs text-kurio-muted">
              Total:{" "}
              <strong className="text-kurio-primary">
                {formatEth(totalPrice)} ETH
              </strong>
            </p>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!nft.available}
              className="inline-flex items-center gap-2 text-xs font-bold text-kurio-primary transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {addedToCart ? <Check size={15} /> : <Plus size={15} />}
              {addedToCart ? "Adicionado ao carrinho" : "Adicionar ao carrinho"}
            </button>
          </div>

          <div className="mt-5 space-y-3 text-xs text-kurio-muted">
            <p>
              ID do token:{" "}
              <span className="text-kurio-text">
                #{nft.id.padStart(4, "0")}
              </span>
            </p>

            <p>
              Coleção:{" "}
              <span className="text-kurio-text">
                {nft.creator}
              </span>
            </p>

            <p>
              Categoria:{" "}
              <span className="text-kurio-text">
                {nft.category}
              </span>
            </p>

            <p>
              Criador:{" "}
              <span className="text-kurio-text">
                {nft.creator}
              </span>
            </p>
          </div>
        </div>
      </div>

      <section className="mt-16 sm:mt-20">
        <div
          role="tablist"
          aria-label="Informações do NFT"
          className="flex gap-6 border-b border-[#493026]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "details"}
            onClick={() => setActiveTab("details")}
            className={`border-b-2 pb-3 text-sm font-bold transition-colors ${
              activeTab === "details"
                ? "border-kurio-primary text-kurio-primary"
                : "border-transparent text-kurio-muted hover:text-kurio-text"
            }`}
          >
            Detalhes do NFT
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reviews"}
            onClick={() => setActiveTab("reviews")}
            className={`border-b-2 pb-3 text-sm font-bold transition-colors ${
              activeTab === "reviews"
                ? "border-kurio-primary text-kurio-primary"
                : "border-transparent text-kurio-muted hover:text-kurio-text"
            }`}
          >
            Avaliações de colecionadores
          </button>
        </div>

        {activeTab === "details" ? (
          <div className="space-y-5 py-6 text-xs leading-7 text-kurio-muted sm:text-sm">
            <p>{nft.description}</p>

            <p>
              Esta obra faz parte do catálogo digital da Kurio,
              uma plataforma dedicada à descoberta de artistas,
              criadores e coleções de NFTs.
            </p>

            <div>
              <h3 className="font-bold text-kurio-text">
                Criador:
              </h3>
              <p>{nft.creator}</p>
            </div>

            <div>
              <h3 className="font-bold text-kurio-text">
                Categoria:
              </h3>
              <p>{nft.category}</p>
            </div>

            <div>
              <h3 className="font-bold text-kurio-text">
                Identificação:
              </h3>
              <p>Token #{nft.id.padStart(4, "0")}</p>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-kurio-muted">
              Ainda não há avaliações disponíveis para este NFT.
            </p>
          </div>
        )}
      </section>

      <section className="mt-12 sm:mt-16">
        <div className="mb-7 flex items-center gap-5 border-b border-[#493026] pb-3">
          <h2 className="text-sm font-bold text-kurio-primary">
            Mais desta coleção
          </h2>

          <span className="h-px flex-1 bg-[#493026]" />
        </div>

        {relatedNFTs.length === 0 ? (
          <p className="py-8 text-sm text-kurio-muted">
            Ainda não há outros NFTs disponíveis no catálogo.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {relatedNFTs.map((item) => (
              <Link
                key={item.id}
                to="/nft/$id"
                params={{ id: item.id }}
                className="group block"
              >
                <div className="overflow-hidden border border-[#493026] bg-kurio-surface p-3">
                  <div className="aspect-square overflow-hidden rounded-md bg-[#35221a]">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </div>

                <h3 className="mt-3 text-xs font-bold text-kurio-text">
                  {item.name}
                </h3>

                <p className="mt-1 text-sm font-bold text-kurio-primary">
                  {formatEth(item.price)} ETH
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {imageExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagem ampliada de ${nft.name}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6"
        >
          <button
            type="button"
            ref={imageCloseButtonRef}
            onClick={() => setImageExpanded(false)}
            aria-label="Fechar imagem ampliada"
            className="absolute right-6 top-6 border border-[#704b35] px-4 py-2 text-sm font-bold text-kurio-text hover:text-kurio-primary"
          >
            Fechar
          </button>

          <img
            src={nft.image}
            alt={nft.name}
            className="max-h-[85vh] max-w-full object-contain"
          />
        </div>
      )}
    </div>
  )
}
