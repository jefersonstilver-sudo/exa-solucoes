import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimeRangeSelectorProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  disabled?: boolean;
}

export const TimeRangeSelector = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false
}: TimeRangeSelectorProps) => {
  const validateTimeRange = (start: string, end: string) => {
    if (!start || !end) return true;
    
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    
    return startMinutes < endMinutes;
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isValidRange = validateTimeRange(startTime, endTime);

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-foreground">
        Horário de Exibição
      </Label>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-time" className="text-sm text-muted-foreground">
            Início
          </Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            disabled={disabled}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="end-time" className="text-sm text-muted-foreground">
            Fim
          </Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>
      
      {!isValidRange && startTime && endTime && (
        <p className="text-sm text-destructive">
          O horário de início deve ser anterior ao horário de fim
        </p>
      )}
      
      {startTime && endTime && isValidRange && (
        <p className="text-sm text-muted-foreground">
          Duração: {Math.floor((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60)}h 
          {(timeToMinutes(endTime) - timeToMinutes(startTime)) % 60}min
        </p>
      )}
    </div>
  );
};