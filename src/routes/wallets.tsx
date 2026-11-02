import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ChevronDown } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { AccountSidebar } from "@/components/account/AccountSidebar"
import {
  getWallets,
  saveWallets,
} from "@/features/account/api/account-api"
import type {
  StoredWallets,
  WalletData,
} from "@/features/account/types"

export const Route = createFileRoute("/wallets")({
  component: WalletsPage,
})

type WalletErrors = Partial<Record<keyof WalletData, string>>

const emptyWallet: WalletData = {
  displayName: "",
  nickname: "",
  network: "",
  profileName: "",
  address: "",
  secondaryAddress: "",
  walletType: "",
  referralCode: "",
  email: "",
  ensName: "",
}

const requiredFields: [keyof WalletData, string][] = [
  ["displayName", "Informe o nome de exibição."],
  ["nickname", "Informe o apelido da carteira."],
  ["network", "Selecione uma rede."],
  ["profileName", "Informe o nome do perfil."],
  ["address", "Informe o endereço da carteira."],
  ["walletType", "Selecione o tipo de carteira."],
  ["referralCode", "Informe o código de indicação."],
  ["email", "Informe o e-mail."],
  ["ensName", "Informe o nome ENS."],
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EVM_PATTERN = /^0x[a-fA-F0-9]{40}$/
const SOLANA_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

function validate(data: WalletData): WalletErrors {
  const errors: WalletErrors = {}

  for (const [field, message] of requiredFields) {
    if (!data[field].trim()) {
      errors[field] = message
    }
  }

  if (data.email.trim() && !EMAIL_PATTERN.test(data.email.trim())) {
    errors.email = "Informe um e-mail válido."
  }

  const address = data.address.trim()

  if (address && (data.network === "Ethereum" || data.network === "Polygon")) {
    if (!EVM_PATTERN.test(address)) {
      errors.address = "Use um endereço 0x com 40 caracteres hexadecimais."
    }
  }

  if (address && data.network === "Solana" && !SOLANA_PATTERN.test(address)) {
    errors.address = "Informe um endereço Solana válido."
  }

  return errors
}

const inputClass =
  "h-10 w-full border border-[#5a2f1e] bg-kurio-bg px-3 text-sm text-kurio-text outline-none transition-colors placeholder:text-[#8d6f55] focus:border-kurio-primary aria-[invalid=true]:border-red-500"

interface FieldProps {
  id: string
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}

function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-kurio-text">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-[#e3764c]">
            *
          </span>
        )}
      </label>

      {children}

      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

function SelectBox({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-3 text-kurio-primary"
      />
    </div>
  )
}

interface WalletFormProps {
  idPrefix: string
  initial: WalletData
  onSave: (data: WalletData) => void
  isSaving: boolean
}

