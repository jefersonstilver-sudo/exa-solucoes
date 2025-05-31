
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown,
  UserCheck,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Building,
  Trophy,
  Sparkles,
  BarChart3,
  DollarSign,
  Eye,
  Gauge,
  Lock,
  Compass,
  Heart,
  MessageCircle
} from 'lucide-react';

interface ObjectionsSectionProps {
  onScrollToForm: () => void;
}

const ObjectionsSection: React.FC<ObjectionsSectionProps> = ({ onScrollToForm }) => {
  const [openObjection, setOpenObjection] = useState<number | null>(null);

  const objections = [
    {
      id: 1,
      objection: "Eu conheço meu público melhor do que qualquer agência.",
      answer: "Exatamente por isso que o nosso processo começa escutando você.",
      explanation: "Na Indexa, não criamos nada sem absorver primeiro sua visão, suas dores e sua experiência. O que fazemos é transformar esse conhecimento profundo em uma comunicação que toca o público com a linguagem atual. É como lapidar um diamante que você já tem.",
      icon: <UserCheck className="h-6 w-6 text-[#00FFAB]" />,
      category: "conhecimento"
    },
    {
      id: 2,
      objection: "Marketing é só aparência. O que importa é entregar um bom serviço.",
      answer: "E é justamente por entregar algo bom que o mundo precisa saber disso.",
      explanation: "Hoje, quem não comunica, desaparece. O marketing não é maquiagem, é tradução: traduzimos sua qualidade em percepções reais, desejo e crescimento. Um bom serviço com boa comunicação transforma sua empresa em referência.",
      icon: <Wrench className="h-6 w-6 text-[#00FFAB]" />,
      category: "percepção"
    },
    {
      id: 3,
      objection: "Já contratei agência antes e só tive dor de cabeça.",
      answer: "Essa é uma dor muito comum – e é por isso que criamos um modelo totalmente diferente.",
      explanation: "Nosso método é de cocriação estratégica, com cronograma, reuniões, relatórios, entregáveis e clareza total. Somos especialistas em resgatar marcas que foram frustradas por agências anteriores.",
      icon: <AlertTriangle className="h-6 w-6 text-[#00FFAB]" />,
      category: "confiança"
    },
    {
      id: 4,
      objection: "Minha empresa ainda não está no nível de precisar de uma agência.",
      answer: "O marketing certo é o que leva a empresa para o próximo nível.",
      explanation: "Você não espera crescer para se posicionar. Você se posiciona para crescer. A diferença está em fazer isso com inteligência, estratégia e respeito ao seu estágio atual — exatamente como a Indexa faz.",
      icon: <TrendingUp className="h-6 w-6 text-[#00FFAB]" />,
      category: "crescimento"
    },
    {
      id: 5,
      objection: "Prefiro manter tudo interno, com alguém que esteja aqui todo dia.",
      answer: "A boa notícia é que você pode manter sua equipe interna.",
      explanation: "Mas o que oferecemos é pensamento externo estratégico, com visão de mercado, criatividade fresca e ferramentas que sua equipe nem sempre domina. A soma da sua proximidade com nossa visão ampla cria um modelo imbatível.",
      icon: <Building className="h-6 w-6 text-[#00FFAB]" />,
      category: "autonomia"
    },
    {
      id: 6,
      objection: "Meus concorrentes também não fazem nada disso e estão bem.",
      answer: "Estar \"bem\" é suficiente pra você?",
      explanation: "Porque a maioria só sobrevive — mas não domina. Quem comunica melhor, cresce mais rápido, conquista mais espaço e atrai os melhores clientes. Quem faz diferente, colhe diferente.",
      icon: <Trophy className="h-6 w-6 text-[#00FFAB]" />,
      category: "competição"
    },
    {
      id: 7,
      objection: "Marketing virou só modinha com IA, reels e dancinha.",
      answer: "A gente também odeia superficialidade.",
      explanation: "Por isso, aqui na Indexa, o conteúdo é construído com resposta sensorial, profundidade estratégica e um framework testado: o TACOH. Não vendemos reels, vendemos movimento, com narrativa e propósito.",
      icon: <Sparkles className="h-6 w-6 text-[#00FFAB]" />,
      category: "qualidade"
    },
    {
      id: 8,
      objection: "Não vejo retorno no marketing digital.",
      answer: "É porque você ainda não fez marketing orientado a resultado real.",
      explanation: "A Indexa entrega planejamento, execução e relatórios. Medimos o que importa, com foco em ROI — e não em vaidade digital. Cada campanha tem metas claras e impacto mensurável. E isso, sim, dá retorno.",
      icon: <BarChart3 className="h-6 w-6 text-[#00FFAB]" />,
      category: "resultados"
    },
    {
      id: 9,
      objection: "O marketing me afasta do que é essencial: vender.",
      answer: "Na verdade, ele é a base da venda.",
      explanation: "Sem posicionamento, sua equipe comercial luta sozinha. Com marketing bem-feito, o cliente já chega com desejo, confiança e metade da venda feita. Isso é escala.",
      icon: <DollarSign className="h-6 w-6 text-[#00FFAB]" />,
      category: "vendas"
    },
    {
      id: 10,
      objection: "Não gosto da ideia de expor minha empresa demais.",
      answer: "Expor é diferente de posicionar.",
      explanation: "Você escolhe o quanto mostrar. A gente só traduz seus valores em conteúdo que inspira, gera respeito e atrai os clientes certos. É exposição com controle e propósito — não com exagero.",
      icon: <Eye className="h-6 w-6 text-[#00FFAB]" />,
      category: "exposição"
    },
    {
      id: 11,
      objection: "Gastar com agência agora vai me travar financeiramente.",
      answer: "E continuar apagando incêndios com comunicação amadora tem custado quanto?",
      explanation: "A questão não é o custo, é o desperdício de oportunidade. Com planejamento certo, você transforma investimento em alavanca. E o retorno cobre a despesa — e vai além.",
      icon: <DollarSign className="h-6 w-6 text-[#00FFAB]" />,
      category: "investimento"
    },
    {
      id: 12,
      objection: "Marketing é incerto. Prefiro investir onde posso medir retorno direto.",
      answer: "Essa é exatamente nossa proposta.",
      explanation: "Toda campanha Indexa tem planejamento de metas, indicadores de performance e relatórios contínuos. Você acompanha o impacto em tempo real. É marketing com método, não com achismo.",
      icon: <Gauge className="h-6 w-6 text-[#00FFAB]" />,
      category: "medição"
    },
    {
      id: 13,
      objection: "Tenho medo de depender demais de uma agência e perder minha autonomia.",
      answer: "Na Indexa, você não depende, você comanda.",
      explanation: "Nosso papel é ser uma extensão estratégica da sua visão. Você aprova, você valida, e você recebe estrutura para que o marketing trabalhe por você — sem travar sua autonomia.",
      icon: <Lock className="h-6 w-6 text-[#00FFAB]" />,
      category: "controle"
    },
    {
      id: 14,
      objection: "Meu negócio é tradicional. Não combina com essas campanhas modernas.",
      answer: "Modernidade e tradição não se anulam — se combinam.",
      explanation: "Sabemos adaptar o tom, a linguagem e o formato para respeitar o legado da sua marca, mas sem deixá-la ultrapassada. A tradição precisa estar viva e presente no tempo atual.",
      icon: <Compass className="h-6 w-6 text-[#00FFAB]" />,
      category: "tradição"
    },
    {
      id: 15,
      objection: "Não acredito que alguém de fora consiga captar a essência da minha marca.",
      answer: "E é por isso que nossa metodologia começa com uma imersão estratégica.",
      explanation: "Ninguém escreve por você — escrevemos com você. Nossa equipe mergulha na sua essência com conversas, workshops, pesquisas e mapeamento da sua alma empresarial. A Indexa traduz. Não distorce.",
      icon: <Heart className="h-6 w-6 text-[#00FFAB]" />,
      category: "essência"
    }
  ];

  const toggleObjection = (id: number) => {
    setOpenObjection(openObjection === id ? null : id);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-black to-[#3C1361]/20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ainda tem <span className="text-[#00FFAB]">dúvidas?</span> Entendemos.
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto">
            Respondemos as 15 objeções mais comuns de empresários sobre campanhas de marketing estratégico
          </p>
        </div>

        {/* Grid de Objeções - Desktop: 3 colunas, Mobile: 1 coluna */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {objections.map((objection, index) => (
            <Card 
              key={objection.id} 
              className={`bg-white/5 border-white/10 hover:border-[#00FFAB]/50 transition-all duration-300 cursor-pointer ${
                openObjection === objection.id ? 'border-[#00FFAB] bg-[#00FFAB]/5' : ''
              }`}
              onClick={() => toggleObjection(objection.id)}
            >
              <CardContent className="p-6">
                {/* Header da Objeção */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center flex-1">
                    <div className="w-10 h-10 bg-[#00FFAB]/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      {objection.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm leading-tight">
                        "{objection.objection}"
                      </h3>
                    </div>
                  </div>
                  <ChevronDown 
                    className={`h-5 w-5 text-[#00FFAB] transition-transform duration-300 flex-shrink-0 ml-2 ${
                      openObjection === objection.id ? 'rotate-180' : ''
                    }`} 
                  />
                </div>

                {/* Resposta Rápida */}
                <div className="mb-4">
                  <p className="text-[#00FFAB] font-bold text-sm">
                    ✓ {objection.answer}
                  </p>
                </div>

                {/* Explicação Expandida */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openObjection === objection.id 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {objection.explanation}
                    </p>
                  </div>
                </div>

                {/* Badge da Categoria */}
                <div className="mt-4 flex justify-between items-center">
                  <Badge 
                    variant="outline" 
                    className="border-[#00FFAB]/30 text-[#00FFAB]/70 text-xs"
                  >
                    {objection.category}
                  </Badge>
                  <span className="text-xs text-gray-500">#{objection.id}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA da Seção */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-[#3C1361]/20 to-[#00FFAB]/20 backdrop-blur-sm p-8 rounded-2xl border border-[#00FFAB]/30">
            <MessageCircle className="h-12 w-12 text-[#00FFAB] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">
              Sua dúvida não está aqui?
            </h3>
            <p className="text-lg text-gray-300 mb-6">
              Agende uma conversa e esclarecemos tudo pessoalmente
            </p>
            <Button
              onClick={onScrollToForm}
              className="bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white font-bold py-3 px-6 rounded-full hover:scale-105 transition-transform duration-300"
            >
              Conversar com Especialista
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ObjectionsSection;
