
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "@tanstack/react-router"

const socialNetworks = [
  { name: "Facebook", symbol: "f" },
  { name: "Instagram", symbol: "◎" },
  { name: "Twitter", symbol: "𝕏" },
  { name: "LinkedIn", symbol: "in" },
  { name: "YouTube", symbol: "▶" },
]

const helpItems = [
  "Central de ajuda",
  "Como comprar NFTs",
  "Carteira e segurança",
  "Política do mercado",
  "Denunciar item",
]

const collectionItems = [
  "Arte digital",
  "Fotografia",
  "Música",
  "Arte 3D",
  "Utilidade",
]

export function Footer() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [newsletterMessage, setNewsletterMessage] = useState("")

  function goToMarketplace() {
    void navigate({ to: "/", hash: "marketplace" })
  }

  function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      return
    }

    setNewsletterMessage(
      "Inscrições estarão disponíveis em breve."
    )
  }

  return (
    <footer className="mt-20 border-t border-[#493026] bg-[#21120e] text-kurio-text">
      <div className="kurio-container py-7">
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
          <div className="xl:border-r xl:border-[#80502e] xl:pr-5">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-kurio-primary text-xl font-bold text-kurio-bg">
              W
            </div>

            <h3 className="mb-2 text-sm font-bold">
              Segurança da carteira
            </h3>

            <p className="max-w-xs text-xs leading-6 text-kurio-muted">
              Proteja sua carteira e colecione arte digital
              verificada com confiança.
            </p>
          </div>

          <div className="xl:border-r xl:border-[#80502e] xl:px-5">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-kurio-primary text-xl font-bold text-kurio-bg">
              C
            </div>

            <h3 className="mb-2 text-sm font-bold">
              Criadores em destaque
            </h3>

            <p className="max-w-xs text-xs leading-6 text-kurio-muted">
              Conheça artistas, estúdios e comunidades que
              moldam a cultura digital na rede.
            </p>
          </div>

          <div className="xl:border-r xl:border-[#80502e] xl:px-5">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-kurio-primary text-xl font-bold text-kurio-bg">
              D
            </div>

            <h3 className="mb-2 text-sm font-bold">
              Alertas de lançamentos
            </h3>

            <p className="max-w-xs text-xs leading-6 text-kurio-muted">
              Receba calendários de cunhagem, novidades de
              listas de acesso e análises do mercado.
            </p>
          </div>

          <div className="xl:pl-5">
            <h3 className="mb-3 max-w-60 text-sm font-bold leading-5">
              Antecipe-se ao próximo lançamento
            </h3>

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex w-full"
            >
              <input
                type="email"
                required
                aria-label="E-mail para newsletter"
                placeholder="digite seu e-mail..."
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setNewsletterMessage("")
                }}
                className="min-w-0 flex-1 rounded-l border border-[#493026] bg-[#38200f] px-3 py-2 text-xs text-kurio-text outline-none placeholder:text-kurio-muted focus:border-kurio-primary"
              />

              <button
                type="submit"
                className="rounded-r bg-kurio-primary px-3 py-2 text-xs font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
              >
                Enviar
              </button>
            </form>

            <p className="mt-3 text-xs leading-6 text-kurio-muted">
              Receba lançamentos selecionados, histórias de
              criadores e novidades do mercado.
            </p>

            {newsletterMessage && (
              <p
                role="status"
                className="mt-2 text-xs text-kurio-primary"
              >
                {newsletterMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#38200f]">
        <div className="kurio-container grid gap-5 py-6 text-xs sm:grid-cols-2 lg:grid-cols-4 lg:items-center">
          <Link
            to="/"
            className="font-bold tracking-[0.15em] text-kurio-text"
          >
            KURIO
          </Link>

          <p className="max-w-52 leading-5">
            Feito para colecionadores, criadores e cultura
          </p>

          <span>contato@email.com</span>

          <span>+55 11 4002 8922</span>
        </div>
      </div>

      <div className="kurio-container grid gap-10 py-9 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-4 text-sm font-bold">
            Meu perfil
          </h3>

          <div className="flex flex-col items-start gap-3 text-xs">
            <Link
              to="/login"
              className="transition-colors hover:text-kurio-primary"
            >
              Meu perfil
            </Link>

            <Link
              to="/cart"
              className="transition-colors hover:text-kurio-primary"
            >
              Minha coleção
            </Link>

            <span className="text-kurio-muted">
              Atividade
            </span>

            <span className="text-kurio-muted">
              Estúdio do criador
            </span>

            <span className="text-kurio-muted">
              Lista de interesse
            </span>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold">
            Central de ajuda
          </h3>

          <div className="flex flex-col items-start gap-3 text-xs">
            {helpItems.map((item) => (
              <span key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold">
            Coleções
          </h3>

          <div className="flex flex-col items-start gap-3 text-xs">
            {collectionItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={goToMarketplace}
                className="text-left transition-colors hover:text-kurio-primary"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold">
            Redes sociais
          </h3>

          <div className="flex flex-wrap gap-2">
            {socialNetworks.map((social) => (
              <span
                key={social.name}
                title={social.name}
                aria-label={social.name}
                className="flex h-7 w-7 items-center justify-center rounded border border-[#80502e] text-xs font-bold text-kurio-primary"
              >
                {social.symbol}
              </span>
            ))}
          </div>

          <h3 className="mb-3 mt-7 text-sm font-bold">
            Carteiras compatíveis
          </h3>

          <div className="inline-flex flex-wrap items-center gap-2 rounded border border-[#493026] bg-[#38200f] px-3 py-2 text-[9px] font-bold uppercase text-kurio-primary">
            <span>MetaMask</span>
            <span>·</span>
            <span>WalletConnect</span>
            <span>·</span>
            <span>Coinbase</span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#493026] bg-kurio-bg">
        <div className="kurio-container py-3 text-center text-[11px] text-kurio-text">
          © {new Date().getFullYear()} Kurio. Propriedade
          digital para todos.
        </div>
      </div>
    </footer>
  )
}
