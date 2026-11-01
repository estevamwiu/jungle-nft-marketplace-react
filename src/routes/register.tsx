
import { useState, type FormEvent } from "react"
import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router"
import { isAxiosError } from "axios"
import { Eye, EyeOff } from "lucide-react"

import { registerRequest } from "@/features/auth/api/auth-api"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { AuthModal } from "@/features/auth/components/Auth.Modal"

export const Route = createFileRoute("/register")({
  component: RegisterPage,
})

const inputClass =
  "h-[31px] w-full rounded border border-[#493026] bg-[#21130f] px-3 text-[11px] text-[#f4e8d4] outline-none transition-colors placeholder:text-[#a78c70] focus:border-[#d58d49] disabled:opacity-50"

function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (
      !normalizedName ||
      !normalizedEmail ||
      !password ||
      !confirmPassword
    ) {
      setError("Preencha todos os campos.")
      return
    }

    if (normalizedName.length < 3) {
      setError("O nome deve ter pelo menos 3 caracteres.")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }

    setIsSubmitting(true)

    try {
      await registerRequest({
        name: normalizedName,
        email: normalizedEmail,
        password,
      })

      await navigate({ to: "/login" })
    } catch (err: unknown) {
      if (isAxiosError<{ message?: string }>(err)) {
        setError(
          err.response?.data?.message ??
            "Não foi possível realizar o cadastro."
        )
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div
        role="status"
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 text-sm text-[#f4e8d4]"
      >
        Verificando sessão...
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
        <div className="w-full max-w-sm border border-[#493026] bg-[#281813] p-8 text-center">
          <h1 className="text-lg font-bold text-[#f4e8d4]">
            Você já está autenticado!
          </h1>

          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            className="mt-6 rounded bg-[#d58d49] px-6 py-3 text-xs font-bold text-[#160e0b]"
          >
            Voltar ao marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthModal mode="register">
      <p className="mt-7 text-center text-[10px] leading-4 text-[#f4e8d4]">
        Crie seu perfil de colecionador e conecte uma
        carteira quando quiser.
      </p>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mx-auto mt-5 max-w-[248px] space-y-2"
      >
        <label htmlFor="register-name" className="sr-only">
          Nome de usuário
        </label>

        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError("")
          }}
          placeholder="Nome de usuário"
          autoComplete="username"
          minLength={3}
          required
          disabled={isSubmitting}
          className={inputClass}
        />

        <label htmlFor="register-email" className="sr-only">
          E-mail
        </label>

        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setError("")
          }}
          placeholder="Digite seu e-mail"
          autoComplete="email"
          required
          disabled={isSubmitting}
          className={inputClass}
        />

        <div className="relative">
          <label htmlFor="register-password" className="sr-only">
            Senha
          </label>

          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError("")
            }}
            placeholder="Senha"
            autoComplete="new-password"
            minLength={6}
            required
            disabled={isSubmitting}
            className={`${inputClass} pr-10`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            disabled={isSubmitting}
            aria-label={showPassword ? "Ocultar senhas" : "Mostrar senhas"}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a78c70] hover:text-[#d58d49]"
          >
            {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        </div>

        <label htmlFor="register-confirm-password" className="sr-only">
          Confirmar senha
        </label>

        <input
          id="register-confirm-password"
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            setError("")
          }}
          placeholder="Confirmar senha"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          className={inputClass}
        />

        {error && (
          <p
            role="alert"
            className="border border-red-900/60 bg-red-950/20 p-2 text-[11px] text-red-300"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 h-[34px] w-full rounded bg-[#d58d49] text-xs font-bold text-[#160e0b] transition-colors hover:bg-[#e6a15f] disabled:opacity-50"
        >
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </button>
      </form>
    </AuthModal>
  )
}
