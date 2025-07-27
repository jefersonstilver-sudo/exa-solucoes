import { Badge } from "@/components/ui/badge";
import { DAYS_OF_WEEK } from "@/types/campaignScheduling";

interface DaysOfWeekSelectorProps {
  selectedDays: number[];
  onSelectionChange: (days: number[]) => void;
  disabled?: boolean;
}

export const DaysOfWeekSelector = ({ 
  selectedDays, 
  onSelectionChange, 
  disabled = false 
}: DaysOfWeekSelectorProps) => {
  const toggleDay = (dayValue: number) => {
    if (disabled) return;
    
    const newSelection = selectedDays.includes(dayValue)
      ? selectedDays.filter(day => day !== dayValue)
      : [...selectedDays, dayValue].sort();
    
    onSelectionChange(newSelection);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Dias da Semana
      </label>
      <div className="flex flex-wrap gap-2">
        {DAYS_OF_WEEK.map((day) => (
          <Badge
            key={day.value}
            variant={selectedDays.includes(day.value) ? "default" : "outline"}
            className={`cursor-pointer transition-colors ${
              disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-primary/80'
            }`}
            onClick={() => toggleDay(day.value)}
          >
            {day.short}
          </Badge>
        ))}
      </div>
      {selectedDays.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Selecione pelo menos um dia da semana
        </p>
      )}
    </div>
  );
};