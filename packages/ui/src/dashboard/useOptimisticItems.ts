import { useCallback, useState, useTransition } from "react";

export type OptimisticAction<T> = {
  type: "update" | "remove" | "prepend";
  id?: string;
  item?: T;
  patch?: Partial<T>;
};

/**
 * Optimistic list updates with rollback - Stripe/Linear feel without blocking UI.
 * Host provides `commit` that persists; UI updates immediately.
 */
export function useOptimisticItems<T extends { id: string }>(
  initial: T[],
  commit?: (next: T[], action: OptimisticAction<T>) => Promise<void>,
) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback((current: T[], action: OptimisticAction<T>): T[] => {
    switch (action.type) {
      case "prepend":
        return action.item ? [action.item, ...current] : current;
      case "remove":
        return current.filter((x) => x.id !== action.id);
      case "update":
        return current.map((x) =>
          x.id === action.id ? { ...x, ...action.patch } : x,
        );
      default:
        return current;
    }
  }, []);

  const run = useCallback(
    async (action: OptimisticAction<T>) => {
      const previous = items;
      const next = apply(previous, action);
      setError(null);
      startTransition(() => setItems(next));
      if (!commit) return;
      try {
        await commit(next, action);
      } catch (err) {
        setItems(previous);
        setError(err instanceof Error ? err.message : "Update failed.");
      }
    },
    [apply, commit, items],
  );

  const reset = useCallback((next: T[]) => setItems(next), []);

  return { items, pending, error, run, reset, setItems };
}
