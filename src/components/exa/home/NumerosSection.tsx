import React from 'react';
import ExaSection from '../base/ExaSection';
import ExaCard from '../base/ExaCard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCounterAnimation } from '@/hooks/useCounterAnimation';
import { Building2, Users, Repeat, PlayCircle } from 'lucide-react';

const metrics = [
  { icon: Building2, value: 50, label: 'Prédios Conectados', suffix: '' },
  { icon: Users, value: 23000, label: 'Pessoas Alcançadas', suffix: '' },
  { icon: Repeat, value: 40, label: 'Interações/Semana', suffix: 'x' },
  { icon: PlayCircle, value: 245, label: 'Exibições/Dia', suffix: '' },
];

const NumerosSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <ExaSection background="dark">
      <div 
        ref={ref}
        className={`space-y-6 md:space-y-12 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="text-center space-y-2">
          <h2 className="font-montserrat font-extrabold text-2xl md:text-4xl lg:text-5xl text-white">
            Números que <span className="text-exa-yellow">Inspiram</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {metrics.map((metric, index) => (
            <MetricCard 
              key={index} 
              metric={metric} 
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </ExaSection>
  );
};

const MetricCard = ({ metric, isVisible }: { metric: typeof metrics[0], isVisible: boolean }) => {
  const count = useCounterAnimation(metric.value, 2000, isVisible);
  
  return (
    <ExaCard variant="gradient" className="text-center p-3 md:p-6">
      <metric.icon className="w-6 h-6 md:w-10 md:h-10 lg:w-12 lg:h-12 text-exa-yellow mx-auto mb-2 md:mb-4" />
      <div className="font-montserrat font-extrabold text-2xl md:text-4xl lg:text-5xl text-white mb-1 md:mb-2">
        {metric.value > 1000 ? (count / 1000).toFixed(0) + 'k' : count}{metric.suffix}
      </div>
      <div className="font-poppins text-gray-200 text-xs md:text-sm">
        {metric.label}
      </div>
    </ExaCard>
  );
};

export default NumerosSection;
