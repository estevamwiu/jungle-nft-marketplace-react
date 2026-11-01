import { Link } from "@tanstack/react-router"
import {
  CalendarDays,
  Check,
  Hash,
  ShoppingBag,
  X,
} from "lucide-react"

interface OrderItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
}

export interface CompletedOrder {
  orderId: string
  total: number
  items: OrderItem[]
  createdAt: string
}

interface OrderConfirmationDialogProps {
  order: CompletedOrder
  onClose: () => void
}

export function OrderConfirmationDialog({
  order,
  onClose,
}: OrderConfirmationDialogProps) {
  const subtotal = order.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  const totalItems = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const formattedDate = new Date(order.createdAt).toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-sm"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-success-title"
        className="relative my-auto w-full max-w-xl border border-[#704b35] bg-kurio-surface shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar confirmação"
          className="absolute right-4 top-4 text-kurio-muted transition-colors hover:text-kurio-primary"
        >
          <X size={20} />
        </button>

        <div className="border-b border-[#493026] px-6 pb-7 pt-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-kurio-primary text-kurio-primary">
            <Check size={34} strokeWidth={2.5} />
          </div>

          <h1
            id="purchase-success-title"
            className="mt-5 text-2xl font-black text-kurio-text"
          >
            Compra concluída!
          </h1>

          <p className="mt-3 text-sm leading-6 text-kurio-muted">
            Seu pedido foi registrado com sucesso no marketplace
            demonstrativo.
          </p>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-6">
          <div className="grid gap-5 border-b border-[#493026] pb-6 text-xs sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-kurio-muted">
                <Hash size={14} />
                Identificador do pedido
              </p>

              <p
                title={order.orderId}
                className="mt-2 break-all font-bold text-kurio-text"
              >
                {order.orderId}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="flex items-center gap-2 text-kurio-muted sm:justify-end">
                <CalendarDays size={14} />
                Data da compra
              </p>

              <p className="mt-2 font-bold text-kurio-text">
                {formattedDate}
              </p>
            </div>
          </div>

          <div className="mb-4 mt-6 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase text-kurio-text">
              NFTs adquiridos
            </h2>

            <span className="text-xs text-kurio-muted">
              {totalItems} edição(ões)
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <article
                key={item.id}
                className="flex items-center gap-3 border border-[#493026] bg-kurio-bg p-3"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-14 w-14 shrink-0 object-cover"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-kurio-text">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-[11px] text-kurio-muted">
                    Quantidade: {item.quantity}
                  </p>
                </div>

                <span className="shrink-0 text-xs font-bold text-kurio-primary">
                  {(item.price * item.quantity).toFixed(2)} ETH
                </span>
              </article>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-[#493026] pt-5 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-kurio-muted">Subtotal</span>

              <span className="text-kurio-text">
                {subtotal.toFixed(2)} ETH
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-kurio-muted">Taxa de rede</span>

              <span className="text-kurio-muted">
                Não simulada
              </span>
            </div>

            <div className="flex justify-between gap-4 border-t border-[#493026] pt-4 text-sm font-bold">
              <span className="text-kurio-text">
                Total do pedido
              </span>

              <span className="text-kurio-primary">
                {order.total.toFixed(2)} ETH
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 border border-[#493026] bg-kurio-bg p-4">
            <ShoppingBag
              size={18}
              className="mt-0.5 shrink-0 text-kurio-primary"
            />

            <p className="text-xs leading-6 text-kurio-muted">
              Esta compra é uma simulação. Nenhum pagamento real
              ou transferência de NFT foi realizado.
            </p>
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#493026] px-6 py-5 sm:grid-cols-2">
          <Link
            to="/activity"
            className="flex items-center justify-center border border-kurio-primary px-5 py-3 text-center text-xs font-bold uppercase text-kurio-primary transition-colors hover:bg-kurio-primary hover:text-kurio-bg"
          >
            Ver minhas compras
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="bg-kurio-primary px-5 py-3 text-xs font-bold uppercase text-kurio-bg transition-colors hover:bg-[#e6a15f]"
          >
            Voltar ao marketplace
          </button>
        </div>
      </section>
    </div>
  )
}