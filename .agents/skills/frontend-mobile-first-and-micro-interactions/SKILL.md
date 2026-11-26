---
name: frontend-mobile-first-and-micro-interactions
description: Desenvolve interfaces mobile-first, responsivas, acessíveis e com microinterações consistentes para sistemas de atendimento, orçamentos, CRM e gestão de serviços.
---

# FRONTEND MOBILE-FIRST & MICRO-INTERAÇÕES

## 1. OBJETIVO

Projetar, desenvolver e aprimorar interfaces com abordagem Mobile-First, priorizando a experiência de usuários que acessam o sistema por smartphones.

A interface deve ser leve, intuitiva, responsiva, acessível e eficiente, especialmente para profissionais e empresas que utilizam o sistema para:

- Receber e gerenciar solicitações de clientes.
- Consultar e elaborar orçamentos.
- Acompanhar oportunidades comerciais.
- Atualizar etapas de atendimento.
- Gerenciar tarefas e compromissos.
- Consultar informações de clientes e serviços.
- Administrar o Kanban e o CRM.

A experiência mobile deve ser considerada prioridade de projeto, e não uma adaptação secundária da versão desktop.

## 2. PRINCÍPIOS DE DESIGN MOBILE-FIRST

Desenvolver primeiro para telas pequenas e ampliar progressivamente a experiência para tablets e desktops.

### Diretrizes obrigatórias

- Utilizar layouts fluidos e responsivos.
- Evitar rolagem horizontal desnecessária.
- Priorizar informações essenciais em telas pequenas.
- Organizar conteúdos em blocos, cards e seções bem definidas.
- Utilizar espaçamentos consistentes.
- Manter hierarquia visual clara.
- Garantir legibilidade sem necessidade de zoom.
- Evitar excesso de elementos simultâneos.
- Priorizar ações frequentes e importantes.
- Manter consistência visual em todos os módulos.

Não reduzir simplesmente o tamanho dos elementos da versão desktop. Reorganizar a interface conforme o contexto de utilização.

## 3. NAVEGAÇÃO E ACESSIBILIDADE PARA SMARTPHONES

A navegação deve considerar principalmente a utilização com uma única mão.

### Botões e áreas de toque

- Utilizar áreas de interação com aproximadamente 44 a 48 pixels CSS ou maiores.
- Manter distância adequada entre botões.
- Evitar controles muito pequenos.
- Posicionar ações frequentes em regiões acessíveis ao polegar.
- Utilizar ícones acompanhados de rótulos quando sua função não for evidente.
- Diferenciar visualmente ações principais, secundárias e destrutivas.

### Navegação

- Criar navegação mobile simplificada.
- Utilizar menu inferior ou menu lateral recolhível quando adequado à arquitetura.
- Evitar menus excessivamente profundos.
- Manter acesso rápido às funcionalidades mais utilizadas.
- Garantir que o usuário consiga identificar sua localização dentro do sistema.
- Preservar contexto ao navegar entre módulos.

### Formulários

- Utilizar campos adequados ao tipo de informação.
- Configurar tipos corretos de teclado no smartphone.
- Exibir labels claros.
- Validar informações sem interromper desnecessariamente o preenchimento.
- Apresentar mensagens de erro próximas aos campos correspondentes.
- Preservar os dados preenchidos em caso de falha.
- Evitar formulários excessivamente longos em uma única tela.

## 4. MICROINTERAÇÕES E FEEDBACK VISUAL

Implementar microinterações que comuniquem claramente o resultado das ações do usuário.

Toda interação relevante deve oferecer feedback visual ou textual adequado.

### Exemplos obrigatórios

**Botões:**
- Mudança visual ao pressionar.
- Indicação de carregamento durante operações.
- Bloqueio temporário contra cliques duplicados.
- Confirmação visual após operações concluídas.

**Formulários:**
- Indicação de campo válido.
- Identificação de erros.
- Feedback durante o envio.
- Mensagem de sucesso ou falha.