function WalletForm({
  idPrefix,
  initial,
  onSave,
  isSaving,
}: WalletFormProps) {
  const [data, setData] = useState<WalletData>(initial)
  const [errors, setErrors] = useState<WalletErrors>({})

  const idOf = (field: keyof WalletData) => `${idPrefix}-${field}`

  function update(field: keyof WalletData, value: string) {
    setData((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function bind(field: keyof WalletData, required = true) {
    return {
      id: idOf(field),
      value: data[field],
      onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
      ) => update(field, event.target.value),
      "aria-required": required || undefined,
      "aria-invalid": errors[field] ? true : undefined,
      "aria-describedby": errors[field] ? `${idOf(field)}-error` : undefined,
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const found = validate(data)
    setErrors(found)

    if (Object.keys(found).length > 0) {
      return
    }

    onSave({
      displayName: data.displayName.trim(),
      nickname: data.nickname.trim(),
      network: data.network,
      profileName: data.profileName.trim(),
      address: data.address.trim(),
      secondaryAddress: data.secondaryAddress.trim(),
      walletType: data.walletType,
      referralCode: data.referralCode.trim(),
      email: data.email.trim(),
      ensName: data.ensName.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-x-7 gap-y-6 sm:grid-cols-2">
        <Field
          id={idOf("displayName")}
          label="Nome de exibição"
          required
          error={errors.displayName}
        >
          <input
            type="text"
            autoComplete="name"
            className={inputClass}
            {...bind("displayName")}
          />
        </Field>

        <Field
          id={idOf("nickname")}
          label="Apelido da carteira"
          required
          error={errors.nickname}
        >
          <input
            type="text"
            autoComplete="nickname"
            className={inputClass}
            {...bind("nickname")}
          />
        </Field>

        <Field id={idOf("network")} label="Rede" required error={errors.network}>
          <SelectBox>
            <select
              autoComplete="off"
              className={`${inputClass} appearance-none pr-9`}
              {...bind("network")}
            >
              <option value="">Selecione uma rede</option>
              <option value="Ethereum">Ethereum</option>
              <option value="Polygon">Polygon</option>
              <option value="Solana">Solana</option>
            </select>
          </SelectBox>
        </Field>

        <Field
          id={idOf("profileName")}
          label="Nome do perfil"
          required
          error={errors.profileName}
        >
          <input
            type="text"
            autoComplete="nickname"
            className={inputClass}
            {...bind("profileName")}
          />
        </Field>

        <Field
          id={idOf("address")}
          label="Endereço da carteira"
          required
          error={errors.address}
        >
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Endereço 0x da carteira"
            className={inputClass}
            {...bind("address")}
          />
        </Field>

        <div>
          <label htmlFor={idOf("secondaryAddress")} className="mb-2 block h-5">
            <span className="sr-only">ENS ou carteira secundária (opcional)</span>
          </label>

          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="ENS ou carteira secundária (opcional)"
            className={inputClass}
            {...bind("secondaryAddress", false)}
          />
        </div>

        <Field
          id={idOf("walletType")}
          label="Tipo de carteira"
          required
          error={errors.walletType}
        >
          <SelectBox>
            <select
              autoComplete="off"
              className={`${inputClass} appearance-none pr-9`}
              {...bind("walletType")}
            >
              <option value="">Selecione uma carteira</option>
              <option value="MetaMask">MetaMask</option>
              <option value="Coinbase Wallet">Coinbase Wallet</option>
              <option value="WalletConnect">WalletConnect</option>
            </select>
          </SelectBox>
        </Field>

        <Field
          id={idOf("referralCode")}
          label="Código de indicação"
          required
          error={errors.referralCode}
        >
          <input
            type="text"
            autoComplete="off"
            className={inputClass}
            {...bind("referralCode")}
          />
        </Field>

        <Field id={idOf("email")} label="E-mail" required error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            className={inputClass}
            {...bind("email")}
          />
        </Field>

        <Field
          id={idOf("ensName")}
          label="Nome ENS"
          required
          error={errors.ensName}
        >
          <div className="flex gap-2.5">
            <SelectBox>
              <select
                aria-label="Domínio ENS"
                autoComplete="off"
                className={`${inputClass} w-[78px] appearance-none pr-6`}
                defaultValue=".eth"
              >
                <option value=".eth">.eth</option>
              </select>
            </SelectBox>

            <input
              type="text"
              autoComplete="off"
              className={inputClass}
              {...bind("ensName")}
            />
          </div>
        </Field>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-8 bg-kurio-primary px-6 py-3 text-sm font-bold text-kurio-bg transition-colors hover:bg-[#e6a15f]"
      >
        {isSaving ? "Salvando..." : "Salvar carteira"}
      </button>
    </form>
  )
}

function WalletsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const token = localStorage.getItem("jungle-auth-token")
  const walletsKey = ["wallets", user?.id]
  const walletsQuery = useQuery({
    queryKey: walletsKey,
    queryFn: ({ signal }) =>
      token
        ? getWallets(token, signal)
        : Promise.reject(new Error("Sessão não encontrada.")),
    enabled: Boolean(user && isAuthenticated && token),
  })
  const [walletDraft, setWalletDraft] = useState<{
    userId: string
    data: StoredWallets
  } | null>(null)
  const stored =
    walletDraft && walletDraft.userId === user?.id
      ? walletDraft.data
      : walletsQuery.data ?? { primary: null, secondary: null }
  const [notice, setNotice] = useState("")
  const walletMutation = useMutation({
    mutationFn: (nextWallets: StoredWallets) => {
      if (!token) {
        throw new Error("Sessão não encontrada.")
      }

      return saveWallets(nextWallets, token)
    },
    onSuccess: (savedWallets) => {
      if (user) {
        setWalletDraft({ userId: user.id, data: savedWallets })
      }
      setNotice("Carteiras salvas com sucesso.")
      void queryClient.invalidateQueries({ queryKey: walletsKey })
    },
  })
  const [secondaryOpen, setSecondaryOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({
        to: "/login",
        search: { returnTo: "/wallets" },
        replace: true,
      })
    }
  }, [isLoading, isAuthenticated, navigate])

  function persist(next: StoredWallets) {
    setNotice("Salvando carteiras...")
    walletMutation.mutate(next)
  }

  async function handleLogout() {
    await logout()
    await navigate({ to: "/" })
  }

  if (
    isLoading ||
    !isAuthenticated ||
    !user ||
    walletsQuery.isPending
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

  if (walletsQuery.isError) {
    return (
      <section className="py-24 text-center">
        <p role="alert" className="text-sm text-red-400">
          Não foi possível carregar as carteiras.
        </p>
        <button
          type="button"
          onClick={() => void walletsQuery.refetch()}
          className="mt-5 bg-kurio-primary px-5 py-3 text-sm font-bold text-kurio-bg"
        >
          Tentar novamente
        </button>
      </section>
    )
  }

  const sameAsPrimary =
    stored.primary !== null &&
    stored.secondary !== null &&
    JSON.stringify(stored.primary) === JSON.stringify(stored.secondary)

  const showSecondaryForm =
    !sameAsPrimary && (secondaryOpen || stored.secondary !== null)

  function handleSameAsPrimary(checked: boolean) {
    if (checked) {
      if (!stored.primary) {
        setNotice("Salve a carteira principal antes de copiá-la.")
        return
      }

      persist({ ...stored, secondary: { ...stored.primary } })
      return
    }

    persist({ ...stored, secondary: null })
    setSecondaryOpen(true)
    setNotice("")
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-8 pb-10 pt-8 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-7">
      <AccountSidebar active="wallets" onLogout={() => void handleLogout()} />

      <div className="min-w-0 space-y-10">
        <section aria-labelledby="primary-wallet-title">
          <h1 id="primary-wallet-title" className="text-lg font-bold text-kurio-text">
            Carteira principal
          </h1>

          <p className="mb-8 mt-1 text-sm text-kurio-muted">
            Estas carteiras ficam disponíveis no pagamento e para receber
            NFTs comprados.
          </p>

          <WalletForm
            key={`primary-${user.id}`}
            idPrefix="primary"
            initial={stored.primary ?? emptyWallet}
            isSaving={walletMutation.isPending}
            onSave={(data) => {
              persist({ ...stored, primary: data })
            }}
          />
        </section>

        <section aria-labelledby="secondary-wallet-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="secondary-wallet-title" className="text-lg font-bold text-kurio-text">
              Carteira secundária
            </h2>

            <div className="flex items-center gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-kurio-text">
                <input
                  type="checkbox"
                  checked={sameAsPrimary}
                  onChange={(event) => handleSameAsPrimary(event.target.checked)}
                  className="h-4 w-4 appearance-none rounded-full border-2 border-kurio-primary checked:bg-kurio-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kurio-primary"
                />
                Igual à carteira principal
              </label>

              {!showSecondaryForm && !sameAsPrimary && (
                <button
                  type="button"
                  onClick={() => setSecondaryOpen(true)}
                  className="font-bold text-kurio-primary hover:text-[#e6a15f]"
                >
                  Adicionar
                </button>
              )}
            </div>
          </div>

          {showSecondaryForm ? (
            <div className="mt-6">
              <WalletForm
                key={`secondary-${user.id}`}
                idPrefix="secondary"
                initial={stored.secondary ?? emptyWallet}
                isSaving={walletMutation.isPending}
                onSave={(data) => {
                  persist({ ...stored, secondary: data })
                }}
              />
            </div>
          ) : (
            <p className="mt-1 text-sm text-kurio-muted">
              {sameAsPrimary
                ? "A carteira secundária usa os mesmos dados da principal."
                : "Você ainda não adicionou uma carteira secundária."}
            </p>
          )}
        </section>

        {walletMutation.isError && (
          <p role="alert" className="text-sm text-red-400">
            {isAxiosError<{ message?: string }>(walletMutation.error)
              ? walletMutation.error.response?.data?.message ??
                "Não foi possível salvar as carteiras."
              : "Não foi possível salvar as carteiras."}
          </p>
        )}

        {notice && !walletMutation.isError && (
          <p role="status" className="text-sm text-emerald-400">
            {walletMutation.isPending
              ? notice
              : "Carteiras salvas com sucesso."}
          </p>
        )}
      </div>
    </div>
  )
}
