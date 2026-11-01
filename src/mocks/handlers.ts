import { http, HttpResponse, passthrough } from "msw"

import type { NFT } from "@/features/nft/types"

const nfts: NFT[] = [
  {
    id: "1",
    name: "Emerald Ape #042",
    description:
      "Um colecionável exclusivo da coleção Emerald Ape. Com seu estilo marcante, óculos verdes e jaqueta sofisticada, representa a combinação entre arte digital e identidade no universo Web3.",
    image: "/images/emerald-ape.png",
    price: 1.19,
    creator: "Kurio Studio",
    category: "Art",
    available: true,
  },
  {
    id: "2",
    name: "Sage Nomad #014",
    description:
      "Um explorador do universo digital. Sage Nomad combina uma estética urbana com elementos clássicos, trazendo personalidade e originalidade para a coleção.",
    image: "/images/sage-nomad.png",
    price: 1.49,
    creator: "Kurio Studio",
    category: "Art",
    available: true,
  },
  {
    id: "3",
    name: "Ivory Baron #052",
    description:
      "Uma peça digital que representa elegância e exclusividade. Ivory Baron apresenta um personagem de visual sofisticado, criado para colecionadores que valorizam arte e identidade.",
    image: "/images/ivory-baron.png",
    price: 0.99,
    creator: "Kurio Studio",
    category: "Art",
    available: true,
  },
  {
    id: "4",
    name: "Cosmic Bloom #118",
    description:
      "Uma edição especial inspirada na exploração de novos universos digitais. Cosmic Bloom combina criatividade, expressão artística e o espírito das coleções NFT.",
    image: "/images/sage-nomad.png",
    price: 1.29,
    creator: "Kurio Collective",
    category: "Collectibles",
    available: true,
  },
  {
    id: "5",
    name: "Violet Nomad #214",
    description:
      "Uma variação exclusiva da coleção Nomad. Seu visual característico representa liberdade, criatividade e novas possibilidades no universo dos colecionáveis digitais.",
    image: "/images/sage-nomad.png",
    price: 1.29,
    creator: "Kurio Collective",
    category: "Collectibles",
    available: true,
  },
  {
    id: "6",
    name: "Ivory Baron #085",
    description:
      "Uma edição alternativa da coleção Ivory Baron, desenvolvida para representar sofisticação e personalidade em uma experiência digital colecionável.",
    image: "/images/ivory-baron.png",
    price: 1.79,
    creator: "Kurio Studio",
    category: "Art",
    available: true,
  },
  {
    id: "7",
    name: "Golden Spirit #207",
    description:
      "Golden Spirit representa energia, criatividade e conexão com a cultura digital. Seu visual dourado e seus acessórios modernos tornam esta peça única.",
    image: "/images/golden-spirit.png",
    price: 0.99,
    creator: "Kurio Collective",
    category: "Collectibles",
    available: true,
  },
  {
    id: "8",
    name: "Golden Spirit #108",
    description:
      "Uma edição da coleção Golden Spirit que celebra a expressão individual e a criatividade. Uma peça para colecionadores apaixonados por arte digital.",
    image: "/images/golden-spirit.png",
    price: 0.39,
    creator: "Kurio Collective",
    category: "Collectibles",
    available: true,
  },
]

interface MockUser {
  id: string
  name: string
  email: string
  password: string
}

interface CheckoutItem {
  nftId: string
  quantity: number
}

interface CheckoutRequest {
  items?: CheckoutItem[]
}

interface MockSession {
  token: string
  userId: string
}

const USERS_STORAGE_KEY = "kurio-mock-users"

const SESSIONS_STORAGE_KEY = "kurio-mock-sessions"

const DEMO_USER: MockUser = {
  id: "1",
  name: "Usuário Demo",
  email: "demo@jungle.com",
  password: "123456",
}

function readStoredUsers(): MockUser[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY)

    if (!stored) {
      return [DEMO_USER]
    }

    const parsed: unknown = JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return [DEMO_USER]
    }

    const validUsers = parsed.filter(
      (item): item is MockUser =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.email === "string" &&
        typeof item.password === "string"
    )

    return [
      DEMO_USER,
      ...validUsers.filter(
        (user) => user.email !== DEMO_USER.email
      ),
    ]
  } catch {
    return [DEMO_USER]
  }
}

function saveUsers(users: MockUser[]) {
  localStorage.setItem(
    USERS_STORAGE_KEY,
    JSON.stringify(users)
  )
}

function readStoredSessions(): MockSession[] {
  try {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY)

    if (!stored) {
      return []
    }

    const parsed: unknown = JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (item): item is MockSession =>
        typeof item === "object" &&
        item !== null &&
        typeof item.token === "string" &&
        typeof item.userId === "string"
    )
  } catch {
    return []
  }
}

