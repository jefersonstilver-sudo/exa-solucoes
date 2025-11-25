import React from 'react';
import { PageLayout } from '@/design-system';
import { AppleTabs, AppleTabsList, AppleTabsTrigger, AppleTabsContent } from '@/design-system';
import { RelatorioGeral } from '../components/relatorios/RelatorioGeral';
import { RelatorioEduardo } from '../components/relatorios/RelatorioEduardo';
import { RelatorioIRIS } from '../components/relatorios/RelatorioIRIS';
import { RelatorioEXAAlert } from '../components/relatorios/RelatorioEXAAlert';

export const RelatoriosCorporativos = () => {
  return (
    <PageLayout
      title="Relatórios Corporativos"
      subtitle="Análise completa de conversas, escalações e alertas"
    >
      <AppleTabs defaultValue="geral" className="w-full">
        <AppleTabsList className="w-full sm:w-auto">
          <AppleTabsTrigger value="geral">Visão Geral</AppleTabsTrigger>
          <AppleTabsTrigger value="eduardo">Eduardo</AppleTabsTrigger>
          <AppleTabsTrigger value="iris">IRIS</AppleTabsTrigger>
          <AppleTabsTrigger value="exa">EXA Alert</AppleTabsTrigger>
        </AppleTabsList>
        
        <AppleTabsContent value="geral">
          <RelatorioGeral />
        </AppleTabsContent>
        
        <AppleTabsContent value="eduardo">
          <RelatorioEduardo />
        </AppleTabsContent>
        
        <AppleTabsContent value="iris">
          <RelatorioIRIS />
        </AppleTabsContent>
        
        <AppleTabsContent value="exa">
          <RelatorioEXAAlert />
        </AppleTabsContent>
      </AppleTabs>
    </PageLayout>
  );
};

export default RelatoriosCorporativos;
