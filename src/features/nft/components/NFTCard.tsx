
import { Link } from "@tanstack/react-router"
import { ArrowUpRight, ShoppingCart } from "lucide-react"

import type { NFT } from "../types"
import { useCart } from "@/features/cart/hooks/use.cart"

interface NFTCardProps {
  nft: NFT
}

export function NFTCard({ nft }: NFTCardProps) {
  const { addItem } = useCart()

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-[#493026] bg-kurio-surface transition-all duration-300 hover:-translate-y-1 hover:border-kurio-primary/70 hover:shadow-[0_12px_35px_rgba(0,0,0,0.25)]">
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        className="block"
      >
        <div className="relative overflow-hidden bg-[#35221a]">
          <img
            src={nft.image}
            alt={nft.name}
            loading="lazy"
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <span className="absolute left-3 top-3 border border-[#493026] bg-kurio-bg/90 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-kurio-primary backdrop-blur-sm">
            {nft.category}
          </span>

          <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center border border-[#493026] bg-kurio-bg/90 text-kurio-text transition-colors group-hover:border-kurio-primary group-hover:text-kurio-primary">
            <ArrowUpRight size={18} />
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-kurio-muted">
              Colecionável digital
            </p>

            <h3 className="line-clamp-1 text-lg font-bold text-kurio-text transition-colors group-hover:text-kurio-primary">
              {nft.name}
            </h3>

            <p className="mt-2 line-clamp-1 text-xs text-kurio-muted">
              Criado por{" "}
              <span className="text-kurio-text">
                {nft.creator}
              </span>
            </p>
          </div>

          <div className="flex items-end justify-between gap-3 border-t border-[#493026] pt-4">
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-wider text-kurio-muted">
                Preço atual
              </p>

              <p className="text-xl font-bold text-kurio-primary">
                {nft.price} ETH
              </p>
            </div>

            <span
              className={
                nft.available
                  ? "text-right text-[10px] font-bold uppercase tracking-wide text-emerald-400"
                  : "text-right text-[10px] font-bold uppercase tracking-wide text-red-400"
              }
            >
              {nft.available
                ? "Disponível"
                : "Indisponível"}
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-auto px-5 pb-5">
        <button
          type="button"
          disabled={!nft.available}
          onClick={() => addItem(nft)}
          className="flex w-full items-center justify-center gap-2 bg-kurio-primary px-4 py-3 text-xs font-bold uppercase tracking-wide text-kurio-bg transition-colors hover:bg-[#e6a15f] disabled:cursor-not-allowed disabled:bg-[#493026] disabled:text-kurio-muted"
        >
          <ShoppingCart size={16} />

          {nft.available
            ? "Adicionar ao carrinho"
            : "Indisponível"}
        </button>
      </div>
    </article>
  )
}
