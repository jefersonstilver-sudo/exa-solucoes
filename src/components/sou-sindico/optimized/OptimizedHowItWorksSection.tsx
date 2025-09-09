import React, { memo } from 'react';
import { HowItWorksStep } from '../types';

interface OptimizedHowItWorksSectionProps {
  isVisible: boolean;
  steps: HowItWorksStep[];
}

const OptimizedHowItWorksSection: React.FC<OptimizedHowItWorksSectionProps> = memo(({ isVisible, steps }) => {
  return (
    <section className={`bg-white py-16 px-4 transition-all duration-500 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <h2 className={`text-4xl md:text-5xl font-bold text-center mb-16 transition-all duration-400 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}>
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Como Funciona
          </span>
        </h2>
        
        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div
                key={index}
                className={`text-center relative transition-all duration-400 hover:scale-105 ${
                  isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-12 opacity-0'
                }`}
                style={{
                  transitionDelay: isVisible ? `${index * 120}ms` : '0ms'
                }}
              >
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 to-transparent" />
                )}
                
                {/* Icon Circle */}
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl transform transition-all duration-300 hover:shadow-purple-500/25">
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {step.step}
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold mb-2 text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

OptimizedHowItWorksSection.displayName = 'OptimizedHowItWorksSection';

export default OptimizedHowItWorksSection;