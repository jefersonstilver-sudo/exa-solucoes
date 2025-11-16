import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { VideoScheduleManager } from '@/components/video-management/VideoScheduleManager';

interface CollapsibleScheduleManagerProps {
  videoSlots: any[];
  onScheduleUpdate: (videoId: string, scheduleRules: any[]) => Promise<void>;
  disabled?: boolean;
  orderId: string;
}

export const CollapsibleScheduleManager: React.FC<CollapsibleScheduleManagerProps> = ({
  videoSlots,
  onScheduleUpdate,
  disabled,
  orderId
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Card 
        className="shadow-sm cursor-pointer hover:bg-accent/50 transition-colors" 
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="p-2 sm:p-3">
          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
            <span>📅 Programação Semanal</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer"
        onClick={() => setIsOpen(false)}
      >
        <span className="text-xs sm:text-sm font-medium">📅 Programação Semanal</span>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </div>
      <VideoScheduleManager
        videoSlots={videoSlots}
        onScheduleUpdate={onScheduleUpdate}
        disabled={disabled}
        orderId={orderId}
      />
    </div>
  );
};
