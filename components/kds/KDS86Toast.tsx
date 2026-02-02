'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { StockStatus } from "./KDS86Panel";

interface Stock86Toast {
  id: string;
  itemName: string;
  status: StockStatus;
  updatedBy: string;
  lowCount?: number;
}

interface KDS86ToastProps {
  toast: Stock86Toast;
  onDismiss: (id: string) => void;
}

export function KDS86Toast({ toast, onDismiss }: KDS86ToastProps) {
  const isOut = toast.status === 'out';
  const isLow = toast.status === 'low';

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`${
        isOut 
          ? "bg-red-100 dark:bg-red-950 border-l-4 border-red-500" 
          : "bg-amber-100 dark:bg-amber-950 border-l-4 border-amber-500"
      } rounded-lg shadow-lg p-4 min-w-[400px]`}
    >
      <div className={`flex items-center gap-2 font-bold mb-2 ${
        isOut ? "text-red-800 dark:text-red-100" : "text-amber-800 dark:text-amber-100"
      }`}>
        <span className="text-xl">⚠️</span>
        ITEM 86&apos;d
      </div>
      <div className={`text-sm mb-3 ${
        isOut ? "text-red-700 dark:text-red-200" : "text-amber-700 dark:text-amber-200"
      }`}>
        {isOut && (
          <>
            <span className="font-bold">{toast.itemName}</span> is now <span className="font-bold">OUT</span>
          </>
        )}
        {isLow && (
          <>
            <span className="font-bold">{toast.itemName}</span> is <span className="font-bold">LOW</span>
            {toast.lowCount && ` (${toast.lowCount} left)`}
          </>
        )}
        <div className="text-xs mt-1">Marked by: {toast.updatedBy}</div>
      </div>
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className={`bg-transparent ${
            isOut 
              ? "text-red-700 dark:text-red-100 border-red-400 hover:bg-red-200 dark:hover:bg-red-900"
              : "text-amber-700 dark:text-amber-100 border-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900"
          }`}
          onClick={() => onDismiss(toast.id)}
        >
          Dismiss
        </Button>
      </div>
    </motion.div>
  );
}

interface KDS86ToastContainerProps {
  toasts: Stock86Toast[];
  onDismiss: (id: string) => void;
}

export function KDS86ToastContainer({ toasts, onDismiss }: KDS86ToastContainerProps) {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <KDS86Toast toast={toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export type { Stock86Toast };
