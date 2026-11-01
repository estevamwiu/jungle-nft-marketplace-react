import {
  useEffect,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react"

import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router"

import {
  Activity,
  Bookmark,
  Download,
  Eye,
  EyeOff,
  Heart,
  HelpCircle,
  LogOut,
  UserRound,
  Wallet,
  ImagePlus,
  Trash2,
  Save,
} from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
})

interface ProfileData {
  displayName: string
  username: string
  ensName: string
  walletNickname: string
}

const inputClass =
  "h-11 w-full rounded border border-[#493026] bg-[#21130f] px-4 text-sm text-kurio-text outline-none transition-colors placeholder:text-kurio-muted focus:border-kurio-primary disabled:cursor-not-allowed disabled:opacity-60"

const labelClass =
  "mb-2 block text-xs font-semibold text-kurio-text"

function ProfilePage() {
  const navigate = useNavigate()

  const { user, isAuthenticated, isLoading, logout } = useAuth()

  const [profile, setProfile] = useState<ProfileData>({
    displayName: "",
    username: "",
    ensName: "",
    walletNickname: "",
  })

  const [avatar, setAvatar] = useState<string | null>(null)

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false)

  const [showNewPassword, setShowNewPassword] =
    useState(false)

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({
        to: "/login",
        replace: true,
      })
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (!user) return

    const storageKey = `kurio-profile-${user.id}`
    const storedProfile = localStorage.getItem(storageKey)

    if (storedProfile) {
      try {
        const parsed = JSON.parse(
          storedProfile
        ) as Partial<ProfileData>

        setProfile({
          displayName: parsed.displayName ?? user.name,
          username: parsed.username ?? "",
          ensName: parsed.ensName ?? "",
          walletNickname: parsed.walletNickname ?? "",
        })
      } catch {
        setProfile({
          displayName: user.name,
          username: "",
          ensName: "",
          walletNickname: "",
        })
      }
    } else {
      setProfile({
        displayName: user.name,
        username: "",
        ensName: "",
        walletNickname: "",
      })
    }
  }, [user])

  function updateProfile(
    field: keyof ProfileData,
    value: string
  ) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))

    setSaved(false)
  }

  function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!user) return

    localStorage.setItem(
      `kurio-profile-${user.id}`,
      JSON.stringify({
        displayName: profile.displayName.trim(),
        username: profile.username.trim(),
        ensName: profile.ensName.trim(),
        walletNickname: profile.walletNickname.trim(),
      })
    )

    setSaved(true)
  }

  function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result)
      }
    }

    reader.readAsDataURL(file)
  }

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

  const initials = (profile.displayName || user.name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("")

  return (
    <div className="py-10 sm:py-14">
      <div className="mb-9 border-b border-[#493026] pb-7">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-kurio-primary">
          Minha conta
        </p>

        <h1 className="text-3xl font-black uppercase tracking-tight text-kurio-text sm:text-4xl">
          Meu perfil
        </h1>

        <p className="mt-3 text-sm text-kurio-muted">
          Gerencie as informações do seu perfil de colecionador.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="self-start border border-[#493026] bg-kurio-surface p-4 lg:sticky lg:top-24">
          <nav
            aria-label="Navegação da conta"
            className="flex flex-col gap-1"
          >
            <Link
              to="/profile"
              aria-current="page"
              className="flex items-center gap-3 bg-kurio-primary px-4 py-3 text-xs font-bold text-kurio-bg"
            >
              <UserRound size={17} />
              Dados do perfil
            </Link>

            <Link
              to="/wallets"
              className="flex items-center gap-3 px-4 py-3 text-xs text-kurio-muted transition-colors hover:bg-kurio-bg hover:text-kurio-primary"
            >
              <Wallet size={17} />
              Carteiras
            </Link>

            <Link
              to="/activity"
              className="flex items-center gap-3 px-4 py-3 text-xs text-kurio-muted transition-colors hover:bg-kurio-bg hover:text-kurio-primary"
            >
              <Activity size={17} />
              Atividade
            </Link>

            <span className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-xs text-kurio-muted opacity-70">
              <Heart size={17} />
              Lista de interesse
            </span>

            <span className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-xs text-kurio-muted opacity-70">
              <Bookmark size={17} />
              Ofertas
            </span>

            <span className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-xs text-kurio-muted opacity-70">
              <Download size={17} />
              Arquivos baixados
            </span>

            <span className="flex cursor-not-allowed items-center gap-3 px-4 py-3 text-xs text-kurio-muted opacity-70">
              <HelpCircle size={17} />
              Suporte
            </span>

            <div className="mt-3 border-t border-[#493026] pt-3">
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-xs text-kurio-text transition-colors hover:bg-kurio-bg hover:text-kurio-primary"
              >
                <LogOut size={17} />
                Sair
              </button>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 space-y-8">
          <section className="border border-[#493026] bg-kurio-surface p-5 sm:p-8">
            <div className="mb-8 border-b border-[#493026] pb-6">
              <h2 className="text-lg font-bold uppercase text-kurio-text">
                Perfil do colecionador
              </h2>

              <p className="mt-2 text-xs leading-6 text-kurio-muted">
                Personalize as informações exibidas no seu perfil.
              </p>
            </div>

            <form onSubmit={handleSave}>
              <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-display-name"
                    className={labelClass}
                  >
                    Nome de exibição
                  </label>

                  <input
                    id="profile-display-name"
                    type="text"
                    value={profile.displayName}
                    onChange={(event) =>
                      updateProfile(
                        "displayName",
                        event.target.value
                      )
                    }
                    placeholder="Seu nome de exibição"
                    maxLength={80}
                    required
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-username"
                    className={labelClass}
                  >
                    Nome de usuário
                  </label>

                  <input
                    id="profile-username"
                    type="text"
                    value={profile.username}
                    onChange={(event) =>
                      updateProfile(
                        "username",
                        event.target.value
                      )
                    }
                    placeholder="Seu nome de usuário"
                    maxLength={40}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-email"
                    className={labelClass}
                  >
                    E-mail
                  </label>

                  <input
                    id="profile-email"
                    type="email"
                    value={user.email}
                    readOnly
                    className={`${inputClass} cursor-not-allowed opacity-70`}
                  />

                  <p className="mt-2 text-[11px] text-kurio-muted">
                    E-mail vinculado à sua conta.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="profile-ens"
                    className={labelClass}
                  >
                    Nome ENS
                  </label>

                  <div className="flex">
                    <input
                      id="profile-ens"
                      type="text"
                      value={profile.ensName}
                      onChange={(event) =>
                        updateProfile(
                          "ensName",
                          event.target.value
                        )
                      }
                      placeholder="seunome"
                      maxLength={80}
                      className={`${inputClass} rounded-r-none`}
                    />

                    <span className="flex h-11 items-center border border-l-0 border-[#493026] bg-[#35221a] px-4 text-xs text-kurio-muted">
                      .eth
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="profile-wallet"
                    className={labelClass}
                  >
                    Apelido da carteira
                  </label>

                  <input
                    id="profile-wallet"
                    type="text"
                    value={profile.walletNickname}
                    onChange={(event) =>
                      updateProfile(
                        "walletNickname",
                        event.target.value
                      )
                    }
                    placeholder="Ex.: Minha carteira principal"
                    maxLength={80}
                    className={inputClass}
                  />
                </div>

                <div>
                  <span className={labelClass}>
                    Avatar
                  </span>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#704b35] bg-[#35221a] text-lg font-bold text-kurio-primary">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="Prévia do avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initials || <UserRound size={25} />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 border border-[#704b35] px-3 py-2 text-xs text-kurio-text transition-colors hover:border-kurio-primary">
                        <ImagePlus size={15} />
                        Alterar

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="sr-only"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setAvatar(null)}
                        disabled={!avatar}
                        className="inline-flex items-center gap-2 border border-[#493026] px-3 py-2 text-xs text-kurio-muted transition-colors hover:text-kurio-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                        Remover
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-kurio-muted">
                    Prévia temporária. Imagem de até 2 MB.
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-[#493026] pt-6">
                <p className="text-xs leading-6 text-kurio-muted">
                  Os dados personalizados são salvos apenas neste
                  navegador. A atualização da conta no servidor
                  ainda não está disponível.
                </p>

                {saved && (
                  <p
                    role="status"
                    className="mt-3 text-xs text-emerald-400"
                  >
                    Preferências salvas neste navegador.
                  </p>
                )}

                <button
                  type="submit"
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 bg-kurio-primary px-7 text-xs font-bold uppercase tracking-wide text-kurio-bg transition-colors hover:bg-[#e6a15f]"
                >
                  <Save size={16} />
                  Salvar perfil
                </button>
              </div>
            </form>
          </section>

          <section className="border border-[#493026] bg-kurio-surface p-5 sm:p-8">
            <div className="mb-7 border-b border-[#493026] pb-6">
              <h2 className="text-lg font-bold uppercase text-kurio-text">
                Alterar senha
              </h2>

              <p className="mt-2 text-xs leading-6 text-kurio-muted">
                A alteração de senha estará disponível quando
                a API oferecer essa operação.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="current-password"
                  className={labelClass}
                >
                  Senha atual
                </label>

                <div className="relative">
                  <input
                    id="current-password"
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Digite sua senha atual"
                    disabled
                    className={`${inputClass} pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (value) => !value
                      )
                    }
                    disabled
                    aria-label="Mostrar ou ocultar senha atual"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-kurio-muted"
                  >
                    {showCurrentPassword ? (
                      <Eye size={17} />
                    ) : (
                      <EyeOff size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-password"
                  className={labelClass}
                >
                  Nova senha
                </label>

                <div className="relative">
                  <input
                    id="new-password"
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Digite sua nova senha"
                    disabled
                    className={`${inputClass} pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (value) => !value
                      )
                    }
                    disabled
                    aria-label="Mostrar ou ocultar nova senha"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-kurio-muted"
                  >
                    {showNewPassword ? (
                      <Eye size={17} />
                    ) : (
                      <EyeOff size={17} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-new-password"
                  className={labelClass}
                >
                  Confirmar nova senha
                </label>

                <div className="relative">
                  <input
                    id="confirm-new-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirme sua nova senha"
                    disabled
                    className={`${inputClass} pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    disabled
                    aria-label="Mostrar ou ocultar confirmação de senha"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-kurio-muted"
                  >
                    {showConfirmPassword ? (
                      <Eye size={17} />
                    ) : (
                      <EyeOff size={17} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="mt-7 inline-flex h-11 cursor-not-allowed items-center justify-center bg-kurio-primary px-7 text-xs font-bold uppercase text-kurio-bg opacity-50"
            >
              Salvar nova senha
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}