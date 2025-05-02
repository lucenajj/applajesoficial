-- Atualiza as colunas minimo e maximo da tabela products para usar 3 casas decimais
ALTER TABLE public.products 
    ALTER COLUMN minimo TYPE numeric(10, 3),
    ALTER COLUMN maximo TYPE numeric(10, 3);

COMMENT ON COLUMN public.products.minimo IS 'Valor mínimo para o produto (com 3 casas decimais)';
COMMENT ON COLUMN public.products.maximo IS 'Valor máximo para o produto (com 3 casas decimais)'; 