
import { ArrowUpRight } from "lucide-react"
import { useNFTs } from "@/features/nft/hooks/use.nfts"

const articles = [
  {
    title: "Como funciona a propriedade de NFTs",
    description:
      "Aprenda a colecionar, negociar e verificar ativos digitais.",
    category: "Guia",
    readingTime: "6 min de leitura",
  },
  {
    title: "10 artistas digitais para acompanhar",
    description:
      "Conheça criadores que moldam a cultura digital.",
    category: "Criadores",
    readingTime: "2 min de leitura",
  },
  {
    title: "Raridade, atributos e procedência",
    description:
      "Entenda raridade, procedência, direitos autorais e utilidade.",
    category: "Coleções",
    readingTime: "3 min de leitura",
  },
  {
    title: "Como proteger sua carteira",
    description:
      "Proteja seus ativos, suas chaves e sua identidade.",
    category: "Segurança",
    readingTime: "2 min de leitura",
  },
]

export function MintingJournal() {
  const { data: nfts = [] } = useNFTs()

  return (
    <section
      id="diario"
      className="border-t border-[#493026] pb-20 pt-16 sm:pb-24 sm:pt-20"
    >
      <div className="mb-10 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-kurio-primary">
          Conteúdo Kurio
        </span>

        <h2 className="mt-3 text-2xl font-black text-kurio-text sm:text-3xl">
          Diário da Cunhagem
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-xs leading-6 text-kurio-muted sm:text-sm">
          Histórias, guias e insights para colecionadores sobre o universo
          da propriedade digital.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((article, index) => {
          const image =
            nfts.length > 0
              ? nfts[index % nfts.length].image
              : "/images/monkey-hero.png"

          return (
            <article
              key={article.title}
              className="group overflow-hidden border border-[#493026] bg-kurio-surface"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#35221a]">
                <img
                  src={image}
                  alt={`Ilustração do artigo ${article.title}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-kurio-muted">
                  <span className="font-bold text-kurio-primary">
                    {article.category}
                  </span>

                  <span>·</span>

                  <span>{article.readingTime}</span>
                </div>

                <h3 className="mt-4 min-h-12 text-sm font-bold leading-6 text-kurio-text">
                  {article.title}
                </h3>

                <p className="mt-3 min-h-16 text-xs leading-6 text-kurio-muted">
                  {article.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-kurio-primary">
                  Em breve
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
