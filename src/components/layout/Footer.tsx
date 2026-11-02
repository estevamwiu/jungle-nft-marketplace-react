import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "@tanstack/react-router"

const socialNetworks = [
  { name: "Facebook", type: "facebook" },
  { name: "Instagram", type: "instagram" },
  { name: "Twitter", type: "twitter" },
  { name: "LinkedIn", type: "linkedin" },
  { name: "YouTube", type: "youtube" },
]

function SocialIcon({
  type,
}: {
  type: (typeof socialNetworks)[number]["type"]
}) {
  if (type === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (type === "facebook") {
    return <span className="text-xl font-bold leading-none">f</span>
  }

  if (type === "linkedin") {
    return <span className="text-sm font-bold leading-none">in</span>
  }

  if (type === "youtube") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
        <rect x="3" y="6" width="18" height="12" rx="2" fill="currentColor" />
        <path d="m10 9 5 3-5 3z" fill="#281813" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path
        fill="currentColor"
        d="M23.4 4.8a9.5 9.5 0 0 1-2.7.7 4.7 4.7 0 0 0 2.1-2.6 9.4 9.4 0 0 1-3 1.1 4.7 4.7 0 0 0-8.1 4.3A13.3 13.3 0 0 1 2 3.4a4.7 4.7 0 0 0 1.5 6.3 4.7 4.7 0 0 1-2.1-.6v.1a4.7 4.7 0 0 0 3.8 4.6 4.7 4.7 0 0 1-2.1.1 4.7 4.7 0 0 0 4.4 3.3A9.4 9.4 0 0 1 0 19.2a13.3 13.3 0 0 0 20.5-11.3v-.6a9.5 9.5 0 0 0 2.9-2.5Z"
      />
    </svg>
  )
}

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
  "Colecionáveis",
  "Generativa",
  "Jogos",
  "Assinaturas",
  "Utilidade",
]

const highlights = [
  {
    letter: "W",
    title: "Segurança da carteira",
    text: "Proteja sua carteira e colecione arte digital verificada com confiança.",
  },
  {
    letter: "C",
    title: "Criadores em destaque",
    text: "Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.",
  },
  {
    letter: "D",
    title: "Alertas de lançamentos",
    text: "Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.",
  },
]

const headingClass = "mb-4 text-lg font-bold text-kurio-text"

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

    setNewsletterMessage("Inscrições estarão disponíveis em breve.")
  }

  return (
    <footer className="kurio-container mt-20 text-kurio-text">
      <div className="grid min-w-0 grid-cols-1 gap-8 bg-kurio-surface px-6 py-8 sm:grid-cols-2 md:px-12 xl:grid-cols-[1fr_1fr_1fr_1.25fr] xl:gap-0">
        {highlights.map((item) => (
          <div
            key={item.letter}
            className="min-w-0 xl:border-r xl:border-[#80502e] xl:px-6 xl:first:pl-0"
          >
            <div
              aria-hidden="true"
              className="mb-4 flex h-[74px] w-[74px] items-center justify-center rounded-full bg-kurio-primary text-3xl font-bold text-kurio-bg"
            >
              {item.letter}
            </div>

            <h3 className="mb-3 text-lg font-bold">{item.title}</h3>

            <p className="max-w-[12rem] text-sm leading-[1.6] text-kurio-muted">
              {item.text}
            </p>
          </div>
        ))}

        <div className="min-w-0 xl:pl-6">
          <h3 className="mb-3 max-w-[14rem] text-lg font-bold leading-tight">
            Antecipe-se ao próximo lançamento
          </h3>

          <form
            onSubmit={handleNewsletterSubmit}
            className="flex min-h-11 w-full"
          >
            <input
              type="email"
              name="email"
              required
              aria-label="E-mail para newsletter"
              placeholder="digite seu e-mail..."
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setNewsletterMessage("")
              }}
              className="min-w-0 flex-1 rounded-l bg-[#38200f] px-4 py-3 text-sm text-kurio-text outline-none placeholder:text-kurio-muted focus:outline-2 focus:outline-kurio-primary"
            />

            <button
              type="submit"
              className="rounded bg-kurio-primary px-5 py-2.5 text-base font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
            >
              Enviar
            </button>
          </form>

          <p className="mt-4 text-sm leading-[1.6] text-kurio-muted">
            Receba lançamentos selecionados, histórias de criadores e
            novidades do mercado.
          </p>

          {newsletterMessage && (
            <p role="status" className="mt-2 text-sm text-kurio-primary">
              {newsletterMessage}
            </p>
          )}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 bg-[#38200f] px-6 py-8 text-sm sm:grid-cols-2 md:px-8 lg:grid-cols-4 lg:items-center">
        <Link to="/" className="font-bold tracking-[0.15em]">
          KURIO
        </Link>

        <p className="max-w-[14rem] leading-[1.6]">
          Feito para colecionadores, criadores e cultura
        </p>

        <span>contato@email.com</span>

        <span>+55 11 4002 8922</span>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-10 bg-kurio-surface px-6 py-10 sm:grid-cols-2 md:px-8 lg:grid-cols-4">
        <div>
          <h3 className={headingClass}>Meu perfil</h3>

          <div className="flex flex-col items-start gap-3 text-sm">
            <Link to="/profile" className="hover:text-kurio-primary">
              Meu perfil
            </Link>

            <Link to="/cart" className="hover:text-kurio-primary">
              Minha coleção
            </Link>

            <span className="text-kurio-muted">Atividade</span>
            <span className="text-kurio-muted">Estúdio do criador</span>
            <span className="text-kurio-muted">Lista de interesse</span>
          </div>
        </div>

        <div>
          <h3 className={headingClass}>Central de ajuda</h3>

          <div className="flex flex-col items-start gap-3 text-sm">
            {helpItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div>
          <h3 className={headingClass}>Coleções</h3>

          <div className="flex flex-col items-start gap-3 text-sm">
            {collectionItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={goToMarketplace}
                className="text-left hover:text-kurio-primary"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className={headingClass}>Redes sociais</h3>

          <div className="flex flex-wrap gap-2">
            {socialNetworks.map((social) => (
              <span
                key={social.name}
                title={social.name}
                aria-label={social.name}
                role="img"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#80502e] text-kurio-primary transition-colors hover:bg-[#38200f]"
              >
                <SocialIcon type={social.type} />
              </span>
            ))}
          </div>

          <h3 className="mb-3 mt-8 text-lg font-bold">
            Carteiras compatíveis
          </h3>

          <div className="inline-flex max-w-full flex-nowrap items-center gap-2 whitespace-nowrap rounded border border-[#80502e] bg-[#38200f] px-3 py-2.5 text-[9px] font-bold uppercase text-kurio-primary">
            <span>MetaMask</span>
            <span aria-hidden="true">·</span>
            <span>WalletConnect</span>
            <span aria-hidden="true">·</span>
            <span>Coinbase</span>
          </div>
        </div>
      </div>

      <p className="py-5 text-center text-xs text-kurio-text">
        © {new Date().getFullYear()} Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
