import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Zap,
  Users,
  Building2,
  Clock,
  FileX,
  Headphones,
  Smartphone,
} from "lucide-react";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface FeaturesSectionWithHoverEffectsProps {
  isVisible?: boolean;
}

export function FeaturesSectionWithHoverEffects({ isVisible }: FeaturesSectionWithHoverEffectsProps) {
  const features: Feature[] = [
    {
      title: "Comunicação via WhatsApp",
      description: "Assistente IA integrado ao WhatsApp para gestão sem complicação",
      icon: <MessageSquare />,
    },
    {
      title: "Avisos em 20 minutos",
      description: "Publique comunicados instantaneamente no elevador do seu prédio",
      icon: <Zap />,
    },
    {
      title: "Zero papel e burocracia",
      description: "Gestão 100% digital que economiza tempo e recursos",
      icon: <FileX />,
    },
    {
      title: "Instalação gratuita",
      description: "Nossa equipe instala o painel sem custo ou manutenção",
      icon: <Building2 />,
    },
    {
      title: "Suporte 24/7",
      description: "Atendimento especializado sempre que você precisar",
      icon: <Headphones />,
    },
    {
      title: "Modernização total",
      description: "Transforme seu condomínio em um ambiente tecnológico",
      icon: <Smartphone />,
    },
    {
      title: "Engajamento garantido",
      description: "Moradores sempre informados sobre avisos importantes",
      icon: <Users />,
    },
    {
      title: "Eficiência comprovada",
      description: "Agilize processos e melhore a gestão predial",
      icon: <Clock />,
    },
  ];

  return (
    <section className={`py-20 px-4 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Resolva a Dor de Comunicação Ineficiente
          </span>
        </h2>
        <p className="text-xl text-gray-300 mb-4">
          Transforme a gestão do seu condomínio com nossa solução completa
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <Feature key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </section>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-white/10",
        (index === 0 || index === 4) && "lg:border-l border-white/10",
        index < 4 && "lg:border-b border-white/10"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-indexa-purple/20 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-indexa-purple/20 to-transparent pointer-events-none" />
      )}
      
      <div className="mb-4 relative z-10 px-10 text-indexa-mint">
        {icon}
      </div>
      
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-white/20 group-hover/feature:bg-indexa-purple transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-white group-hover/feature:text-indexa-mint">
          {title}
        </span>
      </div>
      
      <p className="text-sm text-gray-300 max-w-xs relative z-10 px-10 group-hover/feature:text-white/90 transition-colors duration-200">
        {description}
      </p>
    </div>
  );
};