
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Página de perfil do usuário - layout básico inicial
 */
const UserProfile: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Meu Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <p className="text-muted-foreground">
                Perfil do usuário em desenvolvimento. Esta página será expandida em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UserProfile;
