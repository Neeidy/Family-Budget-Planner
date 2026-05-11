/**
 * Delete-with-undo helper. Calls `deleteFn` immediately and shows a
 * 5-second toast with a "Geri Al" action that re-creates the item
 * by calling `restoreFn`. Replaces the confirm-dialog pattern in
 * non-destructive list deletes.
 *
 * Demo-mode write blocking is handled at the server (FORBIDDEN) and
 * at the calling button (disabled), so callers don't need to check
 * here — but if `deleteFn` swallows demo errors, the toast still
 * fires, which is acceptable: it's a UX courtesy, not state truth.
 */
import { toast } from "sonner";

export function deleteWithUndo<T>(opts: {
  item: T;
  description: string;
  deleteFn: (id: string) => void;
  restoreFn: (item: T) => void;
  getId: (item: T) => string;
}): void {
  const { item, description, deleteFn, restoreFn, getId } = opts;
  deleteFn(getId(item));
  toast.success(`${description} silindi`, {
    action: {
      label: "Geri Al",
      onClick: () => restoreFn(item),
    },
    duration: 5000,
  });
}
