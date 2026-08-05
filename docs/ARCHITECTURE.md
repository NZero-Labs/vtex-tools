# Arquitetura

## Direção

Monólito modular Next.js App Router. Server Components renderizam dados iniciais; Client Components ficam restritos a interação. Server Actions executam mutações internas e Route Handlers atendem Better Auth e operações assíncronas das ferramentas.

## Modules

### Identidade e autorização

Better Auth mantém usuários, contas, sessões e verificações no PostgreSQL via Drizzle. `requirePrincipal` e `hasCapability` concentram autenticação, atividade do colaborador e capacidades; páginas e Server Actions não repetem `role === 'ADMIN'`.

### Catálogo de ferramentas

Metadados estáveis (id, nome, descrição, rota, ícone, categoria, tags e ordem) ficam em um registro tipado em código. Estado operacional e permissões ficam no banco. O módulo oferece uma leitura já mesclada para dashboard, catálogo e administração.

### Auditoria de orçamentos

O Module `modules/budget-audit` reúne três fluxos: orçamento versus orçamentos, orçamento versus carrinho e versões históricas. O id persistido da ferramenta continua `budget-comparison` por compatibilidade.

O domínio de comparação não depende de React, Next.js ou banco. Adapters server-only normalizam as seguintes fontes para um contrato comum:

- documentos e versões do Master Data;
- `orderForm` do Checkout;
- peso do catálogo;
- fixtures identificadas, aceitas somente fora de produção.

A integração recebe ids validados e retorna sujeitos normalizados ou erros seguros. O primeiro sujeito é a referência e cada candidato é comparado contra ele. `documentId` nunca é serializado para o cliente.

### Administração

Server Actions autenticadas atualizam colaboradores, ferramenta e permissões na mesma transação do log administrativo. Operações impedem IDOR e protegem o último admin ativo. Read models concentram queries, filtros e paginação; páginas apenas compõem os resultados.

### Atualização de ativo

O domínio valida e lê CSV em streaming e define DTOs/resultados. A infraestrutura concentra VTEX, persistência e exportação. O Client Module mantém a orquestração de upload e polling, delegando upload, progresso/log e histórico a componentes de apresentação coesos.

## Persistência

Tabelas implementadas:

- Better Auth: `user`, `session`, `account`, `verification`.
- Produto: `tool_state`, `tool_permission`, `favorite_tool`, `recent_tool`, `admin_audit_log`, `platform_update`.

`user` recebe `role` e os campos de bloqueio lógico do plugin administrativo (`banned`, motivo e expiração). A aplicação deriva `active = !banned`. Orçamentos e credenciais VTEX não são persistidos.

## Segurança

- Segredos validados no servidor e nunca prefixados com `NEXT_PUBLIC_`.
- Cookies seguros em produção, CSRF/origin checks do Better Auth preservados.
- Rate limit do Better Auth habilitado.
- Reset revoga sessões existentes.
- Entradas Zod com limites; ids interpolados em query via `URLSearchParams`.
- Timeout de upstream, mensagens traduzidas e logs redigidos.
- Todas as Server Actions revalidam sessão e capacidade.
- Os nomes legados `VTEX_MASTERDATA_ENTITY`, `VTEX_BUDGET_MONEY_SCALE` e `VTEX_REQUEST_TIMEOUT_MS` são aceitos durante a transição; `.env.example` contém os nomes canônicos.

## Fluxo de auditoria

1. Interface valida ids de orçamento, carrinho ou seleção de versões conforme o fluxo.
2. Route Handler exige `budget:compare`.
3. Route Handler busca as fontes VTEX necessárias, em paralelo quando possível.
4. Cada payload é validado e normalizado com escala monetária configurada para `NormalizedSubject`.
5. Itens repetidos são agregados por SKU.
6. Comparações contra a referência geram resumo e divergências.
7. Route Handler devolve apenas dados necessários e registra uso recente sem payload.

## Erros

Erros esperados usam status HTTP e mensagens seguras em português. Stack traces e corpos do upstream ficam fora da resposta.

## Decisões de UI

- shadcn/ui com Base UI, Lucide e tokens semânticos.
- Sidebar em desktop; Sheet no mobile.
- Tabelas em desktop e cards comparativos em mobile.
- Tema persistido pelo `next-themes`, com suporte completo a claro, escuro e preferência do sistema.
- Uma ação primária por tela, feedback claro e movimento discreto somente em interações úteis.

## Decisões Ponytail

- Sem repository genérico, event bus, plugin loader ou factory.
- Sem TanStack Query/Form: Server Components, Server Actions, estado local e formulários nativos cobrem o release.
- Sem tabela de histórico de comparações; recentes guardam apenas ferramenta e timestamp.