**Kanban:**
- Animação suave ao movimentar cartões.
- Feedback visual durante o arraste.
- Indicação da nova etapa.
- Atualização visual após confirmação do backend.

**Orçamentos:**
- Confirmação ao salvar.
- Indicação de alterações pendentes.
- Atualização do status.
- Feedback ao gerar ou compartilhar documentos.

**Navegação:**
- Transições discretas entre telas.
- Destaque da seção selecionada.
- Abertura e fechamento suaves de menus e modais.

As animações devem ser funcionais, discretas e rápidas. Não utilizar efeitos excessivos que prejudiquem a produtividade.

## 5. DESEMPENHO E CARREGAMENTO

A experiência mobile deve funcionar adequadamente mesmo em conexões de internet limitadas.

### Requisitos

- Minimizar JavaScript desnecessário.
- Otimizar imagens e arquivos de mídia.
- Utilizar carregamento sob demanda quando apropriado.
- Evitar renderizações desnecessárias.
- Implementar paginação ou carregamento incremental em listas extensas.
- Evitar requisições duplicadas.
- Utilizar cache de maneira controlada.
- Exibir skeletons ou indicadores de carregamento.
- Evitar bloquear toda a interface durante operações secundárias.
- Monitorar erros e desempenho do frontend.

Priorizar a percepção de velocidade e a continuidade da utilização.

## 6. ESTADOS DA INTERFACE

Todos os módulos devem contemplar os seguintes estados:

1. Carregando.
2. Conteúdo carregado.
3. Nenhum registro encontrado.
4. Erro de carregamento.
5. Falha de conexão.
6. Operação em andamento.
7. Operação concluída.
8. Operação não autorizada.
9. Dados desatualizados.

Não deixar telas vazias ou sem orientação quando ocorrer uma falha.

As mensagens devem explicar o problema e, quando possível, apresentar uma ação para recuperação.

## 7. RESPONSIVIDADE POR MÓDULO

Verificar individualmente o comportamento mobile dos principais módulos.

### Dashboard
- Resumir indicadores importantes.
- Utilizar cards adaptáveis.
- Evitar excesso de gráficos simultâneos.
- Permitir acesso rápido às informações detalhadas.

### CRM
- Organizar clientes em listas ou cards.
- Facilitar pesquisa e identificação.
- Permitir acesso rápido ao histórico.
- Disponibilizar ações frequentes sem menus complexos.

### Kanban
- Adaptar colunas para navegação horizontal controlada ou visualização por etapa.
- Garantir que os cartões sejam legíveis.
- Permitir movimentação intuitiva.
- Disponibilizar alternativa ao arraste, como seleção da próxima etapa.

### Orçamentos
- Facilitar criação e edição.
- Organizar dados do cliente e dos serviços.
- Exibir valores com boa legibilidade.
- Destacar o valor final e o status.
- Facilitar visualização e compartilhamento.

### Atendimento
- Priorizar leitura das conversas.
- Facilitar identificação do cliente.
- Manter ações de atendimento acessíveis.
- Evitar que menus e painéis ocupem espaço excessivo.

## 8. ACESSIBILIDADE

Aplicar boas práticas de acessibilidade:

- Contraste adequado entre texto e fundo.
- Tipografia legível.
- Labels acessíveis para campos e botões.
- Navegação por teclado quando aplicável.
- Foco visual identificável.
- Textos alternativos para imagens relevantes.
- Não utilizar apenas cores para comunicar estados.
- Respeitar a preferência `prefers-reduced-motion`.
- Utilizar elementos semânticos corretamente.

A interface deve ser utilizável por pessoas com diferentes níveis de familiaridade tecnológica.

## 9. CONSISTÊNCIA VISUAL

Criar e respeitar um sistema visual compartilhado.

Definir padrões para:

