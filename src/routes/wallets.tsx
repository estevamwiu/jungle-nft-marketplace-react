import { useEffect, useState, type FormEvent } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  Activity,
  Bookmark,
  Check,
  Copy,
  Download,
  Heart,
  HelpCircle,
  LogOut,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react"
import { useAuth } from "@/features/auth/hooks/use-auth"

export const Route = createFileRoute("/wallets")({
  component: WalletsPage,
})

type SavedWallet = {
  id: string
  name: string
  address: string
  primary: boolean
}

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/

function readWallets(userId: string): SavedWallet[] {
  try {
    const raw = localStorage.getItem(`kurio-wallets-${userId}`)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (wallet): wallet is SavedWallet =>
        typeof wallet === "object" &&
        wallet !== null &&
        typeof wallet.id === "string" &&
        typeof wallet.name === "string" &&
        typeof wallet.address === "string" &&
        ADDRESS_PATTERN.test(wallet.address) &&
        typeof wallet.primary === "boolean"
    )
  } catch {
    return []
  }
}

function WalletsPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [wallets, setWallets] = useState<SavedWallet[]>([])
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/login", replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (!user) {
      setLoadedUserId(null)
      setWallets([])
      return
    }
    setWallets(readWallets(user.id))
    setLoadedUserId(user.id)
  }, [user])

  function updateWallets(next: SavedWallet[]) {
    if (!user) return
    setWallets(next)
    localStorage.setItem(`kurio-wallets-${user.id}`, JSON.stringify(next))
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setNotice("")
    const cleanName = name.trim()
    const cleanAddress = address.trim()
    if (!cleanName || !ADDRESS_PATTERN.test(cleanAddress)) {
      setError("Informe um nome e um endereço Ethereum válido (0x + 40 caracteres hexadecimais).")
      return
    }
    if (wallets.some((wallet) => wallet.address.toLowerCase() === cleanAddress.toLowerCase())) {
      setError("Esta carteira já está cadastrada.")
      return
    }
    updateWallets([
      ...wallets,
      {
        id: crypto.randomUUID(),
        name: cleanName,
        address: cleanAddress,
        primary: wallets.length === 0,
      },
    ])
    setName("")
    setAddress("")
    setFormOpen(false)
    setNotice("Carteira adicionada neste navegador.")
  }

  function handlePrimary(id: string) {
    updateWallets(wallets.map((wallet) => ({ ...wallet, primary: wallet.id === id })))
    setNotice("Carteira principal atualizada.")
  }

  function handleRemove(id: string) {
    const next = wallets.filter((wallet) => wallet.id !== id)
    if (next.length > 0 && !next.some((wallet) => wallet.primary)) {
      next[0] = { ...next[0], primary: true }
    }
    updateWallets(next)
    setNotice("Carteira removida.")
  }

  async function handleCopy(addressToCopy: string) {
    try {
      await navigator.clipboard.writeText(addressToCopy)
      setNotice("Endereço copiado.")
    } catch {
      setNotice("Não foi possível copiar o endereço.")
    }
  }

  async function handleLogout() {
    await logout()
    await navigate({ to: "/" })
  }

  if (isLoading || !isAuthenticated || !user || loadedUserId !== user.id) {
    return (
      <div role="status" className="flex min-h-[65vh] items-center justify-center text-sm text-kurio-muted">
        Verificando sessão...
      </div>
    )
  }

  return (
    <div className="py-10 sm:py-14">
      <div className="mb-9 border-b border-[#493026] pb-7">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-kurio-primary">Minha conta</p>
        <h1 className="text-3xl font-black uppercase tracking-tight text-kurio-text sm:text-4xl">Carteiras</h1>
        <p className="mt-3 text-sm text-kurio-muted">Gerencie os endereços de carteira associados ao seu perfil.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="self-start border border-[#493026] bg-kurio-surface p-4 lg:sticky lg:top-24">
          <nav aria-label="Navegação da conta" className="flex flex-col gap-1">
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-xs text-kurio-muted transition-colors hover:bg-kurio-bg hover:text-kurio-primary">
              <UserRound size={17} />Dados do perfil
            </Link>
            <Link to="/wallets" aria-current="page" className="flex items-center gap-3 bg-kurio-primary px-4 py-3 text-xs font-bold text-kurio-bg">
              <Wallet size={17} />Carteiras
            </Link>
            <span className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-xs text-kurio-muted opacity-70"><Activity size={17} />Atividade</span>
            <span className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-xs text-kurio-muted opacity-70"><Heart size={17} />Lista de interesse</span>
            <span className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-xs text-kurio-muted opacity-70"><Bookmark size={17} />Ofertas</span>
            <span className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-xs text-kurio-muted opacity-70"><Download size={17} />Arquivos baixados</span>
            <span className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-xs text-kurio-muted opacity-70"><HelpCircle size={17} />Suporte</span>
            <div className="mt-3 border-t border-[#493026] pt-3">
              <button type="button" onClick={() => void handleLogout()} className="flex w-full items-center gap-3 px-4 py-3 text-left text-xs text-kurio-text transition-colors hover:bg-kurio-bg hover:text-kurio-primary"><LogOut size={17} />Sair</button>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 space-y-6">
          <section className="border border-[#493026] bg-kurio-surface p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#493026] pb-6">
              <div>
                <h2 className="text-lg font-bold uppercase text-kurio-text">Minhas carteiras</h2>
                <p className="mt-2 text-xs leading-6 text-kurio-muted">{wallets.length} carteira(s) cadastrada(s)</p>
              </div>
              <button type="button" onClick={() => { setFormOpen((value) => !value); setError(""); setNotice("") }} className="inline-flex items-center gap-2 bg-kurio-primary px-5 py-3 text-xs font-bold uppercase text-kurio-bg transition-colors hover:bg-[#e6a15f]">
                {formOpen ? <X size={16} /> : <Plus size={16} />}
                {formOpen ? "Cancelar" : "Adicionar carteira"}
              </button>
            </div>

            {formOpen && (
              <form onSubmit={handleAdd} className="mt-6 space-y-5 border border-[#704b35] bg-kurio-bg p-5">
                <h3 className="text-sm font-bold uppercase text-kurio-text">Nova carteira</h3>
                <div>
                  <label htmlFor="wallet-name" className="mb-2 block text-xs font-semibold text-kurio-text">Nome da carteira</label>
                  <input id="wallet-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="Ex.: Minha carteira principal" className="h-11 w-full border border-[#493026] bg-[#21130f] px-4 text-sm text-kurio-text outline-none placeholder:text-kurio-muted focus:border-kurio-primary" />
                </div>
                <div>
                  <label htmlFor="wallet-address" className="mb-2 block text-xs font-semibold text-kurio-text">Endereço Ethereum</label>
                  <input id="wallet-address" value={address} onChange={(event) => setAddress(event.target.value)} required spellCheck={false} autoComplete="off" placeholder="0x..." className="h-11 w-full border border-[#493026] bg-[#21130f] px-4 font-mono text-xs text-kurio-text outline-none placeholder:text-kurio-muted focus:border-kurio-primary" />
                  <p className="mt-2 text-[11px] leading-5 text-kurio-muted">Informe apenas um endereço público. Nunca digite sua chave privada ou frase de recuperação.</p>
                </div>
                {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
                <button type="submit" className="inline-flex items-center gap-2 bg-kurio-primary px-5 py-3 text-xs font-bold uppercase text-kurio-bg"><Check size={16} />Salvar carteira</button>
              </form>
            )}

            {notice && <p role="status" className="mt-5 text-xs text-emerald-400">{notice}</p>}

            {wallets.length === 0 ? (
              <div className="mt-7 flex flex-col items-center border border-dashed border-[#704b35] px-5 py-14 text-center">
                <Wallet size={36} className="text-kurio-primary" />
                <h3 className="mt-5 text-sm font-bold uppercase text-kurio-text">Nenhuma carteira cadastrada</h3>
                <p className="mt-3 max-w-md text-xs leading-6 text-kurio-muted">Adicione um endereço público para organizar suas carteiras de demonstração.</p>
              </div>
            ) : (
              <div className="mt-7 space-y-4">
                {wallets.map((wallet) => (
                  <article key={wallet.id} className="border border-[#493026] bg-kurio-bg p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center border border-[#704b35] bg-kurio-surface text-kurio-primary"><Wallet size={20} /></div>
                        <div>
                          <h3 className="break-all text-sm font-bold text-kurio-text">{wallet.name}</h3>
                          {wallet.primary && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase text-kurio-primary"><Star size={12} />Principal</span>}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-2 text-[10px] uppercase text-kurio-muted"><ShieldCheck size={15} />Endereço salvo</span>
                    </div>
                    <p className="mt-5 break-all border border-[#493026] bg-kurio-surface p-3 font-mono text-xs leading-6 text-kurio-muted">{wallet.address}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button type="button" onClick={() => void handleCopy(wallet.address)} className="inline-flex items-center gap-2 border border-[#704b35] px-3 py-2 text-xs text-kurio-text transition-colors hover:border-kurio-primary"><Copy size={14} />Copiar endereço</button>
                      {!wallet.primary && <button type="button" onClick={() => handlePrimary(wallet.id)} className="inline-flex items-center gap-2 border border-[#704b35] px-3 py-2 text-xs text-kurio-text transition-colors hover:border-kurio-primary"><Star size={14} />Definir principal</button>}
                      <button type="button" onClick={() => handleRemove(wallet.id)} className="inline-flex items-center gap-2 border border-[#493026] px-3 py-2 text-xs text-red-400 transition-colors hover:border-red-500"><Trash2 size={14} />Remover</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="border border-[#493026] bg-kurio-surface p-5 sm:p-8">
            <h2 className="text-sm font-bold uppercase text-kurio-text">Sobre esta funcionalidade</h2>
            <p className="mt-3 text-xs leading-6 text-kurio-muted">Esta é uma demonstração de gerenciamento de endereços públicos. Os dados ficam somente neste navegador. Nenhuma carteira é conectada ou verificada, e nenhuma transação blockchain é realizada.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
