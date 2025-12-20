import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { VideoTimelinePoint } from '@/hooks/useVideoReportData';

interface CampaignPerformanceChartProps {
  data: VideoTimelinePoint[];
}

export const CampaignPerformanceChart = ({ data }: CampaignPerformanceChartProps) => {
  const [zoomLevel, setZoomLevel] = useState<'1w' | '1m' | 'all'>('all');

  // Extrair todos os vídeos únicos
  const allVideos = Array.from(
    new Set(
      data.flatMap(point => 
        point.videosAtivos.map(v => JSON.stringify({ id: v.id, nome: v.nome, color: v.color }))
      )
    )
  ).map(str => JSON.parse(str));

  // Preparar dados para o gráfico com HORAS
  const chartData = data.map(point => {
    const dataPoint: any = {
      data: point.data,
      dataFormatada: format(new Date(point.data), 'dd/MM', { locale: ptBR }),
    };

    // Adicionar HORAS de cada vídeo
    point.videosAtivos.forEach(video => {
      dataPoint[video.id] = video.horasExibidas;
    });

    return dataPoint;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && label) {
      // Validar se label é uma data válida
      const dateValue = new Date(label);
      if (isNaN(dateValue.getTime())) return null;
      
      return (
        <div className="bg-white rounded-xl shadow-lg p-4 border border-border/40">
          <p className="font-semibold text-sm mb-2">
            {format(dateValue, 'dd \'de\' MMMM', { locale: ptBR })}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => {
              const video = allVideos.find(v => v.id === entry.dataKey);
              if (!video) return null;
              
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: video.color }}
                  />
                  <span className="text-muted-foreground truncate max-w-[120px]">
                    {video.nome}
                  </span>
                  <span className="font-semibold text-[#9C1E1E] ml-auto">
                    {entry.value.toFixed(1)}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Controles de Zoom */}
      <div className="flex items-center gap-2">
        <Button
          variant={zoomLevel === '1w' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setZoomLevel('1w')}
          className={zoomLevel === '1w' ? 'bg-[#9C1E1E] hover:bg-[#7A1717]' : ''}
        >
          1 Semana
        </Button>
        <Button
          variant={zoomLevel === '1m' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setZoomLevel('1m')}
          className={zoomLevel === '1m' ? 'bg-[#9C1E1E] hover:bg-[#7A1717]' : ''}
        >
          1 Mês
        </Button>
        <Button
          variant={zoomLevel === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setZoomLevel('all')}
          className={zoomLevel === 'all' ? 'bg-[#9C1E1E] hover:bg-[#7A1717]' : ''}
        >
          Todo Período
        </Button>
      </div>

      <div className="w-full h-[400px]" id="campaign-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {allVideos.map((video, index) => (
                <linearGradient key={video.id} id={`gradient-${video.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={video.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={video.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            <XAxis
              dataKey="dataFormatada"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${value.toFixed(0)}h`}
              label={{ value: 'Horas de Exibição', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              verticalAlign="top"
              height={40}
              iconType="circle"
              formatter={(value) => {
                const video = allVideos.find(v => v.id === value);
                return video?.nome || value;
              }}
            />
            
            {allVideos.map((video) => (
              <Area
                key={video.id}
                type="monotone"
                dataKey={video.id}
                stroke={video.color}
                strokeWidth={2}
                fill={`url(#gradient-${video.id})`}
                fillOpacity={1}
              />
            ))}
            
            <Brush
              dataKey="dataFormatada"
              height={30}
              stroke="#9C1E1E"
              fill="#FEF2F2"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
