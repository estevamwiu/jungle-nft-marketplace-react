import { Link } from "@tanstack/react-router"
import {
  Activity,
  Bookmark,
  Download,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  UserRound,
} from "lucide-react"

type ActiveItem = "profile" | "wallets" | "activity"

interface AccountSidebarProps {
  active: ActiveItem
  onLogout: () => void
}

const itemBase =
  "flex shrink-0 items-center gap-2 whitespace-nowrap border-b-[3px] px-3 py-3 text-sm text-kurio-primary lg:shrink lg:gap-3 lg:border-b-0 lg:border-l-[5px]"

const disabledItems = [
  { label: "Lista de interesse", icon: Heart },
  { label: "Ofertas", icon: Bookmark },
  { label: "Arquivos baixados", icon: Download },
  { label: "Suporte", icon: HelpCircle },
]

export function AccountSidebar({
  active,
  onLogout,
}: AccountSidebarProps) {
  const linkClass = (item: ActiveItem) =>
    `${itemBase} hover:bg-kurio-bg/60 ${
      active === item
        ? "border-kurio-primary font-bold"
        : "border-transparent"
    }`

  return (
    <aside className="min-w-0 max-w-full self-start bg-kurio-surface lg:w-[310px]">
      <h2 className="px-3 pb-2 pt-4 text-lg font-bold text-kurio-text">
        Meu perfil
      </h2>

      <nav
        aria-label="Navegação da conta"
        className="flex min-w-0 max-w-full flex-row overflow-x-auto lg:flex-col"
      >
        <Link
          to="/profile"
          aria-current={active === "profile" ? "page" : undefined}
          className={linkClass("profile")}
        >
          <UserRound size={17} />
          Dados do perfil
        </Link>

        <Link
          to="/wallets"
          aria-current={active === "wallets" ? "page" : undefined}
          className={linkClass("wallets")}
        >
          <MapPin size={17} />
          Carteiras
        </Link>

        <Link
          to="/activity"
          aria-current={active === "activity" ? "page" : undefined}
          className={linkClass("activity")}
        >
          <Activity size={17} />
          Atividade
        </Link>

        {disabledItems.map(({ label, icon: Icon }) => (
          <span
            key={label}
            aria-disabled="true"
            title="Em breve"
            className={`${itemBase} cursor-not-allowed border-transparent opacity-70`}
          >
            <Icon size={17} />
            {label}
          </span>
        ))}

        <div className="mt-1 shrink-0 border-l border-[#493026] lg:border-l-0 lg:border-t">
          <button
            type="button"
            onClick={onLogout}
            className="flex h-full items-center gap-2 px-3 py-3 text-left text-sm font-bold text-kurio-primary hover:bg-kurio-bg/60 lg:w-full lg:gap-3"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </nav>
    </aside>
  )
}