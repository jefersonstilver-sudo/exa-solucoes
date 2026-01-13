-- Adicionar coluna empresa_elevador_id na tabela devices
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS empresa_elevador_id UUID REFERENCES fornecedores(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_devices_empresa_elevador ON devices(empresa_elevador_id);

-- Inserir algumas empresas de elevador iniciais
INSERT INTO fornecedores (cnpj, razao_social, nome_fantasia, tipo) VALUES
  ('00000000000001', 'ELEVADORES ATLAS SCHINDLER S/A', 'ATLAS SCHINDLER', 'elevador'),
  ('00000000000002', 'THYSSENKRUPP ELEVADORES S/A', 'TKE', 'elevador'),
  ('00000000000003', 'OTIS ELEVADORES LTDA', 'OTIS', 'elevador'),
  ('00000000000004', 'ORIENTE ELEVADORES LTDA', 'ORIENTE', 'elevador'),
  ('00000000000005', 'TECNO LIFT ELEVADORES', 'TECNO LIFT', 'elevador')
ON CONFLICT (cnpj) DO NOTHING;