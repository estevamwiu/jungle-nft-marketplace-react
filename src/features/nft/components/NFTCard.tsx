import { Link } from "@tanstack/react-router"
import { formatEth } from "@/lib/money"

interface NFTCardProps {
  nft: {
    id: string
    name: string
    price: string
    image: string
    oldPrice?: string
  }
}

export function NFTCard({ nft }: NFTCardProps) {
  return (
    <Link
      to="/nft/$id"
      params={{ id: nft.id }}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kurio-primary"
    >
      <div className="bg-kurio-surface px-4 pb-8 pt-5">
        <div className="aspect-square overflow-hidden rounded-xl bg-[#35221a]">
          <img
            src={nft.image}
            alt={nft.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      <h3 className="mt-3 text-base text-kurio-text">{nft.name}</h3>

      <p className="mt-1 text-base font-bold text-kurio-primary">
        {formatEth(nft.price)} ETH
        {nft.oldPrice ? (
          <span className="ml-2 font-normal text-kurio-muted">
            <span className="sr-only">Preço anterior: </span>
            {formatEth(nft.oldPrice)} ETH
          </span>
        ) : null}
      </p>
    </Link>
  )
}
