import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
const CredibilidadeSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const parceiros = [{
    name: 'Indexa Mídia',
    logo: '/placeholder.svg'
  }, {
    name: 'Secovi Paraná',
    logo: '/placeholder.svg'
  }, {
    name: 'Portal da Cidade',
    logo: '/placeholder.svg'
  }, {
    name: 'Condomínios Parceiros',
    logo: '/placeholder.svg'
  }];
  return;
};
export default CredibilidadeSection;