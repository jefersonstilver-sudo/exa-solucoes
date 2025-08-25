import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface AdminActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText: string;
  requireReason: boolean;
  loading: boolean;
  destructive?: boolean;
  onConfirm: (reason?: string) => void;
}

const AdminActionModal: React.FC<AdminActionModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  requireReason,
  loading,
  destructive = false,
  onConfirm
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      return;
    }
    onConfirm(reason.trim() || undefined);
  };

  const handleCancel = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {destructive && <AlertTriangle className="h-5 w-5 text-red-500" />}
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {requireReason && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">
                Motivo da ação <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo desta ação administrativa..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-20"
                disabled={loading}
              />
              {requireReason && !reason.trim() && (
                <p className="text-sm text-red-500">
                  É obrigatório informar o motivo da ação
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading || (requireReason && !reason.trim())}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminActionModal;