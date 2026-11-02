import type { NFT } from "@/features/nft/types"
import type { NftUpdatedEvent } from "@/features/realtime/types"
import { addEth } from "@/lib/money"

const nftFixtures: Omit<NFT, "availableQuantity">[] = [
  {
    id: "1",
    name: "Emerald Ape #042",
    description:
    "Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.",
    image: "/images/emerald-ape.webp",
    price: "1.19",
    creator: "Kurio Studio",
    category: "Digital Art",
    available: true,
  },
  {
    id: "2",
    name: "Sage Nomad #014",
    description:
      "Um explorador do universo digital. Sage Nomad combina uma estética urbana com elementos clássicos, trazendo personalidade e originalidade para a coleção.",
    image: "/images/sage-nomad.webp",
    price: "1.49",
    creator: "Kurio Studio",
    category: "Digital Art",
    available: true,
  },
  {
    id: "3",
    name: "Ivory Baron #052",
    description:
      "Uma peça digital que representa elegância e exclusividade. Ivory Baron apresenta um personagem de visual sofisticado, criado para colecionadores que valorizam arte e identidade.",
    image: "/images/ivory-baron.webp",
    price: "0.99",
    creator: "Kurio Studio",
    category: "Digital Art",
    available: true,
  },
  {
    id: "4",
    name: "Cosmic Bloom #118",
    description:
      "Uma edição especial inspirada na exploração de novos universos digitais. Cosmic Bloom combina criatividade, expressão artística e o espírito das coleções NFT.",
    image: "/images/sage-nomad.webp",
    price: "1.29",
    creator: "Kurio Collective",
    category: "Collectibles",
    available: true,
  },
  {
    id: "5",
    name: "Violet Nomad #214",
    description:
      "Uma variação exclusiva da coleção Nomad. Seu visual característico representa liberdade, criatividade e novas possibilidades no universo dos colecionáveis digitais.",
    image: "/images/sage-nomad.webp",
    price: "1.29",
    creator: "Kurio Collective",
    category: "Collectibles",
    available: true,
  },
  {
    id: "6",
    name: "Ivory Baron #085",
    description:
      "Uma edição alternativa da coleção Ivory Baron, desenvolvida para representar sofisticação e personalidade em uma experiência digital colecionável.",
    image: "/images/ivory-baron.webp",
    price: "1.79",
    creator: "Kurio Studio",
    category: "Art",
    available: true,
  },
  {
    id: "7",
    name: "Golden Spirit #207",
    description:
      "Golden Spirit representa energia, criatividade e conexão com a cultura digital. Seu visual dourado e seus acessórios modernos tornam esta peça única.",
    image: "/images/golden-spirit.webp",
    price: "0.99",
    creator: "Kurio Collective",
    category: "Collectibles",
    available: true,
  },
  {
    id: "8",
    name: "Golden Spirit #108",
    description:
      "Uma edição da coleção Golden Spirit que celebra a expressão individual e a criatividade. Uma peça para colecionadores apaixonados por arte digital.",
    image: "/images/golden-spirit.webp",
    price: "0.39",
    creator: "Kurio Collective",
    category: "Collectibles",
    available: true,
  },
  {
    id: "9",
    name: "Quiet Current #019",
    description: "Uma fotografia de longa exposição que transforma água e luz em uma paisagem digital contemplativa.",
    image: "/images/emerald-ape.webp",
    price: "0.72",
    creator: "Mira Vale",
    category: "Photography",
    available: true,
  },
  {
    id: "10",
    name: "Signal Bloom #031",
    description: "Uma composição audiovisual que combina formas orgânicas e ritmos eletrônicos.",
    image: "/images/golden-spirit.webp",
    price: "0.85",
    creator: "Aster Audio",
    category: "Music",
    available: true,
  },
  {
    id: "11",
    name: "Soft Geometry #006",
    description: "Escultura 3D criada com geometria modular e uma paleta inspirada em minerais.",
    image: "/images/ivory-baron.webp",
    price: "1.05",
    creator: "Nilo Form",
    category: "3D Art",
    available: true,
  },
  {
    id: "12",
    name: "Garden Key #012",
    description: "Um passe colecionável que representa acesso a experiências digitais da comunidade.",
    image: "/images/sage-nomad.webp",
    price: "0.25",
    creator: "Kurio Collective",
    category: "Utility",
    available: true,
  },
  {
    id: "13",
    name: "Afterglow #027",
    description: "Fotografia digital de uma cidade ao entardecer, com cores que mudam conforme a luz.",
    image: "/images/golden-spirit.webp",
    price: "0.64",
    creator: "Mira Vale",
    category: "Photography",
    available: true,
  },
  {
    id: "14",
    name: "Glass Orbit #003",
    description: "Uma peça 3D que explora transparência, reflexos e movimento orbital.",
    image: "/images/emerald-ape.webp",
    price: "1.32",
    creator: "Nilo Form",
    category: "3D Art",
    available: true,
  },
  {
    id: "15",
    name: "Low Tide #041",
    description: "Faixa instrumental colecionável inspirada no movimento lento das marés.",
    image: "/images/sage-nomad.webp",
    price: "0.48",
    creator: "Aster Audio",
    category: "Music",
    available: true,
  },
  {
    id: "16",
    name: "Open Studio #008",
    description: "Passe de acesso a encontros e materiais exclusivos do estúdio Kurio.",
    image: "/images/ivory-baron.webp",
    price: "0.31",
    creator: "Kurio Collective",
    category: "Utility",
    available: true,
  },
  {
    id: "17",
    name: "Blue Hour #052",
    description: "Uma fotografia da hora azul que registra a transição entre o dia e a noite.",
    image: "/images/emerald-ape.webp",
    price: "0.93",
    creator: "Mira Vale",
    category: "Photography",
    available: true,
  },
  {
    id: "18",
    name: "Tidal Memory #011",
    description: "Paisagem sonora original acompanhada por arte digital abstrata.",
    image: "/images/golden-spirit.webp",
    price: "0.57",
    creator: "Aster Audio",
    category: "Music",
    available: true,
  },
  {
    id: "19",
    name: "Cloud Archive #002",
    description: "Escultura digital formada por volumes suaves e texturas inspiradas em nuvens.",
    image: "/images/sage-nomad.webp",
    price: "1.14",
    creator: "Nilo Form",
    category: "3D Art",
    available: true,
  },
  {
    id: "20",
    name: "Creator Pass #004",
    description: "Passe utilitário para participar de lançamentos e votações da comunidade.",
    image: "/images/ivory-baron.webp",
    price: "0.42",
    creator: "Kurio Collective",
    category: "Utility",
    available: true,
  },
  {
    id: "21",
    name: "Fractal Dawn #021",
    description: "Composição generativa que transforma padrões matemáticos em uma paisagem de cores quentes.",
    image: "/images/emerald-ape.webp",
    price: "0.88",
    creator: "Mira Vale",
    category: "Generative",
    available: true,
  },
  {
    id: "22",
    name: "Pixel Quest #022",
    description: "Item colecionável de uma aventura independente ambientada em um mundo digital.",
    image: "/images/sage-nomad.webp",
    price: "0.52",
    creator: "Kurio Games",
    category: "Games",
    available: true,
  },
  {
    id: "23",
    name: "Studio Circle #023",
    description: "Assinatura digital com acesso a novidades e encontros da comunidade criativa.",
    image: "/images/golden-spirit.webp",
    price: "0.35",
    creator: "Kurio Collective",
    category: "Subscriptions",
    available: true,
  },
  {
    id: "24",
    name: "Verdant Vision #024",
    description: "Obra digital exclusiva inspirada por novas formas de expressão na internet.",
    image: "/images/emerald-ape.webp",
    price: "1.08",
    creator: "Kurio Studio",
    category: "Digital Art",
    available: true,
  },
  {
    id: "25",
    name: "Stillwater #025",
    description: "Fotografia digital que registra a luz suave do amanhecer sobre a água.",
    image: "/images/sage-nomad.webp",
    price: "0.76",
    creator: "Mira Vale",
    category: "Photography",
    available: true,
  },
  {
    id: "26",
    name: "Amber Frequency #026",
    description: "Faixa musical original acompanhada por uma identidade visual colecionável.",
    image: "/images/golden-spirit.webp",
    price: "0.68",
    creator: "Aster Audio",
    category: "Music",
    available: true,
  },
  {
    id: "27",
    name: "Orbit Vessel #027",
    description: "Escultura 3D que explora formas fluidas e superfícies metálicas.",
    image: "/images/ivory-baron.webp",
    price: "1.24",
    creator: "Nilo Form",
    category: "3D Art",
    available: true,
  },
  {
    id: "28",
    name: "Nomad Relic #028",
    description: "Peça colecionável de edição limitada da comunidade Kurio.",
    image: "/images/sage-nomad.webp",
    price: "0.94",
    creator: "Kurio Collective",
    category: "Collectibles",
    available: true,
  },
  {
    id: "29",
    name: "Open Gallery #029",
    description: "Passe utilitário para acessar experiências e lançamentos selecionados.",
    image: "/images/emerald-ape.webp",
    price: "0.44",
    creator: "Kurio Collective",
    category: "Utility",
    available: true,
  },
]

const networks = ["Ethereum", "Polygon", "Solana"] as const

export const mockNfts: NFT[] = nftFixtures.map((nft, index) => ({
  ...nft,
  network: networks[index % networks.length],
  availableQuantity: nft.available ? 5 : 0,
}))

const nftVersions = new Map(
  mockNfts.map((nft) => [nft.id, 0])
)

export function updateMockNftPrice(
  id: string
): NftUpdatedEvent | null {
  const nft = mockNfts.find((item) => item.id === id)

  if (!nft) {
    return null
  }

  nft.price = addEth(nft.price, "0.01")

  const version = (nftVersions.get(id) ?? 0) + 1
  nftVersions.set(id, version)

  return {
    eventId: crypto.randomUUID(),
    resource: {
      type: "nft",
      id,
    },
    version,
    data: {
      id: nft.id,
      price: nft.price,
      available: nft.available,
      availableQuantity: nft.availableQuantity,
    },
  }
}

export function purchaseMockNftStock(
  items: Array<{ nftId: string; quantity: number }>
): NftUpdatedEvent[] | null {
  const selectedNfts = items.map(({ nftId }) =>
    mockNfts.find((nft) => nft.id === nftId)
  )

  if (
    selectedNfts.some(
      (nft, index) =>
        !nft ||
        !nft.available ||
        nft.availableQuantity < items[index].quantity
    )
  ) {
    return null
  }

  return items.map(({ nftId, quantity }, index) => {
    const nft = selectedNfts[index]

    if (!nft) {
      throw new Error("O NFT desapareceu durante a baixa do estoque.")
    }

    nft.availableQuantity -= quantity
    nft.available = nft.availableQuantity > 0

    const version = (nftVersions.get(nftId) ?? 0) + 1
    nftVersions.set(nftId, version)

    return {
      eventId: crypto.randomUUID(),
      resource: {
        type: "nft",
        id: nftId,
      },
      version,
      data: {
        id: nft.id,
        price: nft.price,
        available: nft.available,
        availableQuantity: nft.availableQuantity,
      },
    }
  })
}
