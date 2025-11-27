import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineTrackRow } from './TimelineTrackRow';
import { Button } from '@/components/ui/button';

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

interface GroupedTimelineViewProps {
  panels: PanelData[];
  pixelsPerHour: number;
  startHour: number;
}

export const GroupedTimelineView = ({ 
  panels, 
  pixelsPerHour, 
  startHour 
}: GroupedTimelineViewProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group panels by condominium
  const groupedPanels = useMemo(() => {
    const groups = new Map<string, PanelData[]>();
    
    panels.forEach(panel => {
      const groupName = panel.condominiumName;
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(panel);
    });

    // Sort groups by number of issues (descending)
    return Array.from(groups.entries())
      .map(([name, panels]) => {
        const totalIssues = panels.reduce((sum, panel) => 
          sum + panel.segments.filter(s => s.status === 'offline').length, 0
        );
        return { name, panels, totalIssues };
      })
      .sort((a, b) => b.totalIssues - a.totalIssues);
  }, [panels]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {groupedPanels.map((group) => {
        const isExpanded = expandedGroups.has(group.name);
        const hasIssues = group.totalIssues > 0;

        return (
          <div key={group.name} className="border border-border/40 rounded-lg overflow-hidden bg-background/40 backdrop-blur-sm">
            {/* Group Header */}
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-3 h-auto hover:bg-muted/50"
              onClick={() => toggleGroup(group.name)}
            >
              <div className="flex items-center gap-3 flex-1">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                
                <div className="flex-1 text-left">
                  <div className="font-semibold">{group.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {group.panels.length} {group.panels.length === 1 ? 'painel' : 'painéis'}
                  </div>
                </div>

                {hasIssues ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-destructive/10 border border-destructive/20 rounded-full">
                    <AlertCircle className="w-3 h-3 text-destructive" />
                    <span className="text-xs font-semibold text-destructive">
                      {group.totalIssues} {group.totalIssues === 1 ? 'queda' : 'quedas'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                    <CheckCircle className="w-3 h-3 text-primary" />
                    <span className="text-xs font-semibold text-primary">Operacional</span>
                  </div>
                )}
              </div>
            </Button>

            {/* Group Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-border/20"
                >
                  {group.panels.map((panel, index) => (
                    <TimelineTrackRow
                      key={panel.id}
                      panelCode={panel.code}
                      condominiumName={panel.condominiumName}
                      segments={panel.segments}
                      pixelsPerHour={pixelsPerHour}
                      startHour={startHour}
                      index={index}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
