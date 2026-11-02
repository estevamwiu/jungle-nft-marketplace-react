# Arquitetura

## Execução e fluxo de dados

- `src/main.tsx` inicia o service worker do MSW e configura o cenário
  selecionado antes de montar o React.
- O TanStack Router controla o estado das rotas. A busca e os filtros do
  catálogo são representados na URL; mudanças pontuais de filtro, ordenação e
  página criam entradas no histórico do navegador, enquanto a busca por texto
  substitui a entrada atual.
- Os módulos de API usam Axios para chamar os endpoints REST simulados. O
  TanStack Query controla o ciclo de vida das requisições, o cache, o estado das
  alterações e a invalidação.
- `src/mocks/handlers.ts` implementa os contratos REST e valida as
  requisições. Contas, sessões, favoritos, perfis, carteiras e pedidos
  simulados são armazenados no armazenamento local quando precisam persistir
  após uma recarga.
- `src/mocks/order-store.ts` é a fonte de verdade dos pedidos e das chaves de
  idempotência. Antes da criação de um pedido, as cotações validam os preços
  atuais, o estoque, o cupom e a validade.
- `src/mocks/realtime.ts` intercepta o transporte WebSocket compatível com
  Socket.IO por meio de `@mswjs/socket.io-binding`. O navegador continua
  usando `socket.io-client`; os eventos não são enviados diretamente para o
  estado da interface.

## Sessão e isolamento de contas

Cada usuário tem um ID simulado próprio. Os tokens de autenticação identificam
um usuário, e os handlers protegidos validam essa associação. Favoritos,
perfis, carteiras e histórico de pedidos são separados por ID de usuário. O
cenário `session-expired` faz as requisições protegidas retornarem HTTP 401,
permitindo exercitar o fluxo normal de recuperação da autenticação.

As senhas são armazenadas como hashes PBKDF2 com salts individuais por
usuário. As credenciais de demonstração e os dados de exemplo são
intencionalmente fictícios e não devem ser usados como credenciais reais.

## Carrinho e checkout

O carrinho é persistido localmente e não depende do armazenamento de pedidos.
O checkout solicita uma cotação à API simulada e, em seguida, cria um pedido
com o cabeçalho `Idempotency-Key`. Repetir uma tentativa idêntica retorna o
pedido existente; reutilizar a mesma chave com conteúdo diferente gera um
conflito.

Um pedido começa com o status `pending`. O Socket.IO emite o evento
`order.updated`; enquanto o pedido está pendente, o cliente também consulta a
API REST e recupera o estado após uma recarga. Quando o pedido é confirmado,
somente as quantidades compradas são removidas do carrinho atual, preservando
quantidades adicionais incluídas enquanto o pagamento estava pendente. Um
pedido recusado mantém os itens no carrinho. Eventos duplicados ou antigos não
revertem o status final do pedido.

## Cache e sincronização em tempo real

Os dados do catálogo, detalhes, cotações, favoritos e pedidos usam TanStack
Query. Os eventos do socket incluem uma identidade estável do recurso e uma
versão monotonicamente crescente. O cliente rejeita versões duplicadas ou mais
antigas, atualiza os recursos ativos no cache e invalida as consultas do
catálogo e da cotação quando um NFT muda. Após uma reconexão do socket, o
cliente se inscreve novamente nos itens ativos do carrinho e no pedido
pendente; a consulta REST do pedido sincroniza o estado final.

## Limitações do transporte simulado

O service worker do navegador do MSW intercepta as requisições REST, e o
adaptador `@mswjs/socket.io-binding` traduz os eventos do cliente Socket.IO
por meio de uma conexão WebSocket simulada. Isso permite validar o protocolo
do cliente e o comportamento da interface, mas não equivale a um servidor
Socket.IO de produção: não há servidor compartilhado entre navegadores,
infraestrutura de rede, blockchain, extensão de carteira ou gateway de
pagamento. O estado dos pedidos e as alterações dos dados de exemplo ficam
limitados ao contexto do navegador.
