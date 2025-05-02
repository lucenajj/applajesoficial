-- Corrige a restrição de tipo na tabela products
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_type_check;

-- Cria um novo tipo ENUM com as opções usadas no frontend
ALTER TABLE products 
ADD CONSTRAINT products_type_check 
CHECK (type IN ('forro', 'piso'));

-- Atualiza os dados existentes para usar os novos tipos
UPDATE products
SET type = CASE 
    WHEN type IN ('vigota', 'eps', 'ferro', 'concreto') THEN 'forro'
    ELSE 'piso'
  END; 