
import { useState } from "react";
import type { Toast, ToasterToast } from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToastProps = Omit<ToasterToast, "id">;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// Create a store to hold the toasts
const toasts: ToasterToast[] = [];

type UseToastReturn = {
  toast: (props: Toast) => {
    id: string;
    dismiss: () => void;
    update: (props: ToasterToastProps) => void;
  };
  toasts: ToasterToast[];
  dismiss: (toastId?: string) => void;
};

export const useToast = (): UseToastReturn => {
  const dismiss = (toastId?: string) => {
    const toastToRemove = toastId
      ? toasts.find((toast) => toast.id === toastId)
      : toasts[0];

    if (toastToRemove) {
      const indexToRemove = toasts.indexOf(toastToRemove);
      if (indexToRemove !== -1) {
        toasts.splice(indexToRemove, 1);
      }
    }
  };

  const toast = (props: Toast) => {
    const id = genId();

    const update = (props: ToasterToastProps) => {
      const toastToUpdate = toasts.find((toast) => toast.id === id);
      if (toastToUpdate) {
        Object.assign(toastToUpdate, { ...props, id });
      }
    };

    const dismiss = () => {
      toasts.forEach((toast, i) => {
        if (toast.id === id) {
          toasts.splice(i, 1);
        }
      });
    };

    toasts.push({ ...props, id });
    setTimeout(() => {
      dismiss();
    }, TOAST_REMOVE_DELAY);

    return {
      id,
      dismiss,
      update,
    };
  };

  return {
    toast,
    dismiss,
    toasts,
  };
};

// Standalone toast function
export const toast = (props: Toast) => {
  const { toast: toastFn } = useToast();
  return toastFn(props);
};
