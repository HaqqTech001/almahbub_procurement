import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type ModalOptions = {
  title: string;
  description?: string | undefined;
  content: ReactNode;
  size?: "sm" | "md" | "lg" | undefined;
};

type ModalContextValue = {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
  isOpen: boolean;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ModalOptions | null>(null);
  const titleId = useId();

  const closeModal = useCallback(() => setActive(null), []);
  const openModal = useCallback((options: ModalOptions) => setActive(options), []);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [active, closeModal]);

  const value = useMemo(
    () => ({ openModal, closeModal, isOpen: Boolean(active) }),
    [openModal, closeModal, active],
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      {active && typeof document !== "undefined"
        ? createPortal(
            <div className="hamd-modal" role="presentation">
              <button
                type="button"
                className="hamd-modal__backdrop"
                aria-label="Close dialog"
                onClick={closeModal}
              />
              <div
                className={`hamd-modal__dialog hamd-modal__dialog--${active.size ?? "md"}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <header className="hamd-modal__header">
                  <h2 id={titleId} className="hamd-modal__title">
                    {active.title}
                  </h2>
                  <button
                    type="button"
                    className="hamd-modal__close"
                    onClick={closeModal}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </header>
                {active.description ? (
                  <p className="hamd-modal__description">{active.description}</p>
                ) : null}
                <div className="hamd-modal__body">{active.content}</div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
