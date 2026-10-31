
import { useState, type FormEvent } from "react"
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()

  const { login, isAuthenticated, isLoading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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
      setError(
        "Não foi possível realizar o login. Tente novamente."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div
        role="status"
        className="flex min-h-[75vh] items-center justify-center"
      >
        <p className="text-slate-400">
          Verificando sessão...
        </p>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <section className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-2xl font-bold">
          Você já está autenticado!
        </h1>

        <p className="mt-3 text-slate-400">
          Sua sessão está ativa no Jungle NFT Marketplace.
        </p>

        <Button
          type="button"
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
          Entrar
        </h1>

        <p className="mt-2 text-center text-slate-400">
          Acesse sua conta no Jungle NFT Marketplace
        </p>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="mt-8 space-y-5"
        >

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError("")
              }}
              placeholder="seu@email.com"
              autoComplete="email"
              required
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Senha
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError("")
                }}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 pr-24 text-white outline-none focus:border-violet-500 disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                disabled={isSubmitting}
                aria-label={
                  showPassword
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-violet-400 hover:text-violet-300 disabled:opacity-50"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

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
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 rounded-lg border border-slate-700 p-4 text-sm">
          <p className="mb-2 font-semibold">
            Conta de demonstração
          </p>

          <p className="text-slate-400">
            E-mail: demo@jungle.com
          </p>

          <p className="text-slate-400">
            Senha: 123456
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          Ainda não possui uma conta?{" "}
          <Link
            to="/register"
            className="font-semibold text-violet-400 hover:text-violet-300"
          >
            Cadastre-se
          </Link>
        </p>

      </div>
    </section>
  )
}
