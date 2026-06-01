import { useTranslation } from "react-i18next";
import { DialogShell, CancelButton, DangerButton } from "./DialogShell";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  label: string;
  description?: string;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  label,
  description,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={t("dialog.delete_confirm.title")}
      width={400}
      footer={
        <>
          <CancelButton onClick={onClose} />
          <DangerButton
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t("common.delete")}
          </DangerButton>
        </>
      }
    >
      <div
        style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: "var(--text-primary)" }}>{label}</strong>{" "}
        {t("dialog.delete_confirm.message_suffix")}{" "}
        {description ? <>{description} </> : null}
        {t("dialog.delete_confirm.undo_note")}
      </div>
    </DialogShell>
  );
}
