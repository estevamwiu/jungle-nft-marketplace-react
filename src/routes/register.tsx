
import { useState, type FormEvent } from "react"
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router"
import { isAxiosError } from "axios"

import { registerRequest } from "@/features/auth/api/auth-api"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/register")({
  component: RegisterPage,
})

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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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
        setError(
          "Ocorreu um erro inesperado. Tente novamente."
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <p className="py-20 text-center text-slate-400">
        Verificando sessão...
      </p>
    )
  }

  if (isAuthenticated) {
    return (
      <section className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-2xl font-bold">
          Você já está autenticado!
        </h1>

        <Button
          className="mt-6"
          onClick={() => void navigate({ to: "/" })}
        >
          Voltar ao marketplace
        </Button>
      </section>
    )
  }

  return (
    <section className="flex min-h-[75vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-center text-3xl font-bold">
          Criar conta
        </h1>

        <p className="mt-2 text-center text-slate-400">
          Cadastre-se no Jungle NFT Marketplace
        </p>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mt-8 space-y-5"
        >
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium"
            >
              Nome completo
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Digite seu nome"
              autoComplete="name"
              required
              minLength={3}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="mb-2 block text-sm font-medium"
            >
              E-mail
            </label>

            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="mb-2 block text-sm font-medium"
            >
              Senha
            </label>

            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              required
              minLength={6}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-medium"
            >
              Confirmar senha
            </label>

            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Digite a senha novamente"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) =>
                setShowPassword(event.target.checked)
              }
            />
            Mostrar senhas
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-800 bg-red-950 p-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Cadastrando..."
              : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Já possui uma conta?{" "}
          <Link
            to="/login"
            className="font-semibold text-violet-400 hover:text-violet-300"
          >
            Entrar
          </Link>
        </p>
      </div>
    </section>
  )
}
