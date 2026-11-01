
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/65 px-4 py-6 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "Entrar" : "Criar conta"}
        className="relative my-auto w-full max-w-[365px] border border-[#493026] bg-[#281813] shadow-2xl"
      >
        <button
          type="button"
          onClick={() => void navigate({ to: "/" })}
          aria-label="Fechar"
          className="absolute right-3 top-3 text-[#d58d49] transition-colors hover:text-[#f4e8d4]"
        >
          <X size={16} />
        </button>

        <div className="px-8 pb-7 pt-9">
          <div className="flex items-center justify-center gap-1 text-sm font-bold">
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

          {children}
        </div>

        <div className="border-t border-[#493026] px-8 pb-8 pt-4">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#493026]" />

            <span className="text-[10px] text-[#f4e8d4]">
              Ou continue com
            </span>

            <span className="h-px flex-1 bg-[#493026]" />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled
              title="Login com Google ainda não disponível"
              className="flex h-9 w-full cursor-not-allowed items-center justify-center gap-3 rounded border border-[#493026] text-[11px] text-[#a78c70] opacity-65"
            >
              <span className="text-base font-bold text-[#d58d49]">
                G
              </span>
              Continuar com Google
            </button>

            <button
              type="button"
              disabled
              title="Login com Facebook ainda não disponível"
              className="flex h-9 w-full cursor-not-allowed items-center justify-center gap-3 rounded border border-[#493026] text-[11px] text-[#a78c70] opacity-65"
            >
              <span className="text-base font-bold text-[#d58d49]">
                f
              </span>
              Continuar com Facebook
            </button>
          </div>

          <p className="mt-3 text-center text-[10px] text-[#a78c70]">
            Login social indisponível nesta demonstração.
          </p>
        </div>
      </div>
    </div>
  )
}
