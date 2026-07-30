# Auditoria do projeto atual

Data: 2026-07-27

## Estado encontrado

O diretório era um starter não versionado de Bun 1.3.14, React 19, Tailwind CSS 4 e shadcn/ui. O repositório Git efetivo estava em `/home/bernardo`, sem commits na branch `main`, e continha muitas alterações externas ao diretório; elas não foram tocadas. Dentro de `vtex-tools`, todos os arquivos apareciam como não rastreados.

O starter tinha um servidor `Bun.serve`, uma SPA sem roteamento, o exemplo `APITester`, cinco primitives shadcn e nenhum banco, autenticação, teste ou lint configurado. TypeScript estava em `strict`, mas verificadores de imports e parâmetros não usados estavam desativados.

## Recriação aprovada

O usuário aprovou a recriação com `create-next-app`. Para manter a raiz oficial, foi executado `bun create next-app@latest . --yes --use-bun`, gerando Next.js 16.2.12, React 19.2.4, TypeScript 5.9 e Tailwind CSS 4. O starter anterior foi preservado em `/tmp/vtex-tools-starter.yi24XA`.

## Estado do scaffold

- Next.js App Router e React Server Components por padrão.
- Bun como package manager.
- TypeScript `strict` e ESLint 9.
- Tailwind CSS 4.
- Sem banco, autenticação ou testes ainda no momento desta auditoria.
- `AGENTS.md` gerado exige consulta à documentação local do Next.js 16 antes da implementação.

## Ativos de marca

O starter atual não continha ativo oficial da Amara. O repositório de referência possui `public/logo-amara.png`, com as cores dominantes confirmadas no arquivo: `#00953E`, `#77B72A` e `#C1D000`. O design aprovado usa essas cores por tokens, com tons derivados para contraste.

## Riscos iniciais

- O Git tem raiz acima do projeto; operações de staging poderiam incluir arquivos alheios. Nenhum commit será criado.
- O scaffold é recente e suas convenções diferem de versões anteriores do Next.js.
- Credenciais VTEX, banco e provedor de e-mail não foram fornecidos; produção deverá falhar de modo explícito quando estiverem ausentes.

## Decisão

Preservar o scaffold Next.js aprovado e construir quatro Modules profundos: identidade e autorização, catálogo, auditoria de orçamentos e administração. Evitar wrappers, factories e interfaces sem dois Adapters reais.
