import { useEffect, useMemo, useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  ShoppingBag,
  CalendarDays,
  Hash,
  CheckCircle2,
} from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import { getOrders } from "@/features/activity/order-storage"
import { formatEth, multiplyEth, sumEth } from "@/lib/money"

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
})

function ActivityPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const userId = user?.id
  const orders = useMemo(
    () => (userId ? getOrders(userId) : []),
    [userId]
  )
  const [filter, setFilter] = useState<"all" | "completed">("all")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/login", replace: true })
    }
  }, [isLoading, isAuthenticated, navigate])

  async function handleLogout() {
    await logout()
    await navigate({ to: "/" })
  }

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div
        role="status"
        className="flex min-h-[65vh] items-center justify-center text-sm text-kurio-muted"
      >
        Verificando sessão...
      </div>
    )
  }

  const visibleOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => order.status === filter)

  const totalSpent = sumEth(orders.map((order) => order.total))

  const totalNFTs = orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (count, item) => count + item.quantity,
        0
      ),
    0
  )

  return (
    <div className="py-10 sm:py-14">
      <div className="mb-9 border-b border-[#493026] pb-7">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-kurio-primary">
          Minha conta
        </p>

        <h1 className="text-3xl font-black uppercase tracking-tight text-kurio-text sm:text-4xl">
          Atividade
        </h1>

        <p className="mt-3 text-sm text-kurio-muted">
          Acompanhe suas compras simuladas no marketplace.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[310px_minmax(0,1fr)]">
        <AccountSidebar
          active="activity"
          onLogout={() => void handleLogout()}
        />

        <div className="min-w-0 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border border-[#493026] bg-kurio-surface p-5">
              <p className="text-xs text-kurio-muted">
                Pedidos concluídos
              </p>

              <p className="mt-3 text-2xl font-black text-kurio-text">
                {orders.length}
              </p>
            </div>

            <div className="border border-[#493026] bg-kurio-surface p-5">
              <p className="text-xs text-kurio-muted">
                NFTs adquiridos
              </p>

              <p className="mt-3 text-2xl font-black text-kurio-text">
                {totalNFTs}
              </p>
            </div>

            <div className="border border-[#493026] bg-kurio-surface p-5">
              <p className="text-xs text-kurio-muted">
                Total simulado
              </p>

              <p className="mt-3 text-2xl font-black text-kurio-primary">
                {formatEth(totalSpent)} ETH
              </p>
            </div>
          </div>

          <section className="border border-[#493026] bg-kurio-surface p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#493026] pb-6">
              <div>
                <h2 className="text-lg font-bold uppercase text-kurio-text">
                  Histórico de compras
                </h2>

                <p className="mt-2 text-xs text-kurio-muted">
                  Pedidos confirmados no checkout demonstrativo.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs text-kurio-muted">
                Status

                <select
                  name="status"
                  value={filter}
                  onChange={(event) =>
                    setFilter(
                      event.target.value as "all" | "completed"
                    )
                  }
                  className="border border-[#493026] bg-kurio-bg px-3 py-2 text-xs text-kurio-text outline-none focus:border-kurio-primary"
                >
                  <option value="all">Todos</option>
                  <option value="completed">Concluídos</option>
                </select>
              </label>
            </div>

            {visibleOrders.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-16 text-center">
                <ShoppingBag
                  size={38}
                  className="text-kurio-primary"
                />

                <h3 className="mt-5 text-sm font-bold uppercase text-kurio-text">
                  Nenhuma compra registrada
                </h3>

                <p className="mt-3 max-w-md text-xs leading-6 text-kurio-muted">
                  Suas compras simuladas aparecerão aqui após
                  a confirmação do pedido.
                </p>

                <Link
                  to="/"
                  hash="marketplace"
                  className="mt-6 bg-kurio-primary px-5 py-3 text-xs font-bold uppercase text-kurio-bg"
                >
                  Explorar NFTs
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {visibleOrders.map((order) => (
                  <article
                    key={order.orderId}
                    className="border border-[#493026] bg-kurio-bg p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#493026] pb-4">
                      <div className="min-w-0 space-y-2">
                        <p className="flex items-center gap-2 break-all text-xs font-bold text-kurio-text">
                          <Hash
                            size={14}
                            className="shrink-0 text-kurio-primary"
                          />

                          {order.orderId}
                        </p>

                        <p className="flex items-center gap-2 text-[11px] text-kurio-muted">
                          <CalendarDays size={14} />

                          {new Date(
                            order.createdAt
                          ).toLocaleString("pt-BR")}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 size={16} />
                        Concluído
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-14 w-14 shrink-0 rounded object-cover"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-kurio-text">
                              {item.name}
                            </p>

                            <p className="mt-1 text-[11px] text-kurio-muted">
                              Quantidade: {item.quantity}
                            </p>
                          </div>

                          <p className="shrink-0 text-xs font-bold text-kurio-primary">
                            {formatEth(
                              multiplyEth(item.price, item.quantity)
                            )}{" "}
                            ETH
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 flex justify-between border-t border-[#493026] pt-4 text-sm font-bold">
                      <span className="text-kurio-text">
                        Total do pedido
                      </span>

                      <span className="text-kurio-primary">
                        {formatEth(order.total)} ETH
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <p className="text-xs leading-6 text-kurio-muted">
            Este histórico é salvo apenas neste navegador.
            Nenhum pagamento real ou transferência de NFT foi realizado.
          </p>
        </div>
      </div>
    </div>
  )
}