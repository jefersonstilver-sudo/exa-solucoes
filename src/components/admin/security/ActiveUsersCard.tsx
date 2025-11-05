import { Users, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ActiveUsersCardProps {
  totalActive: number;
  isLoading: boolean;
}

export const ActiveUsersCard = ({ totalActive, isLoading }: ActiveUsersCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Usuários Ativos Agora
        </CardTitle>
        <div className="p-2 rounded-lg bg-blue-50">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-2xl font-bold text-muted-foreground">...</div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl font-bold">{totalActive}</div>
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3 animate-pulse text-green-500" />
              AO VIVO
            </Badge>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Ativos nos últimos 30 minutos
        </p>
      </CardContent>
    </Card>
  );
};
