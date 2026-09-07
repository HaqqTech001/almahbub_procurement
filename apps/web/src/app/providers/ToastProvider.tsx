import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ToastTone = "info" | "success" | "warning" | "danger";

export type ToastItem = {
  id: string;
  title: string;
  description?: string | undefined;
  tone?: ToastTone | undefined;
  durationMs?: number | undefined;
};

type ToastContextValue = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), toast.durationMs ?? 5200);
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({ toasts, push, dismiss }),
    [toasts, push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined"
        ? createPortal(
            <div className="hamd-toast-region" aria-live="polite" aria-relevant="additions">
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  className={`hamd-toast hamd-toast--${toast.tone ?? "info"}`}
                  role="status"
                >
                  <div className="hamd-toast__body">
                    <p className="hamd-toast__title">{toast.title}</p>
                    {toast.description ? (
                      <p className="hamd-toast__description">{toast.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="hamd-toast__dismiss"
                    aria-label="Dismiss notification"
                    onClick={() => dismiss(toast.id)}
                  >
                    Close
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