- Cores.
- Tipografia.
- Espaçamentos.
- Bordas.
- Raios de arredondamento.
- Sombras.
- Botões.
- Inputs.
- Cards.
- Modais.
- Alertas.
- Ícones.
- Estados de interação.

Evitar que cada módulo desenvolva componentes visualmente diferentes para a mesma finalidade.

Sempre que possível, reutilizar componentes existentes antes de criar novos.

## 10. SEGURANÇA E CONFIABILIDADE DAS INTERAÇÕES

A interface não deve apresentar uma operação como concluída antes da confirmação do backend.

Regras:

- Não simular salvamento bem-sucedido.
- Não apresentar dados fictícios como dados reais.
- Não permitir que falhas silenciosas sejam interpretadas como sucesso.
- Tratar erros de API adequadamente.
- Evitar envio duplicado de formulários.
- Preservar dados não enviados quando possível.
- Respeitar permissões e níveis de acesso.
- Não armazenar informações sensíveis desnecessariamente no navegador.

Quando houver atualização otimista da interface, implementar estratégia de reversão visual caso o backend rejeite a operação.

## 11. TESTES E HOMOLOGAÇÃO

Testar os principais fluxos em diferentes dimensões de tela.

### Cenários mínimos

- Smartphones pequenos.
- Smartphones convencionais.
- Smartphones grandes.
- Tablets.
- Desktops.

Verificar:

- Navegação.
- Formulários.
- Criação e edição de orçamentos.
- Pesquisa de clientes.
- Atualização de oportunidades.
- Movimentação do Kanban.
- Modais e menus.
- Rolagem.
- Teclado virtual.
- Carregamento.
- Mensagens de erro.
- Conectividade instável.

Utilizar ferramentas como Chrome DevTools, Lighthouse e testes automatizados quando disponíveis.

Não considerar a simulação de dispositivo no navegador como substituta de todos os testes em dispositivos reais.

## 12. REGRAS DE IMPLEMENTAÇÃO

Antes de alterar o frontend:

1. Inspecionar a arquitetura existente.
2. Identificar framework, componentes e estilos utilizados.
3. Verificar os padrões visuais já implementados.
4. Identificar problemas de responsividade.
5. Avaliar os componentes que podem ser reutilizados.
6. Planejar alterações sem comprometer funcionalidades existentes.

Durante a implementação:

- Evitar reescritas desnecessárias.
- Não remover funcionalidades existentes sem autorização.
- Preservar integrações com o backend.
- Manter compatibilidade com os módulos atuais.
- Evitar dependências adicionais sem justificativa.
- Implementar por etapas.
- Testar cada etapa antes de avançar.

## 13. CRITÉRIOS DE CONCLUSÃO

Uma implementação somente poderá ser considerada concluída quando:

- A interface funcionar adequadamente em smartphones.
- Não houver rolagem horizontal indevida.
- Os botões e controles forem acessíveis ao toque.
- Os formulários forem utilizáveis em telas pequenas.
- As microinterações apresentarem feedback correto.
- Os estados de carregamento, erro e sucesso estiverem implementados.
- O desempenho for aceitável.
- Os principais fluxos forem testados.
- Não houver regressões funcionais.
- A interface mantiver consistência visual entre os módulos.

Ao finalizar, apresentar um relatório contendo:

1. Componentes e módulos modificados.
2. Melhorias implementadas.
3. Problemas encontrados e corrigidos.
4. Testes executados.
5. Testes pendentes.
6. Limitações identificadas.
7. Evidências da homologação.

## 14. DIRETRIZ FINAL

O objetivo não é apenas criar uma interface bonita ou responsiva.

O objetivo é oferecer uma experiência profissional, rápida e intuitiva, permitindo que o usuário administre clientes, atendimentos, oportunidades e orçamentos diretamente pelo smartphone, com o mínimo de esforço e o máximo de clareza.

Priorizar sempre:

**Usabilidade → Desempenho → Acessibilidade → Consistência → Estética.**
