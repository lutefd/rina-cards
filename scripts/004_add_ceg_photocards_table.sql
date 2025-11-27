-- Criar tabela para associar photocards aos CEGs e gerenciar solicitações
CREATE TABLE IF NOT EXISTS ceg_photocards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ceg_id UUID NOT NULL REFERENCES cegs(id) ON DELETE CASCADE,
  photocard_id UUID REFERENCES photocards(id) ON DELETE SET NULL,
  
  -- Informações do photocard (pode ser solicitado sem estar cadastrado ainda)
  titulo TEXT NOT NULL,
  idol TEXT NOT NULL,
  grupo TEXT,
  era TEXT,
  colecao TEXT,
  imagem_url TEXT,
  preco DECIMAL(10, 2),
  
  -- Status da solicitação
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'solicitado', 'aprovado', 'rejeitado')),
  
  -- Se foi solicitado por um comprador
  solicitado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notas_solicitacao TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscar photocards de um CEG
CREATE INDEX IF NOT EXISTS idx_ceg_photocards_ceg_id ON ceg_photocards(ceg_id);
CREATE INDEX IF NOT EXISTS idx_ceg_photocards_status ON ceg_photocards(status);

-- RLS Policies
ALTER TABLE ceg_photocards ENABLE ROW LEVEL SECURITY;

-- Todos podem ver photocards disponíveis e aprovados
CREATE POLICY "Photocards públicos de CEG visíveis a todos"
  ON ceg_photocards FOR SELECT
  USING (status IN ('disponivel', 'aprovado'));

-- Vendedores podem ver todas as solicitações dos seus CEGs
CREATE POLICY "Vendedores veem todas solicitações dos seus CEGs"
  ON ceg_photocards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cegs
      WHERE cegs.id = ceg_photocards.ceg_id
      AND cegs.vendedor_id = auth.uid()
    )
  );

-- Compradores podem ver suas próprias solicitações
CREATE POLICY "Compradores veem suas solicitações"
  ON ceg_photocards FOR SELECT
  USING (solicitado_por = auth.uid());

-- Vendedores podem inserir photocards nos seus CEGs
CREATE POLICY "Vendedores adicionam photocards aos seus CEGs"
  ON ceg_photocards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cegs
      WHERE cegs.id = ceg_photocards.ceg_id
      AND cegs.vendedor_id = auth.uid()
    )
  );

-- Compradores podem solicitar photocards
CREATE POLICY "Compradores solicitam photocards"
  ON ceg_photocards FOR INSERT
  WITH CHECK (
    status = 'solicitado' AND
    solicitado_por = auth.uid()
  );

-- Vendedores podem atualizar photocards dos seus CEGs
CREATE POLICY "Vendedores atualizam photocards dos seus CEGs"
  ON ceg_photocards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cegs
      WHERE cegs.id = ceg_photocards.ceg_id
      AND cegs.vendedor_id = auth.uid()
    )
  );

-- Vendedores podem deletar photocards dos seus CEGs
CREATE POLICY "Vendedores deletam photocards dos seus CEGs"
  ON ceg_photocards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cegs
      WHERE cegs.id = ceg_photocards.ceg_id
      AND cegs.vendedor_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ceg_photocards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ceg_photocards_timestamp
  BEFORE UPDATE ON ceg_photocards
  FOR EACH ROW
  EXECUTE FUNCTION update_ceg_photocards_updated_at();
