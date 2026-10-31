
import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router"

import { useCart } from "@/features/cart/hooks/use.cart"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { Button } from "@/components/ui/button"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  const { totalItems } = useCart()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } finally {
      await navigate({ to: "/" })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/"
            className="text-xl font-bold text-violet-400"
          >
            Jungle NFT
          </Link>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <Link
              to="/"
              activeProps={{
                className: "text-violet-400",
              }}
              className="text-sm transition-colors hover:text-violet-400"
            >
              Explorar
            </Link>

            <Link
              to="/cart"
              activeProps={{
                className: "text-violet-400",
              }}
              className="flex items-center gap-2 text-sm transition-colors hover:text-violet-400"
            >
              <span>Carrinho</span>

              {totalItems > 0 && (
                <span
                  className="flex min-w-6 items-center justify-center rounded-full bg-violet-600 px-2 py-1 text-xs font-bold text-white"
                  aria-label={`${totalItems} itens no carrinho`}
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {isLoading ? (
              <span className="text-sm text-slate-400">
                Carregando...
              </span>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300">
                  Olá, {user.name}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleLogout()}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <Link
                to="/login"
                activeProps={{
                  className: "text-violet-400",
                }}
                className="text-sm transition-colors hover:text-violet-400"
              >
                Entrar
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        Jungle NFT Marketplace
      </footer>
    </div>
  )
}
