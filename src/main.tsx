
import React from "react"
import ReactDOM from "react-dom/client"

import {
  createRouter,
  RouterProvider,
} from "@tanstack/react-router"

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"

import { routeTree } from "./routeTree.gen"
import "./index.css"
import { CartProvider } from "./features/cart/context/CartContext"
import { AuthProvider } from "@/features/auth/context/Auth.Context"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
    },
  },
})

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

async function bootstrap() {

  const { worker } = await import("./mocks/browser")

  await worker.start()

  ReactDOM.createRoot(
    document.getElementById("root")!
  ).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  )
}

bootstrap().catch(console.error)
