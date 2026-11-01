
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
} from "lucide-react"

import { useCart } from "@/features/cart/hooks/use.cart"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { Footer } from "@/components/layout/Footer"
import { HomePage } from "@/routes/index"

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

  const [menuOpen, setMenuOpen] = useState(false)

  const isAuthModal =
    pathname === "/login" || pathname === "/register"

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
      <header className="sticky top-0 z-50 border-b border-[#493026] bg-kurio-bg/95 backdrop-blur-md">
        <nav className="kurio-container flex h-18 items-center justify-between gap-4">
          <Link
            to="/"
            onClick={closeMenu}
            className="text-lg font-bold tracking-[0.18em] text-kurio-text"
          >
            KURIO
          </Link>

          <div className="hidden h-full items-center gap-8 md:flex">
            <Link
              to="/"
              activeProps={{
                className: "text-kurio-primary",
              }}
              className="flex h-full items-center border-b-2 border-transparent text-sm transition-colors hover:text-kurio-primary"
            >
              Início
            </Link>

            <button
              type="button"
              onClick={goToMarketplace}
              className="text-sm text-kurio-text transition-colors hover:text-kurio-primary"
            >
              Mercado
            </button>

            <span
              title="Página em desenvolvimento"
              className="cursor-not-allowed text-sm text-kurio-muted"
            >
              Criadores
            </span>

            <span
              title="Página em desenvolvimento"
              className="cursor-not-allowed text-sm text-kurio-muted"
            >
              Aprenda
            </span>
          </div>

          <div className="hidden items-center gap-5 md:flex">
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
                <span className="max-w-36 truncate text-xs text-kurio-text">
                  Olá, {user.name}
                </span>

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
                className="text-sm hover:text-kurio-primary"
              >
                Início
              </Link>

              <button
                type="button"
                onClick={goToMarketplace}
                className="text-left text-sm hover:text-kurio-primary"
              >
                Mercado
              </button>

              <span className="text-sm text-kurio-muted">
                Criadores (em breve)
              </span>

              <span className="text-sm text-kurio-muted">
                Aprenda (em breve)
              </span>

              <div className="border-t border-[#493026] pt-4">
                {isLoading ? (
                  <span className="text-sm text-kurio-muted">
                    Carregando...
                  </span>
                ) : isAuthenticated && user ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">
                      Olá, {user.name}
                    </span>

                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="flex items-center gap-2 rounded bg-kurio-primary px-3 py-2 text-xs font-bold text-kurio-bg"
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
            <HomePage />
          </div>
        )}

        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
