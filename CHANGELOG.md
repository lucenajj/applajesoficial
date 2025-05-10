# Registro de Atualizações - AppLajes

## 2024

### Maio

#### 10/05/2025
- 🧩 **Implementação de Categorias de Produtos "Eps" e "Capa"**
  - Criação de novas categorias de produtos: "EPS" e "Capa"
  - Implementação de páginas dedicadas para cada categoria, respeitando campos específicos
  - Arquitetura modular para permitir fácil adição de novas categorias no futuro
  - Roteamento dinâmico com base na categoria selecionada
  - Consistência visual e funcional entre todas as categorias de produtos
  - Definição de esquemas de tabelas otimizados para cada tipo de produto

- 🔄 **Melhorias na Gestão de Produtos**
  - Cálculo automático de preço de venda com base no custo e margem
  - Manipulação otimizada de valores numéricos com suporte a vírgula e ponto
  - Interfaces de cadastro adaptadas para cada categoria
  - Melhoria na visualização de produtos em tabelas com campos específicos
  - Validação de dados antes da inserção no banco

- 📊 **Organização de Dados no Supabase**
  - Criação das tabelas `eps_products` e `capa_products` com estruturas customizadas
  - Instruções detalhadas para aplicação das migrações necessárias
  - Documentação das estruturas de dados em README
  - Separação lógica dos produtos por categoria no banco de dados

#### 28/04/2025
- 🐛 **Correção no Cadastro de Produtos**
  - Corrigido o problema de incompatibilidade entre o valor do campo "type" no frontend e as restrições do banco de dados
  - Implementado mapeamento automático e flexível de tipos que funciona com diferentes versões das migrações
  - Corrigido o problema de componentes não controlados mudando para controlados em campos numéricos
  - Melhorada a formatação de valores decimais com 3 casas para os campos monetários e de medidas
  - Implementada conversão correta de valores entre o formato brasileiro (com vírgula) e o formato do banco (com ponto)
  - Adicionada validação para garantir que todos os campos numéricos tenham valores válidos antes de enviar ao banco

### Abril

#### 07/04/2025
- 🔢 **Suporte a Valores Decimais em Medidas**
  - Implementado suporte a casas decimais nos campos de Vigota (m) e Vão (m)
  - Adicionado incremento de 0,01 para permitir medidas precisas como 3,1m ou 3,25m
  - Melhorada a precisão dos cálculos de orçamentos com medidas exatas
  - Mantida compatibilidade com as fórmulas de cálculo existentes

- 🏠 **Melhoria no Componente de Seleção de Casas**
  - Implementado accordion para agrupar as casas existentes, reduzindo a poluição visual
  - Adicionado fechamento automático do accordion ao selecionar uma casa
  - Preenchimento automático dos campos de nome e endereço ao selecionar uma casa existente
  - Adicionado botão "Limpar seleção" para facilitar a troca de casa selecionada
  - Melhorada a experiência do usuário com feedback visual da seleção atual
  - Otimizada a visualização com rolagem interna para muitas casas cadastradas

- 🔄 **Integração entre Clientes e Cálculos**
  - Implementada seleção automática do cliente ao criar um novo orçamento a partir da tela de detalhes do cliente
  - Adicionado parâmetro na URL para passar o ID do cliente entre páginas
  - Avanço automático para o próximo passo ao detectar o cliente na URL
  - Melhorada a experiência do usuário, eliminando etapas manuais redundantes

#### 07/04/2025
- 💰 **Padronização da Formatação Monetária**
  - Implementada formatação de valores monetários no padrão brasileiro (R$ 1.696,94) em todo o sistema
  - Criada função de utilidade `formatCurrency` centralizada para garantir consistência
  - Corrigida a exibição de valores nos cards do Dashboard, incluindo "Total Vendido" e "Ticket Médio"
  - Padronizada a exibição de valores no gráfico de histórico de vendas e tooltips
  - Atualizada a exibição de valores monetários na página de Cálculos e Orçamentos
  - Garantida a consistência visual entre todas as partes da aplicação e o PDF gerado

### Março

#### 02/04/2025
- 🧮 **Correção no Cálculo do Custo por Metro Quadrado**
  - Corrigido o cálculo do custo por m² para usar a área total (largura × comprimento) em vez da área linear
  - Implementada lógica atualizada para garantir resultados precisos refletindo o custo real por m²
  - Corrigida a exibição do custo por m² no modal de detalhes do orçamento usando a fórmula: total_cost / (total_area * 0.5)
  - Corrigida a exibição do valor na tabela de histórico de cálculos para manter consistência
  - Atualizado o cálculo na geração de PDF para exibir o custo por m² correto
  - Corrigidos os valores nas funções de compartilhamento via WhatsApp e e-mail
  - Garantida a consistência do valor do custo por m² em todas as partes da aplicação

