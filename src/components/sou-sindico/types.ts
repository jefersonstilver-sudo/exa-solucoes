
export interface SindicoFormData {
  nomeCompleto: string;
  nomePredio: string;
  endereco: string;
  numeroAndares: string;
  numeroUnidades: string;
  elevadoresSociais: string;
  elevadoresServico: string;
  email: string;
  celular: string;
}

export interface Benefit {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  desc: string;
  icon: React.ComponentType<any>;
}

export interface Testimonial {
  text: string;
  author: string;
  building: string;
}
