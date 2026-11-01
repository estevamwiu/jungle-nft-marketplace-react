import { http, HttpResponse, passthrough } from "msw"

import {
  createMockOrder,
  getMockOrder,
} from "./order-store"
import { mockNfts } from "./nft-store"
import { calculateMockQuote } from "./quote-store"
import {
  getMockScenario,
  waitForMockLatency,
} from "./scenarios"
import type {
  ProfileData,
  StoredWallets,
  WalletData,
} from "@/features/account/types"
import type { QuoteSnapshot } from "@/features/checkout/types"
import { compareEth, isEthAmount } from "@/lib/money"

interface MockUser {
  id: string
  name: string
  email: string
  passwordSalt: string
  passwordHash: string
}

interface CheckoutItem {
  nftId: string
  quantity: number
  expectedPrice: string
}

interface MockSession {
  token: string
  userId: string
}

function isCheckoutItem(value: unknown): value is CheckoutItem {
  return (
    typeof value === "object" &&
    value !== null &&
    "nftId" in value &&
    typeof value.nftId === "string" &&
    "quantity" in value &&
    typeof value.quantity === "number" &&
    Number.isSafeInteger(value.quantity) &&
    value.quantity > 0 &&
    "expectedPrice" in value &&
    isEthAmount(value.expectedPrice)
  )
}

function isQuoteSnapshot(value: unknown): value is QuoteSnapshot {
  return (
    isRecord(value) &&
    typeof value.quoteId === "string" &&
    isEthAmount(value.subtotal) &&
    isEthAmount(value.discount) &&
    isEthAmount(value.networkFee) &&
    isEthAmount(value.total) &&
    (typeof value.couponCode === "string" ||
      value.couponCode === null) &&
    typeof value.createdAt === "string" &&
    typeof value.expiresAt === "string" &&
    Number.isFinite(Date.parse(value.expiresAt)) &&
    Array.isArray(value.items) &&
    value.items.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.image === "string" &&
        isEthAmount(item.price) &&
        typeof item.quantity === "number" &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0
    )
  )
}

function isQuoteItem(value: unknown): value is {
  nftId: string
  quantity: number
} {
  return (
    isRecord(value) &&
    typeof value.nftId === "string" &&
    typeof value.quantity === "number" &&
    Number.isSafeInteger(value.quantity) &&
    value.quantity > 0
  )
}

const USERS_STORAGE_KEY = "kurio-mock-users"

const SESSIONS_STORAGE_KEY = "kurio-mock-sessions"

const FAVORITES_STORAGE_KEY = "kurio-mock-favorites"

const PASSWORD_HASH_ITERATIONS = 120_000

const DEMO_USER: MockUser = {
  id: "1",
  name: "Usuário Demo",
  email: "demo@jungle.com",
  passwordSalt: "kurio-demo-user-v1",
  passwordHash:
    "7ea1e7d46fc84500e5df25ca244cad255ece618f523ab60be4dda7e691f3076f",
}

const SECOND_DEMO_USER: MockUser = {
  id: "2",
  name: "Colecionador Demo",
  email: "collector@jungle.com",
  passwordSalt: "kurio-collector-user-v1",
  passwordHash:
    "a39bf7d8c28ad7925d05ab688fff177655d1d35725a2609bf8edbe5f352cf03b",
}

function isMockUser(value: unknown): value is MockUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.passwordSalt === "string" &&
    typeof value.passwordHash === "string"
  )
}

async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256
  )

  return Array.from(new Uint8Array(bits), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}

