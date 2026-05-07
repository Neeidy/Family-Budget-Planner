import { DialogShell, CancelButton, DangerButton } from "./DialogShell";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  label: string;
  description?: string;
}

export function DeleteConfirmDialog({ open, onClose, onConfirm, label, description }: DeleteConfirmDialogProps) {
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title="Silmek istediğinizden emin misiniz?"
      width={400}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <DangerButton onClick={() => { onConfirm(); onClose(); }}>Sil</DangerButton>
        </>
      }
    >
      <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
        <strong style={{ color: "var(--text-primary)" }}>{label}</strong> kalıcı olarak silinecek.{" "}
        {description ? <>{description} </> : null}
        Bu işlem geri alınamaz, ancak son silme Ctrl+Z ile geri alınabilir.
      </div>
    </DialogShell>
  );
}
