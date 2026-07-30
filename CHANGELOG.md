# Changelog

## Em desenvolvimento

### Arquitetura

- Recriado o projeto com Next.js 16, React 19, TypeScript e Bun.
- Definida arquitetura modular para identidade, catálogo, auditoria e administração.
- Segmento autenticado marcado como dinâmico para impedir consultas de sessão e banco durante o build.

### Documentação

- Adicionadas auditorias do projeto atual e do repositório de referência.
- Adicionadas especificação, arquitetura, plano de testes, linguagem do domínio e tarefas.

### Design

- Aprovada direção editorial orgânica com temas claro mineral e escuro floresta.
- Confirmada paleta de marca `#00953E`, `#77B72A` e `#C1D000` a partir do ativo existente.
- Adicionados temas claro mineral e escuro floresta, fontes locais Manrope/Newsreader e logo oficial existente.
- Implementados shell responsivo, sidebar recolhível, navegação mobile, estados vazios, skeletons, páginas 404/erro e skip link.
- Corrigida hidratação do seletor de tema mantendo o HTML inicial estável em claro e escuro.

### Autenticação e segurança

- Configurados Better Auth, PostgreSQL e Drizzle com login, logout, sessões, reset por e-mail e cadastro somente administrativo.
- Adicionados papéis `EMPLOYEE`/`ADMIN`, capacidades centralizadas, permissões por ferramenta, rate limit e proteção do último administrador ativo.
- Criados migration inicial, `.env.example`, PostgreSQL local e comando idempotente de primeiro administrador.
- Definida política central de senha com mínimo de 8 e máximo de 256 caracteres.
- O bootstrap administrativo agora aplica migrations pendentes antes de consultar usuários.

### Plataforma

- Implementados dashboard, busca/filtros, catálogo central, favoritos, recentes, novidades, perfil e preferências.
- Implementados gerenciamento de usuários, papéis, bloqueio lógico, catálogo, permissões e log administrativo.

### Comparação de orçamentos

- Reimplementados schema, normalização monetária explícita, agregação de SKUs e comparação pura com testes.
- Adicionada consulta VTEX somente no servidor e fixtures identificadas exclusivas para desenvolvimento/teste.
- Criada experiência para 2–5 orçamentos com resumo, totais, produtos, filtros, cópia, estados de erro e cards mobile.
- Campos de totalização ausentes são exibidos como não informados, sem inventar valor zero.
- Corrigido o acrônimo da entidade Amara para `BD` e o suporte ao payload real com totais na raiz e campos opcionais nulos.
- Respostas VTEX de schema ou permissão inválida agora retornam mensagens específicas em vez de um 502 genérico.
