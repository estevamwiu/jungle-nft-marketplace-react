
import { ArrowRight } from "lucide-react"
import { useNFTs } from "@/features/nft/hooks/use.nfts"

export function PromotionalBanners() {
  const { data: nfts = [] } = useNFTs()

  function exploreMarketplace() {
    document.getElementById("marketplace")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const banners = [
    {
      title: "Lançamentos gênesis de edição limitada",
      description:
        "Colecione edições exclusivas diretamente dos criadores antes da revelação pública.",
      image: "/images/emerald-ape.webp",
      alt: "Arte digital de macaco da coleção Jungle",
    },
    {
      title: "Arte digital selecionada e muito mais",
      description:
        "Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.",
      image: nfts[2]?.image ?? nfts[1]?.image ?? "/images/emerald-ape.webp",
      alt: "NFT em destaque no marketplace",
    },
  ]

  return (
    <section
      aria-label="Coleções em destaque"
      className="pb-16 pt-4 sm:pb-20"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {banners.map((banner) => (
          <article
            key={banner.title}
            className="grid overflow-hidden rounded-2xl border border-[#493026] bg-kurio-surface sm:grid-cols-[42%_58%]"
          >
            <div className="aspect-[4/3] overflow-hidden bg-[#35221a] sm:aspect-auto">
              <img
                src={banner.image}
                alt={banner.alt}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>

            <div className="flex flex-col items-end justify-center px-6 py-8 text-right sm:px-7">
              <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-kurio-primary">
                Kurio Editions
              </span>

              <h2 className="max-w-xs text-lg font-bold leading-snug text-kurio-text">
                {banner.title}
              </h2>

              <p className="mt-4 max-w-xs text-xs leading-6 text-kurio-muted">
                {banner.description}
              </p>

              <button
                type="button"
                onClick={exploreMarketplace}
                className="mt-6 inline-flex self-end items-center gap-2 rounded bg-kurio-primary px-5 py-3 text-xs font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
              >
                Explorar
                <ArrowRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
