
import { MessageSquare, Zap, Users, CheckCircle, TrendingUp, Award, Bot, Building2 } from 'lucide-react';
import { Benefit, HowItWorksStep, Testimonial } from './types';

export const benefits: Benefit[] = [
  { icon: MessageSquare, title: 'Comunicação Inteligente via WhatsApp', desc: 'Assistente IA integrado ao WhatsApp para gestão sem complicação' },
  { icon: Zap, title: 'Avisos em 20 minutos', desc: 'Publique comunicados instantaneamente no elevador' },
  { icon: TrendingUp, title: 'Zero papel e burocracia', desc: 'Gestão 100% digital que economiza tempo e recursos' }
];

export const howItWorksSteps: HowItWorksStep[] = [
  { step: '1', title: 'Instalação gratuita', desc: 'Nossa equipe instala o painel sem custo', icon: Building2 },
  { step: '2', title: 'WhatsApp conectado', desc: 'Receba acesso ao nosso bot especializado', icon: MessageSquare },
  { step: '3', title: 'Publique com facilidade', desc: 'Envie textos ou imagens pelo WhatsApp', icon: Zap },
  { step: '4', title: 'Avisos no ar em 20min', desc: 'Moradores veem as informações no elevador', icon: Users }
];

