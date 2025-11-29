import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts';
import { VideoTimelinePoint } from '@/hooks/useVideoReportData';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface CampaignPerformanceChartProps {
  data: VideoTimelinePoint[];
  dataInicio: string;
  dataFim: string;
}

type ZoomLevel = 'week' | 'month' | 'all';

export const CampaignPerformanceChart = ({ data, dataInicio, dataFim }: CampaignPerformanceChartProps) => {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('all');
  const [brushStartIndex, setBrushStartIndex] = useState<number>(0);
  const [brushEndIndex, setBrushEndIndex] = useState<number>(data.length - 1);

  // Obter todos os vídeos únicos para a legenda
  const uniqueVideos = data.length > 0 
    ? data[0].videosAtivos.map(v => ({ id: v.id, nome: v.nome, color: v.color }))
    : [];

  // Transformar dados para o formato do Recharts
  const chartData = data.map(point => {
    const dataPoint: any = { data: point.data };
    point.videosAtivos.forEach(video => {
      dataPoint[video.id] = video.exibicoes;
    });
    return dataPoint;
  });

  // Controles de zoom
  const handleZoom = (level: ZoomLevel) => {
    setZoomLevel(level);
    const totalPoints = data.length;
    
    if (level === 'week') {
      const endIdx = Math.min(totalPoints - 1, brushStartIndex + 7);
      setBrushEndIndex(endIdx);
    } else if (level === 'month') {
      const endIdx = Math.min(totalPoints - 1, brushStartIndex + 30);
      setBrushEndIndex(endIdx);
    } else {
      setBrushStartIndex(0);
      setBrushEndIndex(totalPoints - 1);
    }
  };

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const date = new Date(label);
    const formattedDate = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return (
      <div className="bg-background/95 backdrop-blur-xl border border-border/40 rounded-xl p-4 shadow-lg">
        <p className="font-semibold text-foreground mb-2">{formattedDate}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const video = uniqueVideos.find(v => v.id === entry.dataKey);
            if (!video || entry.value === 0) return null;
            
            return (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground flex-1">{video.nome}</span>
                <span className="font-semibold text-foreground">
                  {entry.value.toLocaleString('pt-BR')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="bg-gradient-to-br from-background via-background to-accent/5 backdrop-blur-xl border border-border/40 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground">
          📊 Evolução de Exibições por Vídeo
        </h4>
        <div className="flex gap-2">
          <Button
            variant={zoomLevel === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleZoom('week')}
            className="h-8 text-xs"
          >
            <ZoomIn className="w-3 h-3 mr-1" />
            1 Semana
          </Button>
          <Button
            variant={zoomLevel === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleZoom('month')}
            className="h-8 text-xs"
          >
            <ZoomOut className="w-3 h-3 mr-1" />
            1 Mês
          </Button>
          <Button
            variant={zoomLevel === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleZoom('all')}
            className="h-8 text-xs"
          >
            <Maximize2 className="w-3 h-3 mr-1" />
            Tudo
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart 
          data={chartData} 
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            {uniqueVideos.map((video) => (
              <linearGradient key={video.id} id={`color-${video.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={video.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={video.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          
          <XAxis 
            dataKey="data" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatXAxis}
            domain={['dataMin', 'dataMax']}
          />
          
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value.toString();
            }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="line"
            wrapperStyle={{ fontSize: '12px' }}
          />

          {uniqueVideos.map((video) => (
            <Area
              key={video.id}
              type="monotone"
              dataKey={video.id}
              stroke={video.color}
              strokeWidth={2}
              fill={`url(#color-${video.id})`}
              name={video.nome}
            />
          ))}

          {zoomLevel === 'all' && (
            <Brush
              dataKey="data"
              height={30}
              stroke="hsl(var(--primary))"
              fill="hsl(var(--muted))"
              tickFormatter={formatXAxis}
              startIndex={brushStartIndex}
              endIndex={brushEndIndex}
              onChange={(e: any) => {
                if (e?.startIndex !== undefined) setBrushStartIndex(e.startIndex);
                if (e?.endIndex !== undefined) setBrushEndIndex(e.endIndex);
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
