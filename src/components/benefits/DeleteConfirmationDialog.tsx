import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  providerName: string;
}

const DeleteConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  providerName,
}: DeleteConfirmationDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza que deseja cancelar?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você está prestes a cancelar o benefício de <strong>{providerName}</strong>.
            </p>
            <p className="text-destructive font-medium">
              ⚠️ O link do email ficará inválido imediatamente e o prestador não poderá mais acessá-lo.
            </p>
            <p className="text-muted-foreground text-sm">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sim, eliminar benefício
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationDialog;
