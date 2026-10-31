
import { createFileRoute, Link } from "@tanstack/react-router"
import { isAxiosError } from "axios"

import { useNFT } from "@/features/nft/hooks/use.nft"
import { useCart } from "@/features/cart/hooks/use.cart"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/nft/$id")({
  component: NFTDetailsPage,
})

function NFTDetailsPage() {
  const { id } = Route.useParams()
  const { addItem } = useCart()

  const {
    data: nft,
    isPending,
    isError,
    error,
    refetch,
  } = useNFT(id)

  if (isPending) {
    return (
      <div
        className="py-20 text-center"
        role="status"
      >
        <p className="text-slate-400">
          Carregando detalhes do NFT...
        </p>
      </div>
    )
  }

  if (isError) {
    const isNotFound =
      isAxiosError(error) &&
      error.response?.status === 404

    return (
      <section className="py-20 text-center">
        <h1 className="text-2xl font-bold">
          {isNotFound
            ? "NFT não encontrado"
            : "Erro ao carregar NFT"}
        </h1>

        <p className="mt-3 text-slate-400">
          {isNotFound
            ? "O NFT solicitado não existe."
            : "Não foi possível carregar os detalhes."}
        </p>

        <div className="mt-6 flex justify-center gap-4">
          {!isNotFound && (
            <Button
              type="button"
              onClick={() => refetch()}
            >
              Tentar novamente
            </Button>
          )}

          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Voltar ao catálogo
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-10">
      <Link
        to="/"
        className="text-sm text-violet-400 hover:underline"
      >
        ← Voltar ao catálogo
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div>
          <img
            src={nft.image}
            alt={nft.name}
            className="aspect-square w-full rounded-2xl object-cover"
          />
        </div>

        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium text-violet-400">
              {nft.category}
            </p>

            <h1 className="text-4xl font-bold">
              {nft.name}
            </h1>

            <p className="mt-3 text-slate-400">
              Criado por {nft.creator}
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">
              Descrição
            </h2>

            <p className="leading-relaxed text-slate-300">
              {nft.description}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Preço atual
            </p>

            <p className="mt-2 text-3xl font-bold text-violet-400">
              {nft.price.toFixed(2)} ETH
            </p>

            <p
              className={`mt-4 text-sm font-medium ${
                nft.available
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {nft.available
                ? "● Disponível para compra"
                : "● NFT indisponível"}
            </p>

            <Button
              type="button"
              disabled={!nft.available}
              onClick={() => addItem(nft)}
              className="mt-6 w-full"
            >
              {nft.available
                ? "Adicionar ao carrinho"
                : "Indisponível"}
            </Button>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <p className="text-sm text-slate-500">
              ID do NFT: {nft.id}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
