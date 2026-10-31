
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import type { NFT } from "../types"
import { useCart } from "@/features/cart/hooks/use.cart"

interface NFTCardProps {
  nft: NFT
}

export function NFTCard({ nft }: NFTCardProps) {
  const { addItem } = useCart()
  return (
    <article className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-transform hover:-translate-y-1">
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        className="block"
      >
        <img
          src={nft.image}
          alt={nft.name}
          loading="lazy"
          className="aspect-square w-full object-cover"
        />

        <div className="space-y-3 p-5">
          <h2 className="text-xl font-semibold text-white">
            {nft.name}
          </h2>

          <p className="text-sm text-slate-400">
            Criado por {nft.creator}
          </p>

          <div className="flex items-center justify-between">
            <span className="font-bold text-violet-400">
              {nft.price} ETH
            </span>

            <span
              className={
                nft.available
                  ? "text-sm text-green-400"
                  : "text-sm text-red-400"
              }
            >
              {nft.available
                ? "Disponível"
                : "Indisponível"}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <Button
          type="button"
          disabled={!nft.available}
          onClick={() => addItem(nft)}
          className="w-full"
        >
          {nft.available ? "Adicionar ao carrinho" : "Indisponível"}
        </Button>
      </div>
    </article>
  )
}
