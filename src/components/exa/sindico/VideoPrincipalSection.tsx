import React from 'react';
import ExaSection from '@/components/exa/base/ExaSection';
import ExaPanel from '@/components/exa/sindico/ExaPanel';
import { useVideoConfig } from '@/hooks/useVideoConfig';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Film } from 'lucide-react';
const VideoPrincipalSection = () => {
  const {
    ref,
    isVisible
  } = useScrollReveal();
  const {
    data: config,
    isLoading
  } = useVideoConfig();
  return;
};
export default VideoPrincipalSection;