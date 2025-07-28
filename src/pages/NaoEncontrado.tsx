import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function NaoEncontrado() {
  const navigate = useNavigate();

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center min-h-[80vh] px-4"
      >
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-red-600">
              Página Não Encontrada
            </CardTitle>
            <CardDescription>
              A página que você está procurando não existe.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className="bg-red-50 p-4 rounded-full inline-flex mb-6">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            
            <p className="text-lg text-gray-700 text-center mb-6">
              Ops! A página que você está tentando acessar não foi encontrada.
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={() => navigate('/')}
                className="bg-indexa-purple hover:bg-indexa-purple-dark flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Voltar ao Início
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate('/cadastro')}
                className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple/10 flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Criar Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
}