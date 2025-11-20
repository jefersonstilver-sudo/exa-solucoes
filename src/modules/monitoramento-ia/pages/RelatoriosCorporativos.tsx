import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelatorioGeral } from '../components/relatorios/RelatorioGeral';
import { RelatorioEduardo } from '../components/relatorios/RelatorioEduardo';
import { RelatorioIRIS } from '../components/relatorios/RelatorioIRIS';
import { RelatorioEXAAlert } from '../components/relatorios/RelatorioEXAAlert';

export const RelatoriosCorporativos = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios Corporativos</h1>
        <p className="text-muted-foreground">
          Análise completa de conversas, escalações e alertas
        </p>
      </div>
      
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="eduardo">Eduardo</TabsTrigger>
          <TabsTrigger value="iris">IRIS</TabsTrigger>
          <TabsTrigger value="exa">EXA Alert</TabsTrigger>
        </TabsList>
        
        <TabsContent value="geral" className="mt-6">
          <RelatorioGeral />
        </TabsContent>
        
        <TabsContent value="eduardo" className="mt-6">
          <RelatorioEduardo />
        </TabsContent>
        
        <TabsContent value="iris" className="mt-6">
          <RelatorioIRIS />
        </TabsContent>
        
        <TabsContent value="exa" className="mt-6">
          <RelatorioEXAAlert />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelatoriosCorporativos;
