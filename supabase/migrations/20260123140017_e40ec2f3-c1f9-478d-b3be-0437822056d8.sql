-- Create table for business segments (centralized)
CREATE TABLE IF NOT EXISTS public.business_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT DEFAULT 'outros',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.business_segments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read segments
CREATE POLICY "Anyone can read segments" 
ON public.business_segments 
FOR SELECT 
USING (true);

-- Allow authenticated users to create segments
CREATE POLICY "Authenticated users can create segments" 
ON public.business_segments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow admins to update segments
CREATE POLICY "Admins can update segments" 
ON public.business_segments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_business_segments_value ON public.business_segments(value);
CREATE INDEX IF NOT EXISTS idx_business_segments_label ON public.business_segments(label);

-- Insert default segments
INSERT INTO public.business_segments (value, label, category, sort_order) VALUES
  ('tourist_attraction', 'Atrações Turísticas', 'turismo', 1),
  ('tour_guide', 'Guias Turísticos', 'turismo', 2),
  ('travel_agency', 'Agências de Turismo', 'turismo', 3),
  ('adventure_tourism', 'Turismo de Aventura', 'turismo', 4),
  ('ecological_tourism', 'Turismo Ecológico', 'turismo', 5),
  ('souvenirs', 'Lojas de Souvenirs', 'turismo', 6),
  ('duty_free', 'Duty Free / Free Shop', 'turismo', 7),
  ('cambio', 'Casas de Câmbio', 'turismo', 8),
  ('department_store', 'Lojas de Departamento', 'varejo', 10),
  ('shopping', 'Shopping Centers', 'varejo', 11),
  ('outlet', 'Outlets', 'varejo', 12),
  ('wholesale', 'Atacado e Distribuição', 'varejo', 13),
  ('electronics', 'Lojas de Eletrônicos', 'tecnologia', 20),
  ('electronics_import', 'Eletrônicos Importados', 'tecnologia', 21),
  ('lojas_paraguai', 'Shopping Eletrônicos PY', 'tecnologia', 22),
  ('cellphone', 'Celulares e Acessórios', 'tecnologia', 23),
  ('computers', 'Informática e Computadores', 'tecnologia', 24),
  ('technology', 'Tecnologia', 'tecnologia', 25),
  ('games', 'Games e Consoles', 'tecnologia', 26),
  ('restaurant', 'Restaurantes', 'alimentacao', 30),
  ('bar', 'Bares e Pubs', 'alimentacao', 31),
  ('bakery', 'Padarias e Confeitarias', 'alimentacao', 32),
  ('coffee', 'Cafeterias e Coffee Shops', 'alimentacao', 33),
  ('fast_food', 'Fast Food', 'alimentacao', 34),
  ('fastfood', 'Fast Food e Lanchonetes', 'alimentacao', 35),
  ('pizzaria', 'Pizzarias', 'alimentacao', 36),
  ('steakhouse', 'Churrascarias', 'alimentacao', 37),
  ('catering', 'Buffets e Catering', 'alimentacao', 38),
  ('food_delivery', 'Delivery de Comida', 'alimentacao', 39),
  ('hotel', 'Hotéis', 'hospedagem', 40),
  ('pousada', 'Pousadas', 'hospedagem', 41),
  ('hostel', 'Hostels e Albergues', 'hospedagem', 42),
  ('travel', 'Agências de Turismo', 'hospedagem', 43),
  ('tourism', 'Operadoras de Turismo', 'hospedagem', 44),
  ('supermarket', 'Supermercados', 'varejo', 50),
  ('minimarket', 'Mercados e Minimercados', 'varejo', 51),
  ('pharmacy', 'Farmácias e Drogarias', 'saude', 52),
  ('clothing', 'Roupas e Moda', 'moda', 60),
  ('shoes', 'Calçados', 'moda', 61),
  ('accessories', 'Acessórios e Bijuterias', 'moda', 62),
  ('jewelry', 'Joalherias e Relojoarias', 'moda', 63),
  ('perfume', 'Perfumarias e Cosméticos', 'beleza', 64),
  ('furniture', 'Móveis e Decoração', 'casa', 70),
  ('construction', 'Materiais de Construção', 'construcao', 71),
  ('hardware', 'Ferragens e Ferramentas', 'construcao', 72),
  ('import', 'Lojas de Importados', 'varejo', 73),
  ('bookstore', 'Livrarias e Papelarias', 'varejo', 74),
  ('toys', 'Brinquedos e Games', 'varejo', 75),
  ('sporting_goods', 'Artigos Esportivos', 'esportes', 76),
  ('optics', 'Óticas', 'saude', 77),
  ('health', 'Clínicas Médicas', 'saude', 80),
  ('dental', 'Clínicas Odontológicas', 'saude', 81),
  ('dentist', 'Odontologia', 'saude', 82),
  ('physiotherapy', 'Fisioterapia', 'saude', 83),
  ('psychology', 'Psicologia', 'saude', 84),
  ('nutrition', 'Nutrição', 'saude', 85),
  ('laboratory', 'Laboratórios de Análises', 'saude', 86),
  ('hospital', 'Hospitais', 'saude', 87),
  ('beauty', 'Salões de Beleza', 'beleza', 90),
  ('beauty_salon', 'Salões de Beleza', 'beleza', 91),
  ('barbershop', 'Barbearias', 'beleza', 92),
  ('aesthetics', 'Clínicas de Estética', 'beleza', 93),
  ('spa', 'Spas', 'beleza', 94),
  ('nails', 'Manicure e Pedicure', 'beleza', 95),
  ('massage', 'Massoterapia', 'beleza', 96),
  ('gym', 'Academias', 'fitness', 100),
  ('crossfit', 'CrossFit', 'fitness', 101),
  ('yoga', 'Yoga e Pilates', 'fitness', 102),
  ('martial_arts', 'Artes Marciais', 'fitness', 103),
  ('dance', 'Escolas de Dança', 'fitness', 104),
  ('personal_trainer', 'Personal Trainer', 'fitness', 105),
  ('education', 'Escolas', 'educacao', 110),
  ('university', 'Faculdades e Universidades', 'educacao', 111),
  ('course', 'Cursos e Treinamentos', 'educacao', 112),
  ('language', 'Escolas de Idiomas', 'educacao', 113),
  ('music', 'Escolas de Música', 'educacao', 114),
  ('prep_course', 'Cursos Preparatórios', 'educacao', 115),
  ('vehicle', 'Concessionárias', 'automotivo', 120),
  ('auto_dealer', 'Concessionárias', 'automotivo', 121),
  ('automotive', 'Autopeças', 'automotivo', 122),
  ('auto_repair', 'Oficinas Mecânicas', 'automotivo', 123),
  ('mechanic', 'Oficinas Mecânicas', 'automotivo', 124),
  ('car_wash', 'Lava-Jatos', 'automotivo', 125),
  ('auto_detailing', 'Estética Automotiva', 'automotivo', 126),
  ('tire', 'Borracharias', 'automotivo', 127),
  ('gas_station', 'Postos de Combustível', 'automotivo', 128),
  ('real_estate', 'Imobiliárias', 'imoveis', 130),
  ('architecture', 'Arquitetura', 'imoveis', 131),
  ('engineering', 'Engenharia', 'imoveis', 132),
  ('construction_company', 'Construtoras', 'imoveis', 133),
  ('legal', 'Advocacia', 'servicos', 140),
  ('law_firm', 'Escritórios de Advocacia', 'servicos', 141),
  ('accounting', 'Contabilidade', 'servicos', 142),
  ('consulting', 'Consultoria', 'servicos', 143),
  ('auditing', 'Auditoria', 'servicos', 144),
  ('tax', 'Assessoria Tributária', 'servicos', 145),
  ('financial', 'Serviços Financeiros', 'financeiro', 150),
  ('insurance', 'Seguros', 'financeiro', 151),
  ('investment', 'Investimentos', 'financeiro', 152),
  ('bank', 'Bancos e Cooperativas', 'financeiro', 153),
  ('software', 'Desenvolvimento de Software', 'tecnologia', 160),
  ('web_design', 'Web Design', 'tecnologia', 161),
  ('it_services', 'Serviços de TI', 'tecnologia', 162),
  ('digital_marketing', 'Marketing Digital', 'marketing', 163),
  ('social_media', 'Gestão de Redes Sociais', 'marketing', 164),
  ('advertising', 'Publicidade e Propaganda', 'marketing', 170),
  ('marketing', 'Marketing', 'marketing', 171),
  ('graphic_design', 'Design Gráfico', 'marketing', 172),
  ('printing', 'Gráficas', 'marketing', 173),
  ('events', 'Eventos e Festas', 'eventos', 180),
  ('event_venue', 'Casas de Eventos', 'eventos', 181),
  ('photography', 'Fotografia', 'eventos', 182),
  ('videography', 'Filmagem e Vídeo', 'eventos', 183),
  ('entertainment', 'Entretenimento', 'eventos', 184),
  ('cinema', 'Cinemas', 'eventos', 185),
  ('theater', 'Teatros', 'eventos', 186),
  ('music_band', 'Bandas e Músicos', 'eventos', 187),
  ('nightclub', 'Casas Noturnas', 'eventos', 188),
  ('cleaning', 'Limpeza e Conservação', 'servicos_domesticos', 190),
  ('home_cleaning', 'Limpeza Residencial', 'servicos_domesticos', 191),
  ('gardening', 'Jardinagem', 'servicos_domesticos', 192),
  ('pest_control', 'Dedetização', 'servicos_domesticos', 193),
  ('locksmith', 'Chaveiro', 'servicos_domesticos', 194),
  ('electrician', 'Eletricista', 'servicos_domesticos', 195),
  ('plumber', 'Encanador', 'servicos_domesticos', 196),
  ('painter', 'Pintor', 'servicos_domesticos', 197),
  ('handyman', 'Reparos e Manutenção', 'servicos_domesticos', 198),
  ('security', 'Segurança Patrimonial', 'seguranca', 200),
  ('private_security', 'Segurança Privada', 'seguranca', 201),
  ('surveillance', 'Monitoramento e CFTV', 'seguranca', 202),
  ('logistics', 'Logística', 'transporte', 210),
  ('transport', 'Transportes', 'transporte', 211),
  ('moving', 'Mudanças', 'transporte', 212),
  ('courier', 'Courier e Entregas', 'transporte', 213),
  ('pet', 'Pet Shops', 'pet', 220),
  ('pet_shop', 'Pet Shops', 'pet', 221),
  ('veterinary', 'Veterinárias', 'pet', 222),
  ('pet_grooming', 'Banho e Tosa', 'pet', 223),
  ('pet_hotel', 'Hotel para Pets', 'pet', 224),
  ('industry', 'Indústria', 'industria', 230),
  ('agriculture', 'Agronegócio', 'agro', 231),
  ('livestock', 'Pecuária', 'agro', 232),
  ('laundry', 'Lavanderias', 'outros', 240),
  ('funeral', 'Funerárias', 'outros', 241),
  ('religious', 'Instituições Religiosas', 'outros', 242),
  ('ngo', 'ONGs e Associações', 'outros', 243),
  ('other', 'Outros Segmentos', 'outros', 999)
ON CONFLICT (value) DO NOTHING;