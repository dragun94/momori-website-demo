import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToastContext } from "../../../contexts/ToastContext";
import "./Toast.css";

const DURATION_MS = 3000;
const MAX_TOASTS = 3;

/** 화면 오른쪽 아래에 잠깐 떴다 사라지는 알림. useToast()로 사용 */
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timersRef.current.get(id));
    timersRef.current.delete(id);
  }, []);

  const show = useCallback(
    (type, message) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message }].slice(-MAX_TOASTS));
      timersRef.current.set(id, setTimeout(() => dismiss(id), DURATION_MS));
    },
    [dismiss],
  );

  // 화면을 벗어나면 남은 타이머 정리
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const value = useMemo(
    () => ({ success: (message) => show("success", message), error: (message) => show("error", message) }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="a-toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`a-toast a-toast--${toast.type}`}>
            <span className="a-toast__icon" aria-hidden="true">
              {toast.type === "success" ? "✓" : "!"}
            </span>
            <span className="a-toast__message">{toast.message}</span>
            <button
              type="button"
              className="a-toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="알림 닫기"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