function readStoredUsers(): MockUser[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY)

    if (!stored) {
      return [DEMO_USER, SECOND_DEMO_USER]
    }

    const parsed: unknown = JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      localStorage.removeItem(USERS_STORAGE_KEY)
      console.error("[MSW] O armazenamento de usuários não é uma lista.")
      return [DEMO_USER, SECOND_DEMO_USER]
    }

    const validUsers = parsed.filter(isMockUser).map(
      ({ id, name, email, passwordSalt, passwordHash }) => ({
        id,
        name,
        email,
        passwordSalt,
        passwordHash,
      })
    )
    const serialized = JSON.stringify(validUsers)

    if (serialized !== localStorage.getItem(USERS_STORAGE_KEY)) {
      localStorage.setItem(USERS_STORAGE_KEY, serialized)
    }

    const defaults = [DEMO_USER, SECOND_DEMO_USER]
    return [
      ...defaults.map(
        (defaultUser) =>
          validUsers.find((user) => user.email === defaultUser.email) ??
          defaultUser
      ),
      ...validUsers.filter(
        (user) =>
          !defaults.some(
            (defaultUser) => defaultUser.email === user.email
          )
      ),
    ]
  } catch (error) {
    localStorage.removeItem(USERS_STORAGE_KEY)
    console.error("[MSW] Não foi possível ler os usuários salvos.", error)
    return [DEMO_USER, SECOND_DEMO_USER]
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isWalletData(value: unknown): value is WalletData {
  if (!isRecord(value)) {
    return false
  }

  const {
    displayName,
    nickname,
    network,
    profileName,
    address,
    secondaryAddress,
    walletType,
    referralCode,
    email,
    ensName,
  } = value

  if (
    typeof displayName !== "string" ||
    typeof nickname !== "string" ||
    typeof network !== "string" ||
    typeof profileName !== "string" ||
    typeof address !== "string" ||
    typeof secondaryAddress !== "string" ||
    typeof walletType !== "string" ||
    typeof referralCode !== "string" ||
    typeof email !== "string" ||
    typeof ensName !== "string"
  ) {
    return false
  }

  const validAddress =
    network === "Ethereum" || network === "Polygon"
      ? /^0x[a-fA-F0-9]{40}$/.test(address)
      : network === "Solana"
        ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
        : false

  return (
    [
      displayName,
      nickname,
      network,
      profileName,
      address,
      walletType,
      referralCode,
      email,
      ensName,
    ].every((field) => field.trim().length > 0) &&
    validAddress &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    ["MetaMask", "Coinbase Wallet", "WalletConnect"].includes(
      walletType
    )
  )
}

function readProfile(user: MockUser): ProfileData {
  const stored = localStorage.getItem(`kurio-profile-${user.id}`)

  if (!stored) {
    return {
      displayName: user.name,
      username: "",
      ensName: "",
      walletNickname: "",
      avatar: null,
    }
  }

  const parsed: unknown = JSON.parse(stored)

  if (!isRecord(parsed)) {
    throw new Error("Os dados do perfil armazenados estão inválidos.")
  }

  const fields = ["displayName", "username", "ensName", "walletNickname"]

  if (
    !fields.every(
      (field) =>
        parsed[field] === undefined || typeof parsed[field] === "string"
    ) ||
    (parsed.avatar !== undefined &&
      parsed.avatar !== null &&
      typeof parsed.avatar !== "string")
  ) {
    throw new Error("Os dados do perfil armazenados estão inválidos.")
  }

  return {
    displayName:
      typeof parsed.displayName === "string"
        ? parsed.displayName
        : user.name,
    username:
      typeof parsed.username === "string" ? parsed.username : "",
    ensName:
      typeof parsed.ensName === "string" ? parsed.ensName : "",
    walletNickname:
      typeof parsed.walletNickname === "string"
        ? parsed.walletNickname
        : "",
    avatar:
      typeof parsed.avatar === "string" ? parsed.avatar : null,
  }
}

function readWallets(userId: string): StoredWallets {
  const stored = localStorage.getItem(`kurio-wallets-v2-${userId}`)

  if (!stored) {
    return { primary: null, secondary: null }
  }

  const parsed: unknown = JSON.parse(stored)

  if (
    !isRecord(parsed) ||
    (parsed.primary !== null && !isWalletData(parsed.primary)) ||
    (parsed.secondary !== undefined &&
      parsed.secondary !== null &&
      !isWalletData(parsed.secondary))
  ) {
    throw new Error("As carteiras armazenadas estão inválidas.")
  }

  return {
    primary: isWalletData(parsed.primary) ? parsed.primary : null,
    secondary: isWalletData(parsed.secondary)
      ? parsed.secondary
      : null,
  }
}

function readFavorites(userId: string): string[] {
  const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)

  if (!stored) {
    return []
  }

  const parsed: unknown = JSON.parse(stored)

  if (!isRecord(parsed)) {
    throw new Error("O armazenamento de favoritos está inválido.")
  }

  if (!(userId in parsed)) {
    return []
  }

  const favorites = parsed[userId]

  if (
    !Array.isArray(favorites) ||
    !favorites.every(
      (id: unknown): id is string => typeof id === "string"
    )
  ) {
    throw new Error("O armazenamento de favoritos está inválido.")
  }

  return favorites
}

