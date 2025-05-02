-- Inserir dados de exemplo para produtos
INSERT INTO products (name, type, fios, carga, ht, minimo, maximo, custo, margem, venda, description)
VALUES 
('Vigota V8', 'vigota', 3, 350, 8, 80, 350, 11.500, 15.00, 13.225, 'Vigota treliçada V8'),
('Vigota V12', 'vigota', 4, 450, 12, 120, 450, 15.800, 18.50, 18.723, 'Vigota treliçada V12'),
('EPS 40mm', 'eps', 0, 0, 4, 40, 40, 8.250, 12.00, 9.240, 'EPS para laje 40mm'),
('Ferro 5mm', 'ferro', 0, 0, 0, 0, 0, 5.780, 10.00, 6.358, 'Ferro para amarração 5mm'),
('Concreto FCK 25', 'concreto', 0, 0, 0, 0, 0, 320.500, 8.00, 346.140, 'Concreto FCK 25 MPa')
ON CONFLICT (id) DO NOTHING;

-- Atualizar qualquer dado existente para usar os novos campos (se houver produtos sem valores nestes campos)
UPDATE products
SET 
  fios = CASE 
    WHEN type = 'vigota' THEN FLOOR(RANDOM() * 4) + 2
    ELSE 0
  END,
  carga = CASE 
    WHEN type = 'vigota' THEN FLOOR(RANDOM() * 300) + 200
    ELSE 0
  END,
  ht = CASE 
    WHEN type = 'vigota' THEN FLOOR(RANDOM() * 12) + 6
    WHEN type = 'eps' THEN FLOOR(RANDOM() * 10) + 3
    ELSE 0
  END,
  minimo = CASE 
    WHEN type = 'vigota' THEN FLOOR(RANDOM() * 150) + 50
    WHEN type = 'eps' THEN FLOOR(RANDOM() * 50) + 20
    ELSE 0
  END,
  maximo = CASE 
    WHEN type = 'vigota' THEN FLOOR(RANDOM() * 300) + 200
    WHEN type = 'eps' THEN FLOOR(RANDOM() * 50) + 50
    ELSE 0
  END,
  custo = CASE 
    WHEN type = 'vigota' THEN (RANDOM() * 20) + 10
    WHEN type = 'eps' THEN (RANDOM() * 10) + 5
    ELSE (RANDOM() * 5) + 2
  END,
  margem = (RANDOM() * 20) + 5
WHERE fios IS NULL OR fios = 0; 