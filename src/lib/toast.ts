import { useState, useEffect, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let toastListeners: Array<(toast: Toast) => void> = [];
let toastCount = 0;

export function toast(message: string, type: Toast["type"] = "info") {
  const id = `toast-${++toastCount}`;
  const t: Toast = { id, message, type };
  toastListeners.forEach((fn) => fn(t));
}

export function useToastListener() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 2500);
  }, []);

  useEffect(() => {
    toastListeners.push(addToast);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  return toasts;
}