function saveSessions(sessions: MockSession[]) {
  localStorage.setItem(
    SESSIONS_STORAGE_KEY,
    JSON.stringify(sessions)
  )
}

function toPublicUser(user: MockUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  }
}

function getToken(request: Request): string | null {
  const authorization = request.headers.get("Authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice(7)
}

function getAuthenticatedUser(
  request: Request
): MockUser | null {
  const token = getToken(request)

  if (!token) {
    return null
  }

  const session = readStoredSessions().find(
    (item) => item.token === token
  )

  if (!session) {
    return null
  }

  return (
    readStoredUsers().find(
      (user) => user.id === session.userId
    ) ?? null
  )
}

export const handlers = [
  http.get("https://picsum.photos/*", () => {
    return passthrough()
  }),

  http.get("/", () => {
    return passthrough()
  }),

  http.get("/api/nfts", () => {
    return HttpResponse.json(nfts)
  }),

  http.get("/api/nfts/:id", ({ params }) => {
    const nft = nfts.find(
      (item) => item.id === params.id
    )

    if (!nft) {
      return HttpResponse.json(
        {
          message: "NFT não encontrado.",
        },
        {
          status: 404,
        }
      )
    }

    return HttpResponse.json(nft)
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as {
      email?: string
      password?: string
    }

    const email = body.email?.trim().toLowerCase()
    const password = body.password

    const user = readStoredUsers().find(
      (item) =>
        item.email === email &&
        item.password === password
    )

    if (!user) {
      return HttpResponse.json(
        {
          message: "E-mail ou senha inválidos.",
        },
        {
          status: 401,
        }
      )
    }

    const token = crypto.randomUUID()

    const sessions = readStoredSessions()

    sessions.push({
      token,
      userId: user.id,
    })

    saveSessions(sessions)

    return HttpResponse.json({
      user: toPublicUser(user),
      token,
    })
  }),

  http.get("/api/auth/me", ({ request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        {
          message: "Não autorizado.",
        },
        {
          status: 401,
        }
      )
    }

    return HttpResponse.json({
      user: toPublicUser(user),
    })
  }),

  http.post("/api/auth/logout", ({ request }) => {
    const token = getToken(request)

    if (token) {
      const sessions = readStoredSessions().filter(
        (session) => session.token !== token
      )

      saveSessions(sessions)
    }

    return HttpResponse.json({
      message: "Logout realizado com sucesso.",
    })
  }),

  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as {
      name?: string
      email?: string
      password?: string
    }

    const name = body.name?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!name || !email || !password) {
      return HttpResponse.json(
        {
          message: "Preencha todos os campos.",
        },
        {
          status: 400,
        }
      )
    }

    if (name.length < 3) {
      return HttpResponse.json(
        {
          message: "O nome deve ter pelo menos 3 caracteres.",
        },
        {
          status: 400,
        }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return HttpResponse.json(
        {
          message: "Informe um e-mail válido.",
        },
        {
          status: 400,
        }
      )
    }

    if (password.length < 6) {
      return HttpResponse.json(
        {
          message: "A senha deve ter pelo menos 6 caracteres.",
        },
        {
          status: 400,
        }
      )
    }

    const users = readStoredUsers()

    const emailExists = users.some(
      (user) => user.email === email
    )

    if (emailExists) {
      return HttpResponse.json(
        {
          message: "Este e-mail já está cadastrado.",
        },
        {
          status: 409,
        }
      )
    }

    const newUser: MockUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
    }

    users.push(newUser)

    saveUsers(users)

    return HttpResponse.json(
      {
        user: toPublicUser(newUser),
        message: "Usuário cadastrado com sucesso.",
      },
      {
        status: 201,
      }
    )
  }),

  http.post("/api/checkout", async ({ request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        {
          message: "Faça login para finalizar a compra.",
        },
        {
          status: 401,
        }
      )
    }

    const body = (await request.json()) as CheckoutRequest

    if (
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return HttpResponse.json(
        {
          message: "O carrinho está vazio.",
        },
        {
          status: 400,
        }
      )
    }

    let total = 0

    for (const item of body.items) {
      const nft = nfts.find(
        (nft) => nft.id === item.nftId
      )

      if (!nft) {
        return HttpResponse.json(
          {
            message: "NFT não encontrado.",
          },
          {
            status: 404,
          }
        )
      }

      if (!nft.available) {
        return HttpResponse.json(
          {
            message: `O NFT ${nft.name} não está disponível.`,
          },
          {
            status: 400,
          }
        )
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return HttpResponse.json(
          {
            message: "Quantidade inválida.",
          },
          {
            status: 400,
          }
        )
      }

      total += nft.price * item.quantity
    }

    const orderId = crypto.randomUUID()

    return HttpResponse.json(
      {
        orderId,
        message: "Compra realizada com sucesso!",
        total: Number(total.toFixed(8)),
      },
      {
        status: 201,
      }
    )
  }),
]