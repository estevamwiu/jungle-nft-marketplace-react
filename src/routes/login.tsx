
import { useState, type FormEvent } from "react"
import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router"
import { Eye, EyeOff } from "lucide-react"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { AuthModal } from "@/features/auth/components/Auth.Modal"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

const inputClass =
  "h-[31px] w-full rounded border border-[#493026] bg-[#21130f] px-3 text-[11px] text-[#f4e8d4] outline-none transition-colors placeholder:text-[#a78c70] focus:border-[#d58d49] disabled:opacity-50"

function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail || !password.trim()) {
      setError("Preencha todos os campos.")
      return
    }

    setIsSubmitting(true)

    try {
      const success = await login({
        email: normalizedEmail,
        password,
      })

      if (!success) {
        setError("E-mail ou senha inválidos.")
        return
      }

      await navigate({ to: "/" })
    } catch {
      setError("Não foi possível realizar o login. Tente novamente.")
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

          <p className="mt-3 text-xs text-[#a78c70]">
            Sua sessão está ativa na Kurio.
          </p>

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
    <AuthModal mode="login">
      <p className="mt-7 text-center text-[10px] leading-4 text-[#f4e8d4]">
        Entre para gerenciar sua carteira, coleção e perfil
        de criador.
      </p>

      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mx-auto mt-5 max-w-[248px] space-y-2"
      >
        <label htmlFor="login-email" className="sr-only">
          E-mail
        </label>

        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setError("")
          }}
          placeholder="contato@email.com"
          autoComplete="email"
          required
          disabled={isSubmitting}
          className={inputClass}
        />

        <div className="relative">
          <label htmlFor="login-password" className="sr-only">
            Senha
          </label>

          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setError("")
            }}
            placeholder="Senha"
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            className={`${inputClass} pr-10`}
          />

          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            disabled={isSubmitting}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#a78c70] hover:text-[#d58d49]"
          >
            {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
        </div>

        <div className="text-right">
          <span
            title="Recuperação de senha indisponível nesta demonstração"
            className="cursor-not-allowed text-[10px] text-[#d58d49] opacity-70"
          >
            Esqueceu a senha?
          </span>
        </div>

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
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-4 text-center text-[10px] text-[#a78c70]">
        Conta demo: demo@jungle.com / 123456
      </p>
    </AuthModal>
  )
}
