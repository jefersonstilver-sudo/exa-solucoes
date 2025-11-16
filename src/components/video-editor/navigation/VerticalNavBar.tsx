import { 
  Film, 
  Sparkles, 
  Type, 
  Shapes, 
  Music, 
  ArrowRightLeft, 
  Wand2, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  id: string;
  icon: typeof Film;
  label: string;
}

interface VerticalNavBarProps {
  activePanel: string | null;
  onPanelChange: (panelId: string | null) => void;
}

const navItems: NavItem[] = [
  { id: 'media', icon: Film, label: 'Media' },
  { id: 'templates', icon: Sparkles, label: 'Templates' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'elements', icon: Shapes, label: 'Elements' },
  { id: 'audio', icon: Music, label: 'Audio' },
  { id: 'transitions', icon: ArrowRightLeft, label: 'Transitions' },
  { id: 'effects', icon: Wand2, label: 'Effects' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export const VerticalNavBar = ({ activePanel, onPanelChange }: VerticalNavBarProps) => {
  const handleClick = (panelId: string) => {
    // Toggle: if same panel is clicked, close it
    if (activePanel === panelId) {
      onPanelChange(null);
    } else {
      onPanelChange(panelId);
    }
  };

  return (
    <div className="w-[60px] bg-muted/30 border-r flex flex-col">
      <TooltipProvider delayDuration={300}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleClick(item.id)}
                  className={cn(
                    "w-full h-14 flex flex-col items-center justify-center gap-1",
                    "hover:bg-muted/50 transition-colors relative group",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-full bg-primary" />
                  )}
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
};
