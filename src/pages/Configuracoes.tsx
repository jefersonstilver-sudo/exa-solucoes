
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserSession } from '@/hooks/useUserSession';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Key, 
  ShoppingBag, 
  Bell, 
  Shield,
  ChevronRight 
} from 'lucide-react';

const Configuracoes = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserSession();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  const configOptions = [
    {
      title: 'Editar Perfil',
      description: 'Altere suas informações pessoais',
      icon: User,
      path: '/editar-perfil',
      color: 'text-blue-600'
    },
    {
      title: 'Alterar Senha',
      description: 'Modifique sua senha de acesso',
      icon: Key,
      path: '/alterar-senha',
      color: 'text-green-600'
    },
    {
      title: 'Meus Pedidos',
      description: 'Veja o histórico dos seus pedidos',
      icon: ShoppingBag,
      path: '/meus-pedidos',
      color: 'text-purple-600'
    },
    {
      title: 'Notificações',
      description: 'Configure suas preferências de notificação',
      icon: Bell,
      path: '/notificacoes',
      color: 'text-orange-600'
    },
    {
      title: 'Privacidade',
      description: 'Gerencie suas configurações de privacidade',
      icon: Shield,
      path: '/privacidade',
      color: 'text-red-600'
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600 mt-1">
              Gerencie suas preferências e configurações da conta
            </p>
          </div>

          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-[#3C1361] rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {(user.nome || user.name || user.email)?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {user.nome || user.name || 'Nome não definido'}
                    </h3>
                    <p className="text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500">
                      Role: {user.role || 'client'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {configOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <motion.div
                  key={option.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent 
                      className="p-6"
                      onClick={() => navigate(option.path)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg bg-gray-100 ${option.color}`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {option.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {option.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Configuracoes;
