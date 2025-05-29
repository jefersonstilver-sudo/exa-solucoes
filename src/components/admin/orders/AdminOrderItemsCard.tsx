
import React from 'react';
import { MonitorPlay, MapPin, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface OrderItem {
  id: string;
  panelCode: string;
  panelName: string;
  location: string;
  duration: string;
  price: number;
  startDate: string;
  endDate: string;
}

interface AdminOrderItemsCardProps {
  items: OrderItem[];
}

export const AdminOrderItemsCard: React.FC<AdminOrderItemsCardProps> = ({
  items
}) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <MonitorPlay className="h-5 w-5 mr-2 text-amber-400" />
          Painéis Contratados
        </CardTitle>
        <CardDescription className="text-slate-400">
          {items.length} painéis neste pedido
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <MonitorPlay className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{item.panelCode}</h3>
                  <p className="text-sm text-slate-300">{item.panelName}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <p className="text-xs text-slate-400">{item.location}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <p className="text-xs text-slate-400">{item.duration}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-white">R$ {item.price.toFixed(2)}</p>
                <p className="text-xs text-slate-400">
                  {item.startDate} - {item.endDate}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
