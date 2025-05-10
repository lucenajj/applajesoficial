# Novas Categorias de Produtos

Para que as novas categorias de produtos (EPS e Capa) funcionem corretamente, é necessário criar as tabelas correspondentes no Supabase.

## Como criar as tabelas

1. Acesse o painel administrativo do Supabase
2. Navegue até "SQL Editor"
3. Crie um novo query e execute os seguintes comandos:

```sql
-- Criar tabela de produtos EPS
CREATE TABLE IF NOT EXISTS eps_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  dimensoes TEXT NOT NULL,
  custo NUMERIC(10, 2) NOT NULL DEFAULT 0,
  margem NUMERIC(10, 2) NOT NULL DEFAULT 0,
  venda NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de produtos Capa
CREATE TABLE IF NOT EXISTS capa_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  dimensoes TEXT NOT NULL,
  custo NUMERIC(10, 2) NOT NULL DEFAULT 0,
  margem NUMERIC(10, 2) NOT NULL DEFAULT 0,
  venda NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Estrutura do Sistema

O sistema agora está organizado para suportar diferentes categorias de produtos:

- **Vigotas**: Produtos do tipo vigotas/treliças (tabela products)
- **EPS**: Produtos de EPS (tabela eps_products)
- **Capa**: Produtos do tipo capa (tabela capa_products)

Cada categoria tem sua própria página dedicada e conjunto de campos específicos adequados ao tipo de produto.

## Arquitetura

A arquitetura do sistema foi projetada para ser modular e facilmente extensível:

1. Cada categoria tem sua própria página e componente (ProductsPage, EPSProductsPage, CapaProductsPage)
2. O roteamento é feito dinamicamente com base na categoria selecionada
3. As páginas compartilham a mesma estrutura visual e funcional para consistência
4. Cada tipo de produto é armazenado em sua própria tabela para melhor organização dos dados 