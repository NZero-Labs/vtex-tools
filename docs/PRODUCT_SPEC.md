# Especificação do produto

## Objetivo

VTEX Tools é o hub interno da Amara Net Zero para ferramentas operacionais VTEX. A primeira ferramenta oficial é a Auditoria de Orçamentos.

## Pessoas e papéis

- `EMPLOYEE`: acessa o hub e as ferramentas permitidas.
- `ADMIN`: possui as mesmas capacidades e administra colaboradores, catálogo, permissões e log.

Não existe cadastro público. O primeiro administrador é criado por comando que exige variáveis de ambiente.

## Requisitos funcionais

### Identidade

- Login e logout por e-mail/senha.
- Sessão segura persistida e verificada no servidor.
- Recuperação de senha quando o provedor de e-mail estiver configurado.
- Rotas protegidas, redirecionamento e tela de acesso negado.
- Sessões revogadas ao redefinir senha ou desativar colaborador.

### Hub

- Saudação e identificação do colaborador.
- Busca e filtros por categoria e disponibilidade.
- Favoritos e usos recentes.
- Catálogo único com disponibilidade, beta, manutenção e em breve.
- Navegação responsiva, estados vazios, loading e erro.

### Auditoria de orçamentos

- Entrada de dois a cinco `idBudget`; primeiro é a referência.
- Busca de dados somente no servidor.
- Resumo executivo e comparação lado a lado.
- Itens agregados por SKU com quantidade, preço unitário, total e seller quando fornecido.
- Totais, descontos e frete quando fornecidos pela integração.
- Itens adicionados, removidos e alterados.
- Pesquisa, filtro por tipo e impacto, e alternância todos/somente diferenças.
- Copiar valores, limpar e iniciar nova comparação.
- Desktop com tabela semântica; mobile com cards, sem tabela horizontal gigante.
- Dados ausentes aparecem como desconhecidos, nunca como zero inventado.

Pagamento, disponibilidade de estoque, produto separado de SKU e dados de cliente só serão comparados quando existirem no contrato VTEX validado.

### Administração

- Visão geral.
- Busca, filtro e paginação de colaboradores.
- Criação administrativa, alteração de papel e ativação/desativação.
- Proteção contra desativar ou rebaixar o último administrador ativo.
- Configuração de disponibilidade e permissões por ferramenta.
- Confirmação de ações sensíveis.
- Log sem segredos ou payload VTEX.

## Requisitos de experiência

- Português do Brasil.
- Direção editorial orgânica aprovada.
- Temas claro mineral e escuro floresta completos.
- Paleta oficial observada: `#00953E`, `#77B72A`, `#C1D000`.
- Contraste WCAG AA, foco visível, skip link, labels e navegação por teclado.
- Alvos de toque adequados ao contexto e navegação mobile utilizável.

## Critérios de aceite

- Usuário anônimo não acessa rotas ou mutações protegidas.
- `EMPLOYEE` não acessa operações administrativas.
- Desativação impede nova utilização da sessão.
- Todas as entradas e respostas externas são validadas.
- Uma diferença de quantidade aparece no resumo mesmo com preço unitário igual.
- SKUs duplicados são agregados.
- Nenhuma fixture pode ser habilitada em produção.
- Lint, typecheck, testes e build terminam sem erro.

## Fora do primeiro release

Microsoft Entra ID/SSO, 2FA, histórico persistido do payload completo das comparações, carrinho versus orçamento, versões históricas e ferramentas adicionais.