- 🔍 **Simplificação da Interface de Clientes**
  - Reorganizada a tabela de clientes para exibir apenas informações essenciais (nome, email, telefone)
  - Removidas as colunas de endereço e documentos da visualização principal para uma interface mais limpa
  - Removida a data de cadastro da visualização de lista para reduzir informações redundantes
  - Mantidas todas as informações completas no modal de detalhes acessível pelo clique no cliente ou no ícone de visualização
  - Interface mais simples e eficaz, melhorando a experiência do usuário e a visualização em dispositivos móveis

- 🔒 **Correção de Permissões e Filtragem por Vendedor**
  - Corrigido problema onde vendedores podiam ver cálculos e orçamentos de outros vendedores
  - Implementada filtragem correta de cálculos na página de Orçamentos baseada no usuário atual
  - Adicionada verificação de papel do usuário (admin/vendedor) para determinar visibilidade de dados
  - Garantida a consistência da filtragem por usuário em todas as páginas (Home, Customers, Calculations)
  - Melhorada a segurança de acesso aos dados entre diferentes vendedores

- 📱 **Otimização do Layout para Dispositivos Móveis**
  - Melhorada a visualização em dispositivos com tela pequena como Samsung Galaxy S8+
  - Ajustado o espaçamento e padding para melhor aproveitamento do espaço em telas pequenas
  - Redimensionamento dinâmico dos controles para facilitar o toque em dispositivos móveis
  - Reorganização dos elementos em layout vertical para telas estreitas
  - Ajuste no tamanho dos ícones e fontes para melhor legibilidade em smartphones

- 📊 **Aprimoramento de Gráficos em Dispositivos Móveis**
  - Otimização da altura do gráfico de histórico para melhor visualização em telas pequenas
  - Reduzido o tamanho dos pontos e fontes para uma exibição mais clara em dispositivos móveis
  - Melhorada a legenda e tooltips para serem mais legíveis em telas pequenas
  - Adaptação dinâmica baseada no tamanho de tela usando Material UI useMediaQuery

- 🛠️ **Correções no Dashboard para Administradores**
  - Corrigido problema de sobreposição do label "Vendedor" com o texto "Todos" no dropdown
  - Resolvido o problema de exibição do "Total Vendido" para usuários administradores
  - Adicionados logs de depuração para monitoramento do funcionamento do dashboard
  - Melhorada a lógica de filtragem para garantir que todos os dados sejam exibidos corretamente
  - Refinada a experiência visual do filtro de vendedores para maior clareza

- 📏 **Melhorias no Layout do Dashboard**
  - Corrigido espaçamento entre o título "Dashboard" e o dropdown de período
  - Implementada disposição responsiva para dispositivos móveis
  - Aplicação do sistema de tipografia responsiva nos elementos do Dashboard
  - Melhor alinhamento dos controles em diferentes tamanhos de tela
  - Ajuste do espaçamento vertical em dispositivos menores

- 🎨 **Sistema de Tipografia Responsiva**
  - Implementação de hooks personalizados para gerenciar fontes responsivas
  - Adaptação automática do tamanho de texto para diferentes dispositivos
  - Melhor legibilidade em smartphones e tablets
  - Ajuste proporcional de cabeçalhos, corpo de texto e elementos da interface
  - Otimização de leitura para listas e tabelas de dados
  - Solucionado problema de texto truncado na lista de clientes

- 🚀 **Melhorias de Responsividade no Stepper**
  - Implementada adaptação automática do Stepper para dispositivos móveis
  - Modo vertical em telas pequenas para melhor visualização das etapas
  - Ajuste dinâmico de textos e ícones conforme o tamanho da tela
  - Otimização do espaçamento em dispositivos pequenos
  - Textos mais concisos em dispositivos móveis

- 🐛 **Correção no Dashboard para Usuários Administradores**
  - Corrigido o problema de exibição de dados para usuários com perfil administrador
  - Implementado filtro de vendedores exclusivo para administradores
  - Corrigida a exibição do número total de clientes para administradores
  - Ajustado o cálculo correto de total vendido para todos os vendedores
  - Exibição adequada do ticket médio para administradores

#### 13/03/2025
- ✨ **Filtro por Vendedor no Dashboard**
  - Adição de dropdown para filtrar dados por vendedor específico
  - Atualização automática das métricas ao selecionar vendedor
  - Integração com dados existentes mantendo a análise temporal

- ✨ **Dashboard Aprimorado**
  - Implementação de análise temporal com seleção de períodos (30d, 90d, 180d, 365d, YTD)
  - Adição de comparação entre períodos com indicadores visuais
  - Gráfico de histórico de vendas com comparativo temporal
  - Métricas de desempenho com cálculos dinâmicos
  - Melhorias na responsividade para dispositivos móveis
  - Otimização da visualização de informações em diferentes tamanhos de tela

### Funcionalidades Implementadas com Sucesso
- Sistema de filtragem temporal para análise de dados
- Comparação automática entre períodos
- Visualização de crescimento percentual
- Cálculo de métricas avançadas (taxa de retenção, ticket médio)
- Interface adaptativa para mobile e desktop
- Gráficos interativos com dados comparativos
- Filtro de vendedores com atualização dinâmica das métricas 