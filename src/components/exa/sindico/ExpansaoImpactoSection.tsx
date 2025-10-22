import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCounterAnimation } from '@/hooks/useCounterAnimation';
import { Building, TrendingUp, MapPin } from 'lucide-react';
const ExpansaoImpactoSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const count50 = useCounterAnimation(50, 2000, isVisible);
  const count100 = useCounterAnimation(100, 2000, isVisible);
  const milestones = [{
    icon: Building,
    value: count50,
    label: 'prédios conectados',
    year: 'Hoje'
  }, {
    icon: TrendingUp,
    value: count100,
    label: 'prédios conectados',
    year: '2025'
  }, {
    icon: MapPin,
    value: '3',
    label: 'países alcançados',
    year: '2026'
  }];
  return;
};
export default ExpansaoImpactoSection;