# VTEX Tools

Hub interno da Amara Net Zero para operações VTEX. A Auditoria de Orçamentos compara orçamentos entre si, com um carrinho ou com versões históricas e destaca divergências de itens, valores, descontos, frete e vendedores.

## Stack

Next.js 16, React 19, TypeScript estrito, Tailwind CSS 4, shadcn/Base UI, Better Auth, PostgreSQL, Drizzle ORM, Zod e Vitest. O projeto usa Bun.

## Ambiente local

1. Copie `.env.example` para `.env.local` e gere um `BETTER_AUTH_SECRET` com ao menos 32 caracteres.
2. Inicie o PostgreSQL: `docker compose up -d`.
3. Informe `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no ambiente e execute `bun run admin:create`. O comando aplica migrations pendentes antes de criar o administrador.
4. Inicie a aplicação: `bun run dev`.

Para testar sem credenciais VTEX, use `USE_VTEX_FIXTURES=true` fora de produção e compare `DEMO-1001` com `DEMO-1002`. A interface identifica esses dados como demonstração.

## Comandos

```bash
bun run dev
bun run lint
bun run typecheck
bun run test
bun run build
bun run db:generate
bun run db:migrate
bun run db:studio
bun run admin:create
```

## Segurança

Não existe cadastro público. Rotas, APIs e Server Actions verificam a sessão e capacidades no servidor. Credenciais VTEX nunca são enviadas ao navegador; fixtures são recusadas em produção. Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e [docs/VTEX_BUDGET_AUDIT.md](docs/VTEX_BUDGET_AUDIT.md).
# vtex-tools
