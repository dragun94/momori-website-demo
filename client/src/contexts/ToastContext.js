import { createContext, useContext } from "react";

export const ToastContext = createContext(null);

/**
 * 토스트 알림 (ToastProvider 안에서 사용)
 * @returns {{ success: (message: string) => void, error: (message: string) => void }}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast는 ToastProvider 안에서만 사용할 수 있어요.");
  return context;
}
