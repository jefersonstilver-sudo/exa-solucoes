import { APP_VERSION } from '@/config/version';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export const VersionIndicator = () => {
  const { needsUpdate, handleUpdate } = useVersionCheck();

  if (!needsUpdate) {
    return (
      <div className="fixed bottom-4 right-4 text-xs text-muted-foreground/50 select-none">
        v{APP_VERSION}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleUpdate}
        size="sm"
        className="shadow-lg gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Atualizar para v{APP_VERSION}
      </Button>
    </div>
  );
};
