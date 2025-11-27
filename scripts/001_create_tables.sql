-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome_completo TEXT,
  telefone TEXT,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('comprador', 'vendedor_ceg', 'admin')) DEFAULT 'comprador',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de photocards
CREATE TABLE IF NOT EXISTS public.photocards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  idol TEXT NOT NULL,
  grupo TEXT NOT NULL,
  era TEXT NOT NULL,
  colecao TEXT NOT NULL,
  imagem_url TEXT,
  preco DECIMAL(10, 2),
  tipo_venda TEXT CHECK (tipo_venda IN ('direto', 'ceg_nacional', 'ceg_internacional')),
  vendedor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  estoque INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('disponivel', 'reservado', 'vendido')) DEFAULT 'disponivel',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de wishlists
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL DEFAULT 'Minha Wishlist',
  descricao TEXT,
  visibilidade TEXT CHECK (visibilidade IN ('publica', 'privada')) DEFAULT 'publica',
  layout_config JSONB DEFAULT '{"grid_size": 8, "show_labels": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de itens da wishlist
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID REFERENCES public.wishlists(id) ON DELETE CASCADE NOT NULL,
  photocard_id UUID REFERENCES public.photocards(id) ON DELETE SET NULL,
  idol TEXT NOT NULL,
  grupo TEXT,
  era TEXT,
  colecao TEXT,
  imagem_url TEXT,
  posicao INTEGER NOT NULL,
  status TEXT CHECK (status IN ('desejado', 'comprado', 'otw', 'prioridade')) DEFAULT 'desejado',
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de CEGs (Compras em Grupo)
CREATE TABLE IF NOT EXISTS public.cegs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT CHECK (tipo IN ('nacional', 'internacional')) NOT NULL,
  marketplace_origem TEXT,
  data_fechamento TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('aberto', 'fechado', 'processando', 'finalizado', 'cancelado')) DEFAULT 'aberto',
  taxa_adicional DECIMAL(10, 2) DEFAULT 0,
  informacoes_envio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de pedidos do CEG
CREATE TABLE IF NOT EXISTS public.ceg_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ceg_id UUID REFERENCES public.cegs(id) ON DELETE CASCADE NOT NULL,
  comprador_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  photocard_id UUID REFERENCES public.photocards(id) ON DELETE SET NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  preco_total DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pendente', 'confirmado', 'pago', 'enviado', 'entregue', 'cancelado')) DEFAULT 'pendente',
  informacoes_contato JSONB,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photocards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cegs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceg_pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Perfis são visíveis por todos"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas RLS para photocards
CREATE POLICY "Photocards são visíveis por todos"
  ON public.photocards FOR SELECT
  USING (true);

CREATE POLICY "Vendedores CEG podem inserir photocards"
  ON public.photocards FOR INSERT
  WITH CHECK (
    auth.uid() = vendedor_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo_usuario IN ('vendedor_ceg', 'admin'))
  );

CREATE POLICY "Vendedores podem atualizar suas próprias photocards"
  ON public.photocards FOR UPDATE
  USING (auth.uid() = vendedor_id);

CREATE POLICY "Vendedores podem deletar suas próprias photocards"
  ON public.photocards FOR DELETE
  USING (auth.uid() = vendedor_id);

-- Políticas RLS para wishlists
CREATE POLICY "Wishlists públicas são visíveis por todos"
  ON public.wishlists FOR SELECT
  USING (visibilidade = 'publica' OR auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar suas próprias wishlists"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas próprias wishlists"
  ON public.wishlists FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar suas próprias wishlists"
  ON public.wishlists FOR DELETE
  USING (auth.uid() = usuario_id);

-- Políticas RLS para wishlist_items
CREATE POLICY "Items de wishlists públicas são visíveis"
  ON public.wishlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE id = wishlist_id AND (visibilidade = 'publica' OR usuario_id = auth.uid())
    )
  );

CREATE POLICY "Usuários podem adicionar items às suas wishlists"
  ON public.wishlist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE id = wishlist_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar items de suas wishlists"
  ON public.wishlist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE id = wishlist_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar items de suas wishlists"
  ON public.wishlist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE id = wishlist_id AND usuario_id = auth.uid()
    )
  );

-- Políticas RLS para cegs
CREATE POLICY "CEGs são visíveis por todos"
  ON public.cegs FOR SELECT
  USING (true);

CREATE POLICY "Vendedores CEG podem criar CEGs"
  ON public.cegs FOR INSERT
  WITH CHECK (
    auth.uid() = vendedor_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND tipo_usuario IN ('vendedor_ceg', 'admin'))
  );

CREATE POLICY "Vendedores podem atualizar seus próprios CEGs"
  ON public.cegs FOR UPDATE
  USING (auth.uid() = vendedor_id);

-- Políticas RLS para ceg_pedidos
CREATE POLICY "Pedidos visíveis para compradores e vendedores"
  ON public.ceg_pedidos FOR SELECT
  USING (
    auth.uid() = comprador_id OR
    EXISTS (SELECT 1 FROM public.cegs WHERE id = ceg_id AND vendedor_id = auth.uid())
  );

CREATE POLICY "Compradores podem criar pedidos"
  ON public.ceg_pedidos FOR INSERT
  WITH CHECK (auth.uid() = comprador_id);

CREATE POLICY "Compradores podem atualizar seus pedidos"
  ON public.ceg_pedidos FOR UPDATE
  USING (auth.uid() = comprador_id);

CREATE POLICY "Vendedores CEG podem atualizar status dos pedidos"
  ON public.ceg_pedidos FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.cegs WHERE id = ceg_id AND vendedor_id = auth.uid())
  );

-- Criar índices para melhor performance
CREATE INDEX idx_photocards_vendedor ON public.photocards(vendedor_id);
CREATE INDEX idx_photocards_idol ON public.photocards(idol);
CREATE INDEX idx_photocards_grupo ON public.photocards(grupo);
CREATE INDEX idx_photocards_status ON public.photocards(status);
CREATE INDEX idx_wishlists_usuario ON public.wishlists(usuario_id);
CREATE INDEX idx_wishlist_items_wishlist ON public.wishlist_items(wishlist_id);
CREATE INDEX idx_cegs_vendedor ON public.cegs(vendedor_id);
CREATE INDEX idx_cegs_status ON public.cegs(status);
CREATE INDEX idx_ceg_pedidos_ceg ON public.ceg_pedidos(ceg_id);
CREATE INDEX idx_ceg_pedidos_comprador ON public.ceg_pedidos(comprador_id);
