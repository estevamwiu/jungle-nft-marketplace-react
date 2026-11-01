
import { useEffect, type ReactNode } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { X } from "lucide-react"

interface AuthModalProps {
  mode: "login" | "register"
  children: ReactNode
}

export function AuthModal({ mode, children }: AuthModalProps) {
  const navigate = useNavigate()

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        void navigate({ to: "/" })
      }
    }

    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [navigate])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-kurio-bg px-0 py-0 md:bg-black/65 md:px-4 md:py-6 md:backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "Entrar" : "Criar conta"}
        className="relative flex min-h-[100svh] w-full max-w-none flex-col bg-kurio-bg md:my-auto md:min-h-0 md:max-w-[420px] md:rounded-2xl md:border md:border-[#493026] md:bg-[#281813] md:shadow-2xl"
      >
        <button
          type="button"
          onClick={() => void navigate({ to: "/" })}
          aria-label="Fechar"
          className="absolute right-4 top-4 hidden size-9 items-center justify-center rounded text-[#d58d49] transition-colors hover:bg-[#35221a] hover:text-[#f4e8d4] md:flex"
        >
          <X size={16} />
        </button>

        <div className="flex flex-1 flex-col px-7 pb-6 pt-0 md:flex-initial md:px-8 md:pb-8 md:pt-10">
          <Link
            to="/"
            className={`self-center text-3xl font-bold tracking-[0.15em] text-kurio-text md:hidden ${
              mode === "login"
                ? "mb-[10vh] mt-[15vh]"
                : "mb-[10vh] mt-[18vh]"
            }`}
          >
            KURIO
          </Link>

          <h1
            className={`text-center font-bold text-kurio-text md:hidden ${
              mode === "login" ? "mb-9 text-xl" : "text-lg"
            }`}
          >
            {mode === "login" ? "Entrar" : "Criar perfil de colecionador"}
          </h1>

          <div className="hidden items-center justify-center gap-3 text-base font-bold md:flex">
            <Link
              to="/login"
              aria-current={mode === "login" ? "page" : undefined}
              className={
                mode === "login"
                  ? "text-[#d58d49]"
                  : "text-[#f4e8d4] hover:text-[#d58d49]"
              }
            >
              Entrar
            </Link>

            <span className="text-[#a78c70]">|</span>

            <Link
              to="/register"
              aria-current={mode === "register" ? "page" : undefined}
              className={
                mode === "register"
                  ? "text-[#d58d49]"
                  : "text-[#f4e8d4] hover:text-[#d58d49]"
              }
            >
              Criar conta
            </Link>
          </div>

          <div className="w-full">{children}</div>
        </div>

        <div className="mt-auto border-t-0 px-7 pb-8 pt-3 md:mt-0 md:rounded-b-2xl md:border-t md:border-[#493026] md:px-8 md:pb-8 md:pt-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#493026]" />

            <span className="text-xs text-[#f4e8d4]">
              Ou continue com
            </span>

            <span className="h-px flex-1 bg-[#493026]" />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled
              title="Login com Google ainda não disponível"
              className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-3 rounded border border-[#493026] text-xs text-[#a78c70] md:h-11"
            >
              <GoogleIcon />
              Continuar com Google
            </button>

            <button
              type="button"
              disabled
              title="Login com Facebook ainda não disponível"
              className="flex h-10 w-full cursor-not-allowed items-center justify-center gap-3 rounded border border-[#493026] text-xs text-[#a78c70] md:h-11"
            >
              <span className="text-xl font-bold leading-none text-[#4267b2]">
                f
              </span>
              Continuar com Facebook
            </button>
          </div>

          <p className="mt-3 hidden text-center text-[10px] text-[#a78c70] md:block">
            Login social indisponível nesta demonstração.
          </p>

          <p
            className={`text-center text-sm text-kurio-muted md:hidden ${
              mode === "login" ? "mt-[72px]" : "mt-7"
            }`}
          >
            {mode === "login" ? "Novo na Kurio? " : "Já tem uma conta? "}
            <Link
              to={mode === "login" ? "/register" : "/login"}
              className="text-kurio-primary"
            >
              {mode === "login" ? "Crie uma conta" : "Entre"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-5">
      <path
        fill="#FFC107"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#FF3D00"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#4CAF50"
        d="M12.6 27.7a12 12 0 0 1 0-7.4v-5.2H5.8a20 20 0 0 0 0 17.8l6.8-5.2Z"
      />
      <path
        fill="#1976D2"
        d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.5 19.5 0 0 0 24 4 20 20 0 0 0 5.8 15.1l6.8 5.2C14.2 15.5 18.7 12 24 12Z"
      />
    </svg>
  )
}
