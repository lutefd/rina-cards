-- Dados de exemplo para demonstração (apenas se não existirem)

-- Inserir alguns grupos e idols de exemplo para demonstração
-- Nota: Na produção, estes seriam criados pelos vendedores CEG
INSERT INTO public.photocards (
  titulo,
  descricao,
  idol,
  grupo,
  era,
  colecao,
  imagem_url,
  preco,
  tipo_venda,
  estoque,
  status,
  tags
) VALUES
  (
    'Lisa Photocard',
    'Photocard da Lisa da coleção The Album',
    'Lisa',
    'BLACKPINK',
    'The Album',
    'THE CHASE',
    '/placeholder.svg?height=400&width=300',
    12.00,
    'direto',
    5,
    'disponivel',
    ARRAY['blackpink', 'lisa', 'the-album']
  ),
  (
    'Jisoo Photocard',
    'Photocard da Jisoo',
    'Jisoo',
    'BLACKPINK',
    'Born Pink',
    'FOCUS',
    '/placeholder.svg?height=400&width=300',
    15.00,
    'ceg_nacional',
    3,
    'disponivel',
    ARRAY['blackpink', 'jisoo', 'born-pink']
  ),
  (
    'Rosé Photocard',
    'Photocard da Rosé',
    'Rosé',
    'BLACKPINK',
    'Born Pink',
    'FOCUS',
    '/placeholder.svg?height=400&width=300',
    14.00,
    'ceg_internacional',
    2,
    'disponivel',
    ARRAY['blackpink', 'rose', 'born-pink']
  ),
  (
    'Jennie Photocard',
    'Photocard da Jennie',
    'Jennie',
    'BLACKPINK',
    'The Album',
    'THE CHASE',
    '/placeholder.svg?height=400&width=300',
    18.00,
    'direto',
    1,
    'disponivel',
    ARRAY['blackpink', 'jennie', 'the-album']
  ),
  (
    'Nayeon Photocard',
    'Photocard da Nayeon',
    'Nayeon',
    'TWICE',
    'Feel Special',
    'ERA',
    '/placeholder.svg?height=400&width=300',
    13.00,
    'ceg_nacional',
    4,
    'disponivel',
    ARRAY['twice', 'nayeon', 'feel-special']
  ),
  (
    'Momo Photocard',
    'Photocard da Momo',
    'Momo',
    'TWICE',
    'More & More',
    'ERA',
    '/placeholder.svg?height=400&width=300',
    16.00,
    'direto',
    3,
    'disponivel',
    ARRAY['twice', 'momo', 'more-and-more']
  );
