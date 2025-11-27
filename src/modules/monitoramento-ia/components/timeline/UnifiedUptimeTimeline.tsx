import { useState, useMemo, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TimelineRulerPremium } from './TimelineRulerPremium';
import { TimelineTrackRow } from './TimelineTrackRow';
import { AnimatedPlayhead } from './AnimatedPlayhead';
import { RichTimelineTooltip } from './RichTimelineTooltip';
import { TimelineFilters } from './TimelineFilters';
import { useTimelineZoom } from '../../hooks/useTimelineZoom';
import { usePlayheadPosition } from '../../hooks/usePlayheadPosition';
import { useTimelineDrag } from '../../hooks/useTimelineDrag';

interface PanelData {
  id: string;
  code: string;
  condominiumName: string;
  segments: Array<{
    id: string;
    startTime: Date;
    endTime?: Date;
    status: 'online' | 'offline';
    duration: number;
  }>;
}

interface UnifiedUptimeTimelineProps {
  panels: PanelData[];
  startHour?: number;
  endHour?: number;
}

export const UnifiedUptimeTimeline = ({ 
  panels, 
  startHour = 0, 
  endHour = 24 
}: UnifiedUptimeTimelineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoom, pixelsPerHour, handleZoomIn, handleZoomOut, resetZoom } = useTimelineZoom();
  const { position: playheadPosition, currentTime } = usePlayheadPosition(pixelsPerHour, startHour);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Filters
  const [period, setPeriod] = useState('today');
  const [condominium, setCondominium] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showOnlyWithIssues, setShowOnlyWithIssues] = useState(false);

  // Drag to scroll
  useTimelineDrag({ 
    containerRef,
    onScrollToStart: () => console.log('Scrolled to start'),
    onScrollToEnd: () => console.log('Scrolled to end')
  });

  // Get unique condominiums
  const condominiums = useMemo(() => {
    const unique = new Map();
    panels.forEach(panel => {
      if (!unique.has(panel.condominiumName)) {
        unique.set(panel.condominiumName, { id: panel.condominiumName, name: panel.condominiumName });
      }
    });
    return Array.from(unique.values());
  }, [panels]);

  // Filter panels
  const filteredPanels = useMemo(() => {
    return panels.filter(panel => {
      // Condominium filter
      if (condominium !== 'all' && panel.condominiumName !== condominium) {
        return false;
      }

      // Only with issues filter
      if (showOnlyWithIssues) {
        const hasOffline = panel.segments.some(s => s.status === 'offline');
        if (!hasOffline) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const hasStatus = panel.segments.some(s => s.status === statusFilter);
        if (!hasStatus) return false;
      }

      return true;
    });
  }, [panels, condominium, showOnlyWithIssues, statusFilter]);

  const timelineWidth = (endHour - startHour) * pixelsPerHour;
  const timelineHeight = filteredPanels.length * 64 + 48; // 64px per track + ruler height

  const handleSegmentHover = (segment: any, panelCode: string, condominiumName: string, position: { x: number; y: number }) => {
    setTooltipData({
      panelCode,
      condominiumName,
      ...segment,
    });
    setTooltipPosition(position);
  };

  const handleSegmentLeave = () => {
    setTooltipData(null);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/20">
        <div>
          <h3 className="text-lg font-semibold">Timeline Unificada</h3>
          <p className="text-sm text-muted-foreground">
            {filteredPanels.length} {filteredPanels.length === 1 ? 'painel' : 'painéis'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1 bg-muted/50 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="h-7 w-7 p-0"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium min-w-[40px] text-center">
              {zoom.toFixed(1)}x
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 10}
              className="h-7 w-7 p-0"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={resetZoom}
            className="h-7 text-xs"
          >
            Reset
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-7 w-7 p-0"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <TimelineFilters
        period={period}
        onPeriodChange={setPeriod}
        condominium={condominium}
        onCondominiumChange={setCondominium}
        condominiums={condominiums}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        showOnlyWithIssues={showOnlyWithIssues}
        onToggleShowOnlyWithIssues={() => setShowOnlyWithIssues(!showOnlyWithIssues)}
      />

      {/* Timeline Container */}
      <div
        ref={containerRef}
        className={`relative overflow-auto cursor-grab active:cursor-grabbing ${
          isFullscreen ? 'h-[calc(100vh-180px)]' : 'h-[600px]'
        }`}
        style={{ 
          backgroundImage: 'linear-gradient(to right, hsl(var(--border) / 0.05) 1px, transparent 1px)',
          backgroundSize: `${pixelsPerHour}px 100%`
        }}
      >
        <div className="relative" style={{ width: timelineWidth, minWidth: '100%' }}>
          {/* Ruler */}
          <div className="sticky top-0 z-30 bg-background">
            <TimelineRulerPremium
              pixelsPerHour={pixelsPerHour}
              startHour={startHour}
              endHour={endHour}
            />
          </div>

          {/* Tracks */}
          <div className="relative">
            {filteredPanels.map((panel, index) => (
              <TimelineTrackRow
                key={panel.id}
                panelCode={panel.code}
                condominiumName={panel.condominiumName}
                segments={panel.segments}
                pixelsPerHour={pixelsPerHour}
                startHour={startHour}
                index={index}
                onSegmentHover={(segment, position) => 
                  handleSegmentHover(segment, panel.code, panel.condominiumName, position)
                }
                onSegmentLeave={handleSegmentLeave}
              />
            ))}
          </div>

          {/* Playhead */}
          <AnimatedPlayhead
            position={playheadPosition}
            currentTime={currentTime}
            height={timelineHeight}
          />
        </div>
      </div>

      {/* Data atual abaixo da timeline */}
      <div className="px-4 py-3 bg-background/60 backdrop-blur-sm border-t border-border/20">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            {format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Tooltip */}
      <RichTimelineTooltip
        data={tooltipData}
        position={tooltipPosition}
        onDismiss={() => setTooltipData(null)}
      />
    </div>
  );
};
