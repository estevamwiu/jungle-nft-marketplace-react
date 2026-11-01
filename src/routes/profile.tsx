import {
  useEffect,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"

import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router"

import {
  Eye,
  EyeOff,
  UserRound,
  ImagePlus,
  Trash2,
  Save,
} from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import {
  changePassword,
  getProfile,
  saveProfile,
} from "@/features/account/api/account-api"
import type { ProfileData } from "@/features/account/types"

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
})

const inputClass =
  "h-11 w-full rounded border border-[#493026] bg-[#21130f] px-4 text-sm text-kurio-text outline-none transition-colors placeholder:text-kurio-muted focus:border-kurio-primary disabled:cursor-not-allowed disabled:opacity-60"

const labelClass =
  "mb-2 block text-xs font-semibold text-kurio-text"

function ProfilePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const token = localStorage.getItem("jungle-auth-token")
  const profileKey = ["profile", user?.id]
  const profileQuery = useQuery({
    queryKey: profileKey,
    queryFn: ({ signal }) =>
      token
        ? getProfile(token, signal)
        : Promise.reject(new Error("Sessão não encontrada.")),
    enabled: Boolean(user && isAuthenticated && token),
  })
  const [profileDraft, setProfileDraft] = useState<{
    userId: string
    data: ProfileData
  } | null>(null)
  const profile =
    profileDraft && profileDraft.userId === user?.id
      ? profileDraft.data
      : profileQuery.data ?? {
          displayName: user?.name ?? "",
          username: "",
          ensName: "",
          walletNickname: "",
          avatar: null,
        }
  const profileMutation = useMutation({
    mutationFn: (nextProfile: ProfileData) => {
      if (!token) {
        throw new Error("Sessão não encontrada.")
      }

      return saveProfile(nextProfile, token)
    },
    onSuccess: (savedProfile) => {
      if (user) {
        setProfileDraft({ userId: user.id, data: savedProfile })
      }
      void queryClient.invalidateQueries({ queryKey: profileKey })
    },
  })
  const [avatarError, setAvatarError] = useState("")

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false)

  const [showNewPassword, setShowNewPassword] =
    useState(false)

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)
  const [passwordValues, setPasswordValues] = useState({
    current: "",
    next: "",
    confirmation: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const passwordMutation = useMutation({
    mutationFn: () => {
      if (!token) {
        throw new Error("Sessão não encontrada.")
      }

      return changePassword(
        passwordValues.current,
        passwordValues.next,
        token
      )
    },
    onSuccess: () => {
      setPasswordValues({
        current: "",
        next: "",
        confirmation: "",
      })
      setPasswordError("")
    },
  })

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({
        to: "/login",
        search: { returnTo: "/profile" },
        replace: true,
      })
    }
  }, [isAuthenticated, isLoading, navigate])

  function updateProfile(
    field: keyof ProfileData,
    value: string | null
  ) {
    if (!user) return
    setProfileDraft({
      userId: user.id,
      data: { ...profile, [field]: value },
    })
    profileMutation.reset()
  }

  function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    profileMutation.mutate({
      ...profile,
      displayName: profile.displayName.trim(),
      username: profile.username.trim(),
      ensName: profile.ensName.trim(),
      walletNickname: profile.walletNickname.trim(),
    })
  }

  function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (passwordValues.next.length < 6) {
      setPasswordError("A nova senha deve ter ao menos 6 caracteres.")
      return
    }

    if (passwordValues.next !== passwordValues.confirmation) {
      setPasswordError("A confirmação da senha não corresponde.")
      return
    }

    setPasswordError("")
    passwordMutation.mutate()
  }

  function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      setAvatarError("Selecione um arquivo de imagem.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("A imagem deve ter no máximo 2 MB.")
      return
    }

    setAvatarError("")
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateProfile("avatar", reader.result)
      }
    }
    reader.onerror = () => {
      setAvatarError("Não foi possível ler a imagem selecionada.")
    }

    reader.readAsDataURL(file)
  }

  async function handleLogout() {
    try {
      await logout()
    } finally {
      await navigate({ to: "/" })
    }
  }

  if (
    isLoading ||
    !isAuthenticated ||
    !user ||
    profileQuery.isPending
  ) {
    return (
      <div
        role="status"
        className="flex min-h-[65vh] items-center justify-center text-sm text-kurio-muted"
      >
        Verificando sessão...
      </div>
    )
  }

  if (profileQuery.isError) {
    return (
      <section className="py-24 text-center">
        <p role="alert" className="text-sm text-red-400">
          Não foi possível carregar os dados do perfil.
        </p>
        <button
          type="button"
          onClick={() => void profileQuery.refetch()}
          className="mt-5 bg-kurio-primary px-5 py-3 text-sm font-bold text-kurio-bg"
        >
          Tentar novamente
        </button>
      </section>
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
      <div className="grid gap-8 lg:grid-cols-[310px_minmax(0,1fr)]">
        <AccountSidebar
          active="profile"
          onLogout={() => void handleLogout()}
        />

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
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
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
                        onClick={() => updateProfile("avatar", null)}
                        disabled={!profile.avatar}
                        className="inline-flex items-center gap-2 border border-[#493026] px-3 py-2 text-xs text-kurio-muted transition-colors hover:text-kurio-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                        Remover
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-kurio-muted">
                    Imagem de até 2 MB, salva junto ao perfil.
                  </p>

                  {avatarError && (
                    <p role="alert" className="mt-2 text-xs text-red-400">
                      {avatarError}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 border-t border-[#493026] pt-6">
                <p className="text-xs leading-6 text-kurio-muted">
                  Os dados são persistidos pela API simulada da conta.
                </p>

                {profileMutation.isError && (
                  <p role="alert" className="mt-3 text-xs text-red-400">
                    {isAxiosError<{ message?: string }>(
                      profileMutation.error
                    )
                      ? profileMutation.error.response?.data?.message ??
                        "Não foi possível salvar o perfil."
                      : "Não foi possível salvar o perfil."}
                  </p>
                )}

                {profileMutation.isSuccess && (
                  <p
                    role="status"
                    className="mt-3 text-xs text-emerald-400"
                  >
                    Perfil salvo com sucesso.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className="mt-5 inline-flex h-11 items-center justify-center gap-2 bg-kurio-primary px-7 text-xs font-bold uppercase tracking-wide text-kurio-bg transition-colors hover:bg-[#e6a15f]"
                >
                  <Save size={16} />
                  {profileMutation.isPending
                    ? "Salvando..."
                    : "Salvar perfil"}
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
                Use sua senha atual para definir uma nova senha.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit}>
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
                    autoComplete="current-password"
                    required
                    value={passwordValues.current}
                    onChange={(event) =>
                      setPasswordValues((current) => ({
                        ...current,
                        current: event.target.value,
                      }))
                    }
                    className={`${inputClass} pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (value) => !value
                      )
                    }
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
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={passwordValues.next}
                    onChange={(event) =>
                      setPasswordValues((current) => ({
                        ...current,
                        next: event.target.value,
                      }))
                    }
                    className={`${inputClass} pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (value) => !value
                      )
                    }
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
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={passwordValues.confirmation}
                    onChange={(event) =>
                      setPasswordValues((current) => ({
                        ...current,
                        confirmation: event.target.value,
                      }))
                    }
                    className={`${inputClass} pr-11`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
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

              {passwordError && (
                <p role="alert" className="mt-4 text-xs text-red-400">
                  {passwordError}
                </p>
              )}

              {passwordMutation.isError && (
                <p role="alert" className="mt-4 text-xs text-red-400">
                  {isAxiosError<{ message?: string }>(
                    passwordMutation.error
                  )
                    ? passwordMutation.error.response?.data?.message ??
                      "Não foi possível alterar a senha."
                    : "Não foi possível alterar a senha."}
                </p>
              )}

              {passwordMutation.isSuccess && (
                <p role="status" className="mt-4 text-xs text-emerald-400">
                  Senha alterada com sucesso.
                </p>
              )}

              <button
                type="submit"
                disabled={passwordMutation.isPending}
                className="mt-7 inline-flex h-11 items-center justify-center bg-kurio-primary px-7 text-xs font-bold uppercase text-kurio-bg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {passwordMutation.isPending
                  ? "Salvando..."
                  : "Salvar nova senha"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}