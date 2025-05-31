
import React from 'react';
import { Testimonial } from './types';

interface TestimonialsSectionProps {
  isVisible: boolean;
  testimonials: Testimonial[];
}

const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ isVisible, testimonials }) => {
  return (
    <section className={`py-20 px-4 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-16">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Depoimentos Reais
          </span>
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-purple-500/20 relative">
              <div className="absolute -top-4 left-8">
                <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center">
                  <span className="text-gray-900 text-xl font-bold">"</span>
                </div>
              </div>
              
              <p className="text-lg italic mb-6 mt-4">"{testimonial.text}"</p>
              <div>
                <p className="font-bold text-purple-400">{testimonial.author}</p>
                <p className="text-gray-400 text-sm">{testimonial.building}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
