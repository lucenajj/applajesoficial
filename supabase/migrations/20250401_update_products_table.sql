-- Adiciona os novos campos à tabela products
ALTER TABLE products 
ADD COLUMN fios INTEGER DEFAULT 0,
ADD COLUMN carga DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN ht DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN minimo DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN maximo DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN custo DECIMAL(10, 3) DEFAULT 0,
ADD COLUMN margem DECIMAL(10, 2) DEFAULT 0;

-- Renomeia o campo 'price' para 'venda' para manter a consistência com os novos campos
ALTER TABLE products 
RENAME COLUMN price TO venda;

-- Atualiza o tipo do produto para incluir mais categorias além de 'vigota' e 'eps'
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_type_check;

-- Cria um novo tipo ENUM com mais opções
ALTER TABLE products 
ADD CONSTRAINT products_type_check 
CHECK (type IN ('vigota', 'eps', 'ferro', 'concreto', 'outro'));

COMMENT ON COLUMN products.fios IS 'Número de fios do produto';
COMMENT ON COLUMN products.carga IS 'Carga do produto';
COMMENT ON COLUMN products.ht IS 'Altura do produto';
COMMENT ON COLUMN products.minimo IS 'Valor mínimo para o produto';
COMMENT ON COLUMN products.maximo IS 'Valor máximo para o produto';
COMMENT ON COLUMN products.custo IS 'Custo do produto';
COMMENT ON COLUMN products.margem IS 'Margem de lucro em percentual';
COMMENT ON COLUMN products.venda IS 'Valor de venda do produto (antigo preço)'; 