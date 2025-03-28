-- Criação da tabela de áreas pré-definidas
CREATE TABLE IF NOT EXISTS predefined_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionando coluna predefined_area_id na tabela areas (se a tabela já existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'areas'
  ) THEN
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'areas' 
      AND column_name = 'predefined_area_id'
    ) THEN
      ALTER TABLE areas ADD COLUMN predefined_area_id UUID REFERENCES predefined_areas(id);
    END IF;
  END IF;
END
$$;

-- Inserindo algumas áreas pré-definidas de exemplo
INSERT INTO predefined_areas (name, description) VALUES
  ('Sala de Estar', 'Área comum para convivência e recepção de visitas'),
  ('Sala de Jantar', 'Área para refeições formais'),
  ('Cozinha', 'Área para preparo de alimentos'),
  ('Quarto Principal', 'Dormitório principal da residência'),
  ('Quarto de Hóspedes', 'Dormitório para visitas'),
  ('Quarto de Criança', 'Dormitório infantil'),
  ('Banheiro Social', 'Banheiro de uso comum'),
  ('Banheiro Suíte', 'Banheiro privativo do quarto principal'),
  ('Lavabo', 'Banheiro pequeno para visitas'),
  ('Área de Serviço', 'Espaço para lavanderia e serviços'),
  ('Varanda', 'Área externa coberta'),
  ('Escritório', 'Espaço para trabalho ou estudo'),
  ('Garagem', 'Área para estacionamento de veículos')
ON CONFLICT (id) DO NOTHING; 