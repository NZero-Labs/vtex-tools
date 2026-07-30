# Auditoria do repositório `vtex-budget-audit`

Data: 2026-07-27

Repositório auditado somente em leitura: `/home/bernardo/code/amara/vtex/vtex-budget-audit`.

## Estado e stack confirmados pelo código

- Branch `vtex-tools`, 9 commits à frente e 4 atrás do remoto, com mudanças locais preexistentes em `package-lock.json` e `tsconfig.json`.
- Next.js 16.2.9, React 19, TypeScript `strict`, Tailwind 3, shadcn `radix-nova`, Auth.js v5 beta, Prisma 7/PostgreSQL, Zod e Vitest.
- Rotas principais: `/tools`, `/tools/budget-audit/{cart,budgets,versions}`, `/tools/spreadsheet-validation`, `/admin` e `/login`.
- Catálogo estático central em `config/tools.config.ts`.
- Persistência limitada a `User`; não há migrations versionadas, permissões por ferramenta, favoritos, recentes ou log administrativo.

## Fluxos confirmados pelo código

### Carrinho versus orçamento

`POST /api/compare` recebe `{ orderFormUrl, idBudget }`, exige sessão, extrai o `orderFormId`, busca OrderForm e Budget em paralelo e retorna resumo, itens, totais, frete, promoções, tags e metadados.

### Orçamento versus orçamento

`POST /api/compare-budgets` recebe `{ idBudget1, idBudget2 }`, exige sessão, busca ambos em paralelo, consulta peso dos SKUs e retorna comparação, análise de preço e peso.

### Atual versus versão

`POST /api/compare-versions` lista versões ou compara o documento atual com uma versão histórica. Essa rota não verifica sessão.

## Integrações implementadas

Os endpoints abaixo foram confirmados na Implementation, mas não executados contra a VTEX real:

- Base: `https://${VTEX_ACCOUNT}.${VTEX_ENVIRONMENT}.com.br`.
- Headers: `X-VTEX-API-AppKey` e `X-VTEX-API-AppToken`.
- Budget: `GET /api/dataentities/{entity}/search?_where=idBudget={value}&_fields=_all`.
- Versões: `GET /api/dataentities/{entity}/documents/{documentId}/versions` e `.../versions/{versionId}`.
- OrderForm: `GET /api/checkout/pub/orderForm/{id}`.
- SKU/peso: `GET /api/catalog/pvt/stockkeepingunit/{skuId}`.

Variáveis observadas: `VTEX_ACCOUNT`, `VTEX_ENVIRONMENT`, `VTEX_APP_KEY`, `VTEX_APP_TOKEN`, `MASTERDATA_ENTITY`, thresholds, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BU_PRISMA_DATABASE_URL` e `USE_MOCK_DATA` (esta última ausente do exemplo de ambiente).

## Formatos e regras confirmados pelo código

- Item normalizado: `skuId`, `name`, `quantity`, `unitPrice`, `totalPrice`, `sellerId?`, `refId?`, `imageUrl?`.
- Totais: subtotal, descontos, frete, impostos e total.
- Entrega: CEP, modalidade e valor.
- Itens são associados somente por SKU.
- Estados: igual, quantidade, preço, quantidade e preço, ausente e extra.
- Totais são comparados campo a campo.
- CEP e tags são normalizados; tags usam `trim` e minúsculas.
- Promoções são associadas por id e só têm valor comparado quando ambos os valores são positivos.
- Seller, `refId` e imagem são carregados, mas não comparados.
- Produto separado de SKU, disponibilidade, pagamento, cliente e mensagens não são comparados porque não entram no modelo normalizado.

## Comportamentos inferidos, não confirmados pela integração

- A unidade monetária do Budget é inferida pela média dos preços; não há contrato VTEX que confirme essa heurística.
- Tipos TypeScript e mocks descrevem respostas esperadas, mas `response.json()` não é validado em runtime.
- O mapeamento de SLAs representa regras locais da operação, não uma garantia da plataforma VTEX.

## Bugs e limitações

1. Crítico: `/api/compare-versions` não autentica a requisição.
2. Crítico: `documentId` de versão vem do cliente e não é vinculado ao `idBudget`, permitindo IDOR.
3. Alto: divergência apenas de quantidade recebe impacto `none` e pode sumir do resumo.
4. Alto: a heurística centavos/reais corrompe orçamentos caros em reais ou baratos em centavos.
5. Alto: respostas externas sem schema podem gerar exceção ou `NaN`.
6. Alto: papel e ativação ficam obsoletos no JWT por até 12 horas.
7. Alto: peso desconhecido vira zero, aparentando dado válido; paralelismo de SKUs é ilimitado.
8. Médio: somente o primeiro `logisticsInfo` do OrderForm é considerado.
9. Médio: promoções do carrinho têm valor zero fixo.
10. Médio: erros VTEX diferentes viram 404 e detalhes de upstream podem chegar a logs/UI.
11. Médio: SKUs duplicados não são agregados e podem reutilizar o mesmo match.
12. Médio: administração não impede desativar o último admin e espalha comparações com `ADMIN`.
13. Médio: CSV não escapa aspas nem neutraliza formula injection.
14. UI: tabelas horizontais no mobile, linhas não operáveis por teclado e filtros incompletos.
15. Drift: README, scripts, thresholds, tempo de sessão e deploy divergem da Implementation.

## Testes existentes e lacunas

Há 25 testes de comparação e cinco da ferramenta de planilha. Faltam testes de normalizadores, integração VTEX, autenticação, autorização, rotas, IDOR, administração, sessão expirada, dados incompletos, mobile e CSV.

## Reaproveitamento conceitual

- Modelo normalizado e comparação pura por estados.
- Busca paralela de orçamentos independentes.
- `requestId`, normalização de CEP/tags, catálogo central e desativação lógica.
- Adapter VTEX exclusivamente no servidor.

## O que será reimplementado

- Schemas runtime para payloads externos.
- Escala monetária configurável, sem heurística.
- Agregação por SKU e impacto incluindo quantidade e total.
- Capabilities no servidor, sessão persistida, log administrativo e proteção contra último admin.
- Comparação de dois a cinco orçamentos, pesquisa, filtros e cards mobile.

## Dívidas que não serão carregadas

Wrappers visuais pass-through, casts de payload remoto, mocks habilitáveis em produção, CORS wildcard, deploy estático incompatível, logs de upstream sem redação e interfaces com apenas um Adapter.
