# Jungle NFT Marketplace

Marketplace frontend desenvolvido com React, TypeScript, TanStack Router e
TanStack Query. A API, as sessões, as carteiras, o checkout e as atualizações em
tempo real são simulados localmente pelo MSW; não é necessário um backend de
produção nem uma carteira blockchain.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm
- Node.js 22.19+ ou 24+ para executar a auditoria do Lighthouse

## Executar localmente

```bash
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. O MSW é iniciado antes da renderização do
React, então a API simulada também está disponível nas versões de
desenvolvimento e produção. Não são necessárias variáveis de ambiente nem
serviços externos.

## Publicar na Vercel

Este repositório está configurado como uma aplicação de página única (SPA) com
Vite. A regra de reescrita em `vercel.json` direciona as rotas do cliente de
volta para `index.html`, permitindo abrir links diretamente, como `/profile`
e `/nft/1`, após a publicação.

1. Envie o projeto para um repositório no GitHub.
2. Na Vercel, selecione **Add New → Project** e importe o repositório.
3. Mantenha as configurações Vite detectadas ou informe:
   - Predefinição do framework: **Vite**
   - Comando de instalação: `npm ci`
   - Comando de build: `npm run build`
   - Diretório de saída: `dist`
4. Não é necessário configurar variáveis de ambiente. Selecione **Deploy**.

O site publicado usa a mesma API simulada pelo MSW descrita abaixo. Contas,
catálogo, carteiras, checkout e eventos em tempo real são demonstrações: não
há backend de produção, conexão real com carteiras, processamento de pagamentos
ou transferência de NFTs.

## Contas de demonstração

| E-mail | Senha |
| --- | --- |
| `demo@jungle.com` | `123456` |
| `collector@jungle.com` | `123456` |

Essas contas locais são fictícias. As senhas são representadas por hashes PBKDF2
no mock; a senha de demonstração nunca é armazenada em texto puro.

## Cenários de simulação

Adicione `?scenario=<name>` ao endereço da aplicação. O cenário escolhido é
salvo no armazenamento local e continua ativo durante a navegação.

| Cenário | Efeito |
| --- | --- |
| `default` | Respostas simuladas normais e pagamentos confirmados |
| `latency` | Adiciona 1,2 segundo às requisições do catálogo |
| `variable-latency` | Adiciona atrasos reproduzíveis de 250 a 1.300 ms às requisições do catálogo |
| `out-of-order` | Atrasa páginas antigas do catálogo e emite eventos de pedido duplicados e desatualizados |
| `network-error` | Simula falha de conexão nas requisições do catálogo e das cotações |
| `http-error` | Retorna HTTP 503 para requisições do catálogo e das cotações |
| `catalog-error` | Retorna HTTP 503 para requisições do catálogo |
| `quote-error` | Retorna HTTP 503 para requisições de cotação |
| `favorites-error` | Retorna HTTP 503 para alterações nos favoritos |
| `session-expired` | Rejeita requisições autenticadas simuladas |
| `payment-timeout` | Persiste o pedido e depois retorna HTTP 504, permitindo recuperá-lo com uma nova tentativa idempotente |
| `payment-declined` | Finaliza o pedido pendente como recusado pelo Socket.IO simulado |
| `socket-disconnect` | Fecha o WebSocket simulado enquanto há um pedido pendente; a reconexão ou recarga reconcilia o estado pela API REST |
| `wallet-rejected` | Rejeita a conexão simulada com a carteira |

Redefina os dados simulados, o estado da conta e da sessão, o carrinho, os
favoritos, os perfis, as carteiras, os cupons e os pedidos acessando:

```text
http://localhost:5173/?scenario=reset
```

A página redefine o armazenamento, muda para `default` e remove o parâmetro de
redefinição do endereço.

## Comandos

```bash
npm run dev              # Servidor de desenvolvimento com MSW
npm run typecheck        # Verificações de tipos do TypeScript
npm run lint             # ESLint
npm run build            # Verifica os tipos e gera o build de produção
npm run preview          # Pré-visualiza o build de produção
npm run test:e2e         # Playwright em Chromium para desktop e dispositivos móveis
npm run test:e2e:report  # Abre o relatório HTML mais recente dos testes
npm run audit:lighthouse # Gera relatórios Lighthouse em três execuções para dispositivos móveis e desktop
```

Instale o navegador do Playwright uma vez antes de executar os testes E2E:

```bash
npx playwright install chromium
```

O Playwright inicia o Vite automaticamente, usa contextos de navegador
isolados e salva rastreamentos, capturas de tela e vídeos de falhas em
`test-results/`. O relatório HTML é salvo em `playwright-report/`.

O comando do Lighthouse gera o build de produção, serve a aplicação localmente
e audita as páginas inicial e de detalhes do NFT três vezes nos modos móvel e
desktop. Ele salva relatórios individuais em HTML e JSON, além de um resumo
das medianas com versões das ferramentas, ambiente, configurações de limitação,
LCP, CLS e TBT em `lighthouse-reports/`. Esses relatórios gerados são
ignorados pelo Git.

### Referência do Lighthouse

Três execuções por página e perfil no Node 24.12.0, Lighthouse 13.6.0 e Chrome
156.0.8078.4 (Windows x64), usando o build de produção e os mocks padrão do
MSW. A simulação móvel do Lighthouse usa viewport de 412 × 823, redução de CPU
de 4×, RTT de 150 ms e velocidade de aproximadamente 1,6 Mbps. O modo desktop
usa viewport de 1350 × 940 e as configurações de limitação de rede do Lighthouse
para desktop.

| Perfil | Página | Desempenho | Acessibilidade | Boas práticas | SEO | LCP mediano | CLS mediano | TBT mediano |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Móvel | Inicial | 59 | 100 | 100 | 100 | 4,57 s | 0,150 | 739 ms |
| Móvel | Detalhes do NFT | 66 | 100 | 100 | 100 | 4,70 s | 0,000 | 706 ms |
| Desktop | Inicial | 98 | 100 | 100 | 100 | 1,02 s | 0,054 | 22 ms |
| Desktop | Detalhes do NFT | 98 | 100 | 100 | 100 | 1,05 s | 0,000 | 8 ms |

A meta de desempenho móvel (90) ainda não foi atingida. Os relatórios móveis
indicam cerca de 1,6 s de inicialização do JavaScript, incluindo
aproximadamente 783 ms atribuídos ao cliente do navegador do MSW e 643 ms ao
pacote principal da aplicação, na simulação com redução de CPU de 4×. Os
pacotes de produção têm 466,82 kB (170,74 kB compactados com gzip) para o
cliente MSW e 300,10 kB (92,12 kB compactados com gzip) para a aplicação. Esse
custo de inicialização atrasa a renderização do maior conteúdo e contribui
para o TBT de 706–739 ms; a análise de LCP da página inicial também aponta cerca
de 1,14 s de atraso na renderização do elemento. As medições mantêm o
comportamento simulado exigido e não foram alteradas para ocultar esse custo.
O relatório da página inicial também registra uma mudança de layout atribuída
à seção do marketplace (CLS 0,150); a página de detalhes não apresenta mudança
de layout medida.

## Regressão visual

Os testes visuais E2E comparam a página inicial do marketplace, o catálogo, os
detalhes do NFT, o carrinho e o pagamento em desktop a 1440 px e em dispositivos
móveis a 390 px. Essas cinco páginas também têm referências visuais para tablet
a 768 px. Para atualizar intencionalmente as referências após uma alteração na
interface, execute:

```bash
npm run test:e2e -- e2e/visual.spec.ts --update-snapshots
```

Revise as imagens geradas antes de incluí-las nas alterações.

## Cobertura atual dos testes E2E

O catálogo segue o design fornecido, com nove filtros de coleções em português,
filtros de rede Ethereum/Polygon/Solana e quatro páginas de NFTs simulados; o
campo de busca foi intencionalmente omitido. Atualmente, a suíte do Playwright
verifica filtros, ordenação, paginação e histórico do catálogo, rotas diretas
de NFTs e tratamento de itens não encontrados, skeletons de carregamento em
situações de latência e recuperação de falhas do catálogo, isolamento de contas
e sessões expiradas, recuperação de falhas nos favoritos, cadastro e mensagens
de erro de login, alteração de senha, validação e persistência de carteiras,
persistência da quantidade de itens e de cupons no carrinho, mensagens para
cupons inválidos ou expirados e fluxos de checkout bem-sucedidos, recusados ou
com timeout. Também verifica novas tentativas de conexão à carteira,
recuperação de pedidos pendentes após interrupção do socket e recarga,
atualizações de preço em tempo real pelo Socket.IO, tratamento de eventos
duplicados ou desatualizados, persistência do perfil, inclusão de itens no
carrinho enquanto um pagamento está pendente, foco do teclado no diálogo da
imagem e referências visuais da página inicial, catálogo, detalhes do NFT,
carrinho e pagamento. Os fluxos E2E principais são executados em desktop a
1440 px e em dispositivos móveis a 390 px; a regressão visual também cobre
viewport de tablet a 768 px.