function saveFavorites(userId: string, favorites: string[]) {
  const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
  const parsed: unknown = stored ? JSON.parse(stored) : {}

  if (!isRecord(parsed)) {
    throw new Error("O armazenamento de favoritos está inválido.")
  }

  localStorage.setItem(
    FAVORITES_STORAGE_KEY,
    JSON.stringify({ ...parsed, [userId]: favorites })
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
  if (getMockScenario() === "session-expired") {
    return null
  }

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

export function getMockUserIdFromToken(token: string): string | null {
  if (getMockScenario() === "session-expired") {
    return null
  }
  const session = readStoredSessions().find(
    (item) => item.token === token
  )

  if (!session) {
    return null
  }

  return readStoredUsers().some((user) => user.id === session.userId)
    ? session.userId
    : null
}

let catalogRequestCount = 0

export const handlers = [
  http.get("https://picsum.photos/*", () => {
    return passthrough()
  }),

  http.get("/api/nfts", async ({ request }) => {
    const scenario = getMockScenario()
    const url = new URL(request.url)
    const q = url.searchParams.get("q")?.trim().toLowerCase().slice(0, 100) ?? ""
    const category = url.searchParams.get("category") ?? "all"
    const network = url.searchParams.get("network") ?? "all"
    const sort = url.searchParams.get("sort")
    const minRaw = url.searchParams.get("min")
    const maxRaw = url.searchParams.get("max")
    const min = isEthAmount(minRaw) ? minRaw : undefined
    const max = isEthAmount(maxRaw) ? maxRaw : undefined
    const requestedPage = Number.parseInt(
      url.searchParams.get("page") ?? "1",
      10
    )
    const requestedPageSize = Number.parseInt(
      url.searchParams.get("pageSize") ?? "9",
      10
    )
    const requestIndex = catalogRequestCount
    catalogRequestCount += 1

    if (scenario === "catalog-error" || scenario === "http-error") {
      return HttpResponse.json(
        { message: "O catálogo está temporariamente indisponível." },
        { status: 503 }
      )
    }

    if (scenario === "network-error") {
      return Response.error()
    }

    await waitForMockLatency(scenario, requestIndex)

    if (scenario === "out-of-order") {
      await new Promise((resolve) => {
        window.setTimeout(
          resolve,
          requestedPage === 1 ? 900 : 100
        )
      })
    }

    const categories = [
      ...new Set(mockNfts.map((nft) => nft.category)),
    ].map((name) => ({
      name,
      count: mockNfts.filter((nft) => nft.category === name).length,
    }))
    const prices = mockNfts.map((nft) => nft.price)
    const filtered = mockNfts.filter((nft) => {
      const matchesSearch = nft.name.toLowerCase().includes(q)
      const matchesCategory =
        category === "all" || nft.category === category
      const matchesNetwork =
        network === "all" || nft.network === network
      const matchesMin =
        min === undefined || compareEth(nft.price, min) >= 0
      const matchesMax =
        max === undefined || compareEth(nft.price, max) <= 0

      return (
        matchesSearch &&
        matchesCategory &&
        matchesNetwork &&
        matchesMin &&
        matchesMax
      )
    })

    switch (sort) {
      case "recent":
        filtered.sort((left, right) => Number(right.id) - Number(left.id))
        break
      case "price-asc":
        filtered.sort((left, right) =>
          compareEth(left.price, right.price)
        )
        break
      case "price-desc":
        filtered.sort((left, right) =>
          compareEth(right.price, left.price)
        )
        break
      case "name":
        filtered.sort((left, right) =>
          left.name.localeCompare(right.name)
        )
        break
    }

    const pageSize = Math.max(
      1,
      Math.min(100, requestedPageSize || 9)
    )
    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.max(
      1,
      Math.min(1000, Math.min(requestedPage || 1, totalPages))
    )
    const start = (page - 1) * pageSize

    return HttpResponse.json({
      items: filtered.slice(start, start + pageSize),
      featured: mockNfts.slice(0, 3),
      categories,
      priceRange: {
        min: prices.reduce((minimum, price) =>
          compareEth(price, minimum) < 0 ? price : minimum
        ),
        max: prices.reduce((maximum, price) =>
          compareEth(price, maximum) > 0 ? price : maximum
        ),
      },
      total,
      allTotal: mockNfts.length,
      page,
      pageSize,
      totalPages,
    })
  }),

  http.get("/api/nfts/:id", async ({ params }) => {
    await waitForMockLatency()

    const nft = mockNfts.find(
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

  http.get("/api/favorites", ({ request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        { message: "Faça login para consultar seus favoritos." },
        { status: 401 }
      )
    }

    return HttpResponse.json(readFavorites(user.id))
  }),

  http.put("/api/favorites/:id", ({ params, request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        { message: "Faça login para salvar favoritos." },
        { status: 401 }
      )
    }

    if (getMockScenario() === "favorites-error") {
      return HttpResponse.json(
        { message: "Não foi possível salvar o favorito agora." },
        { status: 503 }
      )
    }

    const nftId = String(params.id)

    if (!mockNfts.some((nft) => nft.id === nftId)) {
      return HttpResponse.json(
        { message: "NFT não encontrado." },
        { status: 404 }
      )
    }

    const favorites = readFavorites(user.id)

    if (!favorites.includes(nftId)) {
      favorites.push(nftId)
      saveFavorites(user.id, favorites)
    }

    return HttpResponse.json(favorites)
  }),

  http.delete("/api/favorites/:id", ({ params, request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        { message: "Faça login para remover favoritos." },
        { status: 401 }
      )
    }

    if (getMockScenario() === "favorites-error") {
      return HttpResponse.json(
        { message: "Não foi possível remover o favorito agora." },
        { status: 503 }
      )
    }

    const nftId = String(params.id)
    const favorites = readFavorites(user.id).filter(
      (id) => id !== nftId
    )
    saveFavorites(user.id, favorites)

    return HttpResponse.json(favorites)
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as {
      email?: string
      password?: string
    }

    const email = body.email?.trim().toLowerCase()
    const password = body.password

    const user = readStoredUsers().find(
      (item) => item.email === email
    )
    const passwordHash = user
      ? await hashPassword(password ?? "", user.passwordSalt)
      : null

    if (!user || passwordHash !== user.passwordHash) {
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

  http.get("/api/profile", ({ request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        { message: "Faça login para consultar seu perfil." },
        { status: 401 }
      )
    }

    return HttpResponse.json(readProfile(user))
  }),

  http.put("/api/profile", async ({ request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        { message: "Faça login para atualizar seu perfil." },
        { status: 401 }
      )
    }

    const body: unknown = await request.json()

    if (
      !isRecord(body) ||
      typeof body.displayName !== "string" ||
      body.displayName.trim().length === 0 ||
      body.displayName.length > 80 ||
      typeof body.username !== "string" ||
      body.username.length > 40 ||
      typeof body.ensName !== "string" ||
      body.ensName.length > 80 ||
      typeof body.walletNickname !== "string" ||
      body.walletNickname.length > 80 ||
      (body.avatar !== null &&
        (typeof body.avatar !== "string" ||
          body.avatar.length > 2_800_000 ||
          !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(body.avatar)))
    ) {
      return HttpResponse.json(
        { message: "Os dados do perfil são inválidos." },
        { status: 400 }
      )
    }

    const profile: ProfileData = {
      displayName: body.displayName.trim(),
      username: body.username.trim(),
      ensName: body.ensName.trim(),
      walletNickname: body.walletNickname.trim(),
      avatar: body.avatar,
    }

    localStorage.setItem(
      `kurio-profile-${user.id}`,
      JSON.stringify(profile)
    )

    return HttpResponse.json(profile)
  }),

  http.patch("/api/profile/password", async ({ request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        { message: "Faça login para alterar sua senha." },
        { status: 401 }
      )
    }

    const body: unknown = await request.json()

    if (
      !isRecord(body) ||
      typeof body.currentPassword !== "string" ||
      typeof body.newPassword !== "string" ||
      body.newPassword.length < 6
    ) {
      return HttpResponse.json(
        { message: "Informe a senha atual e uma nova senha com ao menos 6 caracteres." },
        { status: 400 }
      )
    }

    const currentHash = await hashPassword(
      body.currentPassword,
      user.passwordSalt
    )

    if (currentHash !== user.passwordHash) {
      return HttpResponse.json(
        {
          message: "A senha atual está incorreta.",
          code: "CURRENT_PASSWORD_INVALID",
        },
        { status: 400 }
      )
    }

    const passwordSalt = crypto.randomUUID()
    const passwordHash = await hashPassword(
      body.newPassword,
      passwordSalt
    )
    const users = readStoredUsers().map((storedUser) =>
      storedUser.id === user.id
        ? { ...storedUser, passwordSalt, passwordHash }
        : storedUser
    )

    saveUsers(users)

    return HttpResponse.json({
      message: "Senha alterada com sucesso.",
    })
  }),

  http.get("/api/wallets", ({ request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        { message: "Faça login para consultar suas carteiras." },
        { status: 401 }
      )
    }

    return HttpResponse.json(readWallets(user.id))
  }),

  http.put("/api/wallets", async ({ request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        { message: "Faça login para atualizar suas carteiras." },
        { status: 401 }
      )
    }

    const body: unknown = await request.json()

    if (
      !isRecord(body) ||
      (body.primary !== null && !isWalletData(body.primary)) ||
      (body.secondary !== null && !isWalletData(body.secondary))
    ) {
      return HttpResponse.json(
        { message: "Os dados das carteiras são inválidos." },
        { status: 400 }
      )
    }

    const wallets: StoredWallets = {
      primary: isWalletData(body.primary) ? body.primary : null,
      secondary: isWalletData(body.secondary)
        ? body.secondary
        : null,
    }

    localStorage.setItem(
      `kurio-wallets-v2-${user.id}`,
      JSON.stringify(wallets)
    )

    return HttpResponse.json(wallets)
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

    const passwordSalt = crypto.randomUUID()
    const newUser: MockUser = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordSalt,
      passwordHash: await hashPassword(password, passwordSalt),
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

    let body: unknown

    try {
      body = await request.json()
    } catch (error) {
      if (error instanceof SyntaxError) {
        return HttpResponse.json(
          { message: "O corpo da solicitação não contém JSON válido." },
          { status: 400 }
        )
      }

      throw error
    }

    const items =
      typeof body === "object" &&
      body !== null &&
      "items" in body &&
      Array.isArray(body.items)
        ? body.items
        : null
    const quote =
      typeof body === "object" &&
      body !== null &&
      "quote" in body &&
      isQuoteSnapshot(body.quote)
        ? body.quote
        : null

    if (
      !items ||
      items.length === 0 ||
      !items.every(isCheckoutItem) ||
      new Set(items.map((item) => item.nftId)).size !== items.length ||
      !quote
    ) {
      return HttpResponse.json(
        {
          message: "Os itens do pedido são inválidos ou o carrinho está vazio.",
        },
        {
          status: 400,
        }
      )
    }

    const idempotencyKey =
      request.headers.get("Idempotency-Key")?.trim()

    if (!idempotencyKey || idempotencyKey.length > 128) {
      return HttpResponse.json(
        {
          message:
            "A chave de idempotência é obrigatória e deve ter até 128 caracteres.",
        },
        { status: 400 }
      )
    }

    const result = createMockOrder(
      user.id,
      idempotencyKey,
      items,
      quote
    )

    if (result.kind === "conflict") {
      return HttpResponse.json(
        {
          message:
            "A chave de idempotência já foi usada com outro conteúdo.",
          code: "IDEMPOTENCY_CONFLICT",
        },
        { status: 409 }
      )
    }

    if (result.kind === "unavailable") {
      return HttpResponse.json(
        {
          message: "Um ou mais NFTs do pedido não estão disponíveis.",
          code: "NFT_UNAVAILABLE",
        },
        { status: 409 }
      )
    }

    if (result.kind === "insufficient-stock") {
      return HttpResponse.json(
        {
          message:
            "A quantidade solicitada excede as edições disponíveis de um NFT.",
          code: "INSUFFICIENT_STOCK",
        },
        { status: 409 }
      )
    }

    if (result.kind === "stale-price") {
      return HttpResponse.json(
        {
          message:
            "O preço de um NFT foi atualizado. Revise o novo total antes de confirmar.",
          code: "QUOTE_STALE",
        },
        { status: 409 }
      )
    }

    if (result.kind === "stale-quote") {
      return HttpResponse.json(
        {
          message:
            "A cotação mudou ou expirou. Revise os valores atualizados antes de confirmar.",
          code: "QUOTE_STALE",
          quote: result.quote,
        },
        { status: 409 }
      )
    }

    if (result.kind === "coupon-invalid" || result.kind === "coupon-expired") {
      return HttpResponse.json(
        {
          message:
            result.kind === "coupon-expired"
              ? "Este cupom expirou. Solicite uma nova cotação."
              : "Este cupom não é válido.",
          code:
            result.kind === "coupon-expired"
              ? "COUPON_EXPIRED"
              : "COUPON_INVALID",
        },
        { status: 422 }
      )
    }

    if (result.kind === "invalid") {
      return HttpResponse.json(
        { message: "Um ou mais itens do pedido são inválidos." },
        { status: 400 }
      )
    }

    if (
      result.kind === "created" &&
      getMockScenario() === "payment-timeout"
    ) {
      return HttpResponse.json(
        {
          message:
            "A resposta do pagamento expirou. Você pode tentar novamente sem duplicar o pedido.",
          code: "PAYMENT_TIMEOUT",
        },
        { status: 504 }
      )
    }

    return HttpResponse.json(
      {
        ...result.order,
        message:
          result.order.status === "pending"
            ? "Pedido criado e aguardando confirmação do pagamento."
            : "Tentativa recuperada.",
        replayed: result.kind === "existing",
      },
      { status: result.kind === "created" ? 201 : 200 }
    )
  }),

  http.get("/api/orders/:id", ({ params, request }) => {
    const user = getAuthenticatedUser(request)

    if (!user) {
      return HttpResponse.json(
        { message: "Faça login para consultar este pedido." },
        { status: 401 }
      )
    }

    const order = getMockOrder(String(params.id))

    if (!order || order.userId !== user.id) {
      return HttpResponse.json(
        { message: "Pedido não encontrado." },
        { status: 404 }
      )
    }

    return HttpResponse.json(order)
  }),

  http.post("/api/quotes", async ({ request }) => {
    const scenario = getMockScenario()
    await waitForMockLatency(scenario)

    if (scenario === "quote-error" || scenario === "http-error") {
      return HttpResponse.json(
        { message: "O serviço de cotação está temporariamente indisponível." },
        { status: 503 }
      )
    }

    if (scenario === "network-error") {
      return Response.error()
    }

    let body: unknown

    try {
      body = await request.json()
    } catch (error) {
      if (error instanceof SyntaxError) {
        return HttpResponse.json(
          { message: "O corpo da solicitação não contém JSON válido." },
          { status: 400 }
        )
      }

      throw error
    }

    if (!isRecord(body)) {
      return HttpResponse.json(
        { message: "Os dados da cotação são inválidos." },
        { status: 400 }
      )
    }

    const items = Array.isArray(body.items) ? body.items : null
    const couponCode =
      typeof body.couponCode === "string" ? body.couponCode : ""

    if (
      !items ||
      !items.every(isQuoteItem) ||
      new Set(items.map((item) => item.nftId)).size !== items.length
    ) {
      return HttpResponse.json(
        { message: "Os itens da cotação são inválidos." },
        { status: 400 }
      )
    }

    const result = calculateMockQuote(items, couponCode)

    if (result.kind === "unavailable") {
      return HttpResponse.json(
        {
          message: "Um ou mais NFTs não estão disponíveis.",
          code: "NFT_UNAVAILABLE",
        },
        { status: 409 }
      )
    }

    if (result.kind === "insufficient-stock") {
      return HttpResponse.json(
        {
          message:
            "A quantidade solicitada excede as edições disponíveis de um NFT.",
          code: "INSUFFICIENT_STOCK",
        },
        { status: 409 }
      )
    }

    if (result.kind === "coupon-invalid" || result.kind === "coupon-expired") {
      return HttpResponse.json(
        {
          message:
            result.kind === "coupon-expired"
              ? "Este cupom expirou."
              : "Este código promocional não é válido.",
          code:
            result.kind === "coupon-expired"
              ? "COUPON_EXPIRED"
              : "COUPON_INVALID",
        },
        { status: 422 }
      )
    }

    if (result.kind !== "quoted") {
      return HttpResponse.json(
        { message: "Não foi possível calcular a cotação." },
        { status: 400 }
      )
    }

    return HttpResponse.json(result.quote)
  }),
]