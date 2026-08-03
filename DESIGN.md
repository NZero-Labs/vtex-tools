---
version: "alpha"
name: "Amara Net Zero Operations UI"
description: "Design system para o hub interno de ferramentas VTEX da Amara Net Zero: operacional, claro, responsivo e acessível."
colors:
  primary: "#007B34"
  secondary: "#77B72A"
  tertiary: "#FFFFFF"
  neutral: "#14241A"
  surface: "#F5F7F2"
  accent: "#C1D000"
typography:
  display:
    fontFamily: Newsreader
    fontSize: 3.5rem
    fontWeight: 500
  heading:
    fontFamily: Newsreader
    fontSize: 1.875rem
    fontWeight: 500
  body:
    fontFamily: Manrope
    fontSize: 1rem
    fontWeight: 400
  label:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: 600
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  section: clamp(2.5rem, 6vw, 5rem)
rounded:
  sm: 8px
  md: 12px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.tertiary}"
    rounded: "{rounded.sm}"
    padding: "{spacing.md}"
  card:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  status-highlight:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
  sidebar:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.tertiary}"
---

## Overview

VTEX Tools é um hub interno para operações VTEX. A interface deve ajudar uma pessoa a encontrar a ferramenta certa, entender o estado da operação e concluir uma tarefa sem distração.

- **Produto:** dashboard operacional autenticado
- **Público:** colaboradores e administradores da Amara Net Zero
- **Idioma:** português do Brasil
- **Personalidade:** confiável, humana, precisa e calma
- **Densidade:** 6/10 — informação suficiente para operar, sem aparência de planilha
- **Variância:** 3/10 — consistência acima de novidade visual
- **Movimento:** 2/10 — feedback funcional, sem espetáculo
- **Temas:** claro mineral e escuro floresta, ambos completos

Não usar landing page, scroll hijacking, parallax, carrossel obrigatório, seção horizontal ou animação cinematográfica. A navegação deve continuar previsível e nativa.

## Colors

A paleta oficial da Amara Net Zero é composta por `#00953E`, `#77B72A` e `#C1D000`. O verde primário tokenizado como `#007B34` é uma derivação mais escura para preservar contraste AA em ações com texto branco.

- **Primary Green** (`#007B34`) — ações primárias, links importantes e foco
- **Amara Green** (`#00953E`) — marca, gráficos e ilustrações
- **Leaf Green** (`#77B72A`) — estados positivos, progresso e apoio visual
- **Lime** (`#C1D000`) — destaque, seleção e chamadas de atenção; nunca usar como texto pequeno
- **Deep Forest** (`#14241A`) — texto principal, sidebar e ações secundárias
- **Soft Sage** (`#F5F7F2`) — fundo da aplicação
- **White** (`#FFFFFF`) — cards, campos e superfícies elevadas

Regras:

- Texto normal sempre deve atingir contraste WCAG AA de 4.5:1; texto grande, 3:1.
- Não usar `#C1D000` como fundo de texto branco.
- Não usar preto puro; usar Deep Forest.
- Bordas devem ser discretas, mas distinguíveis do fundo.
- Cores semânticas de erro e aviso podem existir como tokens locais, sempre com texto e ícone de apoio; nunca depender apenas da cor.

## Typography

- **Display:** Newsreader 500, usada apenas na saudação e em títulos de alto nível.
- **Heading:** Newsreader 500, para títulos de página e seções.
- **Body:** Manrope 400, 16px e line-height mínimo de 1.5.
- **Labels:** Manrope 600, 14px, para campos, filtros e metadados.
- **Numerais operacionais:** Manrope 600; alinhar valores monetários e contagens à direita.

Escala:

- Display: `clamp(2rem, 4vw, 3.5rem)`
- H1: `clamp(1.75rem, 3vw, 2.5rem)`
- H2: `1.5rem`
- H3: `1.125rem`
- Body: `1rem / 1.5`
- Small: `0.875rem / 1.4`

Não usar texto todo em caixa alta para títulos. Usar sentence case em português.

## Layout

- **Shell desktop:** sidebar fixa ou recolhível à esquerda; conteúdo em `SidebarInset`.
- **Shell mobile:** sidebar vira Sheet acionado por botão no header; nunca deixar navegação essencial apenas em hover.
- **Conteúdo:** `max-width: 1536px`, centralizado, com padding horizontal de 16px no mobile, 24px no tablet e 32px no desktop.
- **Grid:** CSS Grid e Flexbox; uma coluna no mobile, duas colunas quando a relação realmente ajudar a tarefa.
- **Ritmo:** usar tokens de spacing; separar seções com `section`, não com margens arbitrárias.
- **Hierarquia:** título + contexto + uma ação primária; filtros e ações secundárias ficam próximos do conteúdo que controlam.
- **Largura de leitura:** textos longos em no máximo 72ch; tabelas podem ocupar o container.
- **Mobile:** nenhum overflow horizontal acidental. Tabelas comparativas viram cards empilhados.
- **Altura:** usar `min-h-dvh`, nunca depender de `h-screen`.
- **Camadas:** conteúdo (0), header/sidebar (20), popover (30), dialog (40), toast (50).

## Navigation & UX

- Sidebar agrupa itens em **Plataforma** e **Gestão**; o item atual tem indicador visual e `aria-current`.
- Header mostra breadcrumb quando houver profundidade, título contextual quando necessário e ações globais previsíveis.
- Dashboard começa com saudação curta, ferramenta recomendada, favoritos, recentes e catálogo.
- Cada tela tem uma ação primária clara. Ações destrutivas exigem confirmação e explicam a consequência.
- Busca e filtros devem preservar o contexto, permitir limpar rapidamente e mostrar quantos resultados existem.
- Formulários exibem label persistente, ajuda antes do erro, erro junto ao campo e resumo quando houver múltiplos erros.
- Após uma ação, mostrar feedback próximo ao ponto de origem; não usar toast como único canal para erro crítico.
- Loading preserva o layout com skeletons. Estado vazio explica o que aconteceu e oferece o próximo passo.
- Erros de integração são traduzidos para português, acionáveis e sem stack trace ou segredo.

## Responsive Behavior

- **0–767px:** Sheet para navegação, cards empilhados, ações principais em largura confortável, tabelas convertidas em blocos comparativos.
- **768–1199px:** sidebar pode permanecer recolhida; grids usam duas colunas apenas quando cada item mantém pelo menos 280px.
- **1200px+:** sidebar expandida quando houver espaço; grids e tabelas usam a largura disponível sem esticar texto.
- Alvos de toque têm pelo menos 44px. Ícones sozinhos precisam de tooltip em desktop e `aria-label` sempre.
- Não esconder ações essenciais apenas por breakpoint; mover, agrupar ou transformar em menu.

## Elevation & Motion

- Usar borda e contraste de superfície antes de sombra.
- Sombras: `0 1px 3px rgba(20, 36, 26, 0.08)` para cards; nenhuma sombra dramática.
- Transições de interação entre 150ms e 220ms, somente `opacity`, `transform` e cores.
- Entrada de conteúdo: fade curto com translate de até 8px; não animar cada linha de tabela.
- Respeitar `prefers-reduced-motion: reduce`, removendo transformações não essenciais.
- Não usar smooth-scroll customizado, parallax, scroll hijacking ou contadores animados como requisito.

## Shapes

- Radius padrão de controles: 8px.
- Radius de cards e painéis: 12px.
- Radius de hero ou destaque de dashboard: até 24px.
- Não usar radius excessivo em tabelas, campos ou cada elemento individual.

## Components

- **Primary button:** fundo Primary Green, texto branco, altura mínima 40px, foco visível, estado disabled explícito.
- **Secondary button:** fundo Deep Forest, texto branco; usar para ações alternativas de alta importância.
- **Tertiary / ghost:** sem preenchimento pesado; usar apenas para ações de menor prioridade.
- **Cards:** fundo branco, borda sutil, radius 12px e padding consistente. Evitar card dentro de card sem necessidade.
- **Inputs:** altura mínima 40px, label acima, placeholder apenas como exemplo, foco com ring de Primary Green.
- **Badges:** curtos e semânticos: Disponível, Beta, Manutenção, Em breve. Nunca comunicar estado somente por cor.
- **Tables:** cabeçalho persistente em desktop, alinhamento numérico à direita, células com conteúdo desconhecido explícito.
- **Comparison cards:** no mobile mostrar referência e candidato com labels fixos; diferenças devem ser visíveis sem abrir detalhe.
- **Dialogs:** título, consequência, ação de cancelar e ação confirmada; prender foco e fechar com Escape.
- **Empty states:** ícone Lucide, explicação curta e uma ação. Sem ilustração decorativa obrigatória.
- **Feedback:** alert inline para erros de fluxo; toast para confirmação breve; status persistente para processos assíncronos.
- **Skeleton:** reproduzir o tamanho aproximado do conteúdo; evitar spinner isolado em páginas inteiras.

## Data-heavy Workflows

- Comparações exibem primeiro um resumo executivo: total de diferenças, impacto e próximos passos.
- Itens são agrupados por SKU; quantidade, preço, total e seller têm colunas previsíveis.
- Filtros incluem tipo de diferença, impacto e alternância entre todos e somente diferenças.
- Valores ausentes aparecem como “Não informado”, nunca como zero inventado.
- Desktop privilegia leitura lado a lado; mobile privilegia leitura vertical por item.
- Copiar, limpar e iniciar nova comparação são ações secundárias, próximas do resultado.

## Accessibility

- Usar HTML semântico e landmarks: `header`, `nav`, `main`, `aside` e `footer`.
- Manter skip link para `main-content`.
- Todo controle deve funcionar por teclado e ter foco visível.
- Inputs devem ter labels associadas e mensagens de erro anunciáveis.
- Ícones decorativos têm `aria-hidden`; ícones interativos têm nome acessível.
- Estados devem combinar texto, estrutura ou ícone com cor.
- Testar zoom de 200%, viewport mobile, tema escuro e `prefers-reduced-motion`.

## Do's and Don'ts

- Do manter uma ação primária por tela.
- Do mostrar o próximo passo em estados vazios, loading e erro.
- Do usar dados reais e estados desconhecidos explícitos.
- Do manter o desktop denso e o mobile legível.
- Do usar Lucide para ícones consistentes.
- Do validar contraste WCAG AA.
- Don't usar parallax ou animação para comunicar informação operacional.
- Don't criar três colunas iguais por padrão.
- Don't usar texto cinza claro em fundos claros.
- Don't usar tooltip para explicar ação essencial.
- Don't esconder navegação ou ações importantes em hover.
- Don't usar “zero” quando a integração não forneceu um valor.
- Don't usar clichês de copy como “Eleve”, “Seamless”, “Next-Gen” ou “Desbloqueie seu potencial”.

## Use Case

Hub interno Amara Net Zero, catálogo de ferramentas VTEX, auditoria e comparação de orçamentos, atualização de ativos, administração de usuários e permissões.
