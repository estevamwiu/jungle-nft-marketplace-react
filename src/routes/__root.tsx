import { useState } from "react"

import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router"

import {
  Menu,
  X,
  Search,
  ShoppingCart,
  LogIn,
  LogOut,
  UserRound,
} from "lucide-react"

import { useCart } from "@/features/cart/hooks/use.cart"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { Footer } from "@/components/layout/Footer"
import { HomePage } from "@/components/home/HomePage"
import { SocketConnection } from "@/features/realtime/components/SocketConnection"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { totalItems } = useCart()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const navigate = useNavigate()

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const hash = useRouterState({
    select: (state) => state.location.hash,
  })

  const [menuOpen, setMenuOpen] = useState(false)

  const isAuthModal =
    pathname === "/login" || pathname === "/register"

  const isMarket =
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/nft") ||
    (pathname === "/" && hash === "marketplace")

  const navItem =
    "flex h-full items-center border-b-2 text-sm transition-colors hover:text-kurio-primary"

  const navState = (active: boolean) =>
    active
      ? "border-kurio-primary font-bold text-kurio-primary"
      : "border-transparent text-kurio-text"

  const mobileNavState = (active: boolean) =>
    active
      ? "border-l-2 border-kurio-primary pl-3 font-bold text-kurio-primary"
      : "border-l-2 border-transparent pl-3 text-kurio-text"

  function closeMenu() {
    setMenuOpen(false)
  }

  async function handleLogout() {
    closeMenu()

    try {
      await logout()
    } finally {
      await navigate({ to: "/" })
    }
  }

  function goToMarketplace() {
    closeMenu()
    void navigate({ to: "/", hash: "marketplace" })
  }

  return (
    <div className="min-h-screen bg-kurio-bg text-kurio-text">
      <SocketConnection />

      <header className="sticky top-0 z-50 border-b border-[#493026] bg-kurio-bg/95 backdrop-blur-md">
        <nav className="kurio-container relative flex h-18 items-center justify-between gap-4">
          <Link
            to="/"
            onClick={closeMenu}
            className="shrink-0 text-lg font-bold tracking-[0.18em] text-kurio-text"
          >
            KURIO
          </Link>

          <div className="hidden h-full items-center gap-8 md:absolute md:left-1/2 md:flex md:-translate-x-1/2">
            <Link
              to="/"
              onClick={closeMenu}
              className={`${navItem} ${navState(!isMarket)}`}
            >
              Início
            </Link>

            <Link
              to="/"
              hash="marketplace"
              onClick={closeMenu}
              className={`${navItem} ${navState(isMarket)}`}
            >
              Mercado
            </Link>

            <span
              title="Página em desenvolvimento"
              className="flex h-full cursor-not-allowed items-center text-sm text-kurio-muted"
            >
              Criadores
            </span>

            <span
              title="Página em desenvolvimento"
              className="flex h-full cursor-not-allowed items-center text-sm text-kurio-muted"
            >
              Aprenda
            </span>
          </div>

          <div className="ml-auto hidden items-center gap-5 md:flex">
            <button
              type="button"
              onClick={goToMarketplace}
              aria-label="Explorar NFTs"
              className="transition-colors hover:text-kurio-primary"
            >
              <Search size={19} />
            </button>

            <Link
              to="/cart"
              aria-label={`Carrinho com ${totalItems} itens`}
              className="relative transition-colors hover:text-kurio-primary"
            >
              <ShoppingCart size={20} />

              {totalItems > 0 && (
                <span className="absolute -right-3 -top-3 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-kurio-primary px-1 text-[10px] font-bold text-kurio-bg">
                  {totalItems}
                </span>
              )}
            </Link>

            {isLoading ? (
              <span className="text-xs text-kurio-muted">
                Carregando...
              </span>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex max-w-44 items-center gap-2 text-xs text-kurio-text transition-colors hover:text-kurio-primary"
                >
                  <UserRound size={17} />

                  <span className="truncate">
                    Olá, {user.name}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="flex items-center gap-2 rounded bg-kurio-primary px-3 py-2 text-xs font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded bg-kurio-primary px-3 py-2 text-xs font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
              >
                <LogIn size={15} />
                Entrar
              </Link>
            )}
          </div>

          <div className="flex items-center gap-5 md:hidden">
            <Link
              to="/cart"
              aria-label={`Carrinho com ${totalItems} itens`}
              className="relative"
              onClick={closeMenu}
            >
              <ShoppingCart size={21} />

              {totalItems > 0 && (
                <span className="absolute -right-3 -top-3 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-kurio-primary px-1 text-[10px] font-bold text-kurio-bg">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuOpen}
              aria-controls="kurio-mobile-menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div
            id="kurio-mobile-menu"
            className="border-t border-[#493026] bg-kurio-surface px-6 py-5 md:hidden"
          >
            <div className="flex flex-col gap-5">
              <Link
                to="/"
                onClick={closeMenu}
                className={`text-sm transition-colors hover:text-kurio-primary ${mobileNavState(!isMarket)}`}
              >
                Início
              </Link>

              <Link
                to="/"
                hash="marketplace"
                onClick={closeMenu}
                className={`text-sm transition-colors hover:text-kurio-primary ${mobileNavState(isMarket)}`}
              >
                Mercado
              </Link>

              <span className="pl-3 text-sm text-kurio-muted">
                Criadores (em breve)
              </span>

              <span className="pl-3 text-sm text-kurio-muted">
                Aprenda (em breve)
              </span>

              <div className="border-t border-[#493026] pt-4">
                {isLoading ? (
                  <span className="text-sm text-kurio-muted">
                    Carregando...
                  </span>
                ) : isAuthenticated && user ? (
                  <div className="flex flex-col gap-4">
                    <Link
                      to="/profile"
                      onClick={closeMenu}
                      className="flex items-center gap-3 text-sm text-kurio-text hover:text-kurio-primary"
                    >
                      <UserRound size={17} />
                      Meu perfil
                    </Link>

                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="flex items-center justify-center gap-2 rounded bg-kurio-primary px-3 py-2 text-xs font-bold text-kurio-bg"
                    >
                      <LogOut size={15} />
                      Sair
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="inline-flex items-center gap-2 rounded bg-kurio-primary px-4 py-2 text-sm font-bold text-kurio-bg"
                  >
                    <LogIn size={16} />
                    Entrar
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="kurio-container min-h-[70vh]">
        {isAuthModal && (
          <div aria-hidden="true" inert>
            <HomePage
              catalog={{
                q: "",
                category: "all",
                network: "all",
                sort: "default",
                page: 1,
              }}
              onCatalogChange={() => {}}
            />
          </div>
        )}

        <Outlet />
      </main>

      <Footer />
    </div>
  )
}