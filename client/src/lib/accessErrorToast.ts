import { toast } from "sonner";

const ACCESS_ERROR_MESSAGE =
  "Cloudflare oturumunuz dolmuş olabilir. Sayfayı yenileyip Access girişini tamamlayın.";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function isLikelyAccessSessionError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("load failed") ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network error")
  );
}

export function toastAccessAwareError(
  error: unknown,
  fallbackMessage: string
): void {
  if (!isLikelyAccessSessionError(error)) {
    toast.error(getErrorMessage(error) || fallbackMessage);
    return;
  }

  toast.error(ACCESS_ERROR_MESSAGE, {
    description: "Uygulama ekranı acik kalsa bile API oturumu yenilenmek isteyebilir.",
    action: {
      label: "Yenile",
      onClick: () => window.location.reload(),
    },
  });
}
