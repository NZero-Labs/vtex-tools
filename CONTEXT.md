# Linguagem do domínio

- **Ferramenta**: capacidade interna publicada no catálogo da VTEX Tools.
- **Catálogo de ferramentas**: registro central de metadados estáveis das ferramentas e de seu estado operacional persistido.
- **Orçamento**: documento do Master Data identificado por `idBudget`, contendo itens e condições comerciais.
- **Auditoria de orçamentos**: ferramenta que compara orçamentos entre si, um orçamento com um carrinho ou versões históricas do mesmo orçamento.
- **Referência**: orçamento ou versão base contra a qual cada candidato é comparado.
- **Carrinho**: `orderForm` VTEX normalizado para o mesmo modelo usado por orçamentos.
- **Versão de orçamento**: snapshot histórico recuperado pelo `documentId` resolvido exclusivamente no servidor.
- **Divergência**: diferença normalizada entre um valor de referência e outro orçamento.
- **Impacto**: severidade operacional de uma divergência: crítico, alto, médio ou baixo.
- **Capacidade**: permissão centralizada usada para autorizar uma operação no servidor.
- **Colaborador**: usuário interno com papel `EMPLOYEE` ou `ADMIN`.
- **Disponibilidade**: estado operacional de uma ferramenta: disponível, beta, manutenção ou em breve.
- **Uso recente**: registro do último acesso de um colaborador a uma ferramenta; não armazena payload de orçamentos.
- **Ação administrativa**: mudança sensível registrada sem senha, token ou payload VTEX.
