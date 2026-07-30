# Plano de testes

## Estratégia

Vitest executa testes unitários e de integração. React Testing Library cobre interações de alto risco. A validação final inclui navegação manual em viewport desktop e mobile.

## Matriz

| Área | Comportamento | Tipo |
| --- | --- | --- |
| Schemas | 2–5 ids, duplicados, tamanho e payload externo incompleto | unitário |
| Normalização | escala monetária, ausentes, SKU duplicado, tags | unitário |
| Comparação | adicionado, removido, quantidade, preço, total, impacto | unitário |
| Integração | URL/headers, configuração ausente e payload inválido | automatizado |
| Autenticação | login, logout, senha inválida, reset e sessão expirada | manual/integrado ao Better Auth |
| Autorização | anônimo, `EMPLOYEE`, `ADMIN`, desativado | unitário/integração |
| Admin | último admin | unitário; demais fluxos em validação manual com banco |
| UI | loading, erro recuperável, vazio, filtro, copiar e reset | validação manual |
| Responsividade | 375, 768, 1024 e 1440 px; sem scroll horizontal | manual |
| Acessibilidade | teclado, foco, labels, headings, contraste e reduced motion | manual/estático |

## Gates

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Nenhum gate pode terminar com erro ou warning introduzido pela aplicação.

## Resultado em 2026-07-27

- `bun run lint`: aprovado sem warnings.
- `bun run typecheck`: aprovado.
- `bun run test`: 14 testes aprovados em 3 arquivos.
- `bun run build`: aprovado; 20 rotas geradas.
- Migration PostgreSQL e bootstrap administrativo: aprovados em banco local.
- `bun audit`: nenhuma vulnerabilidade crítica. Permanecem 4 altas e 3 moderadas transitivas: `sharp` opcional do Next.js, PostCSS empacotado pelo Next.js e ferramentas de desenvolvimento. Não houve atualização major forçada sem compatibilidade confirmada.
- Verificação visual interativa: incompleta porque a sessão não expôs uma página de navegador controlável. A telemetria existente revelou uma divergência de hidratação no seletor de tema; a causa foi corrigida e os gates foram repetidos.
