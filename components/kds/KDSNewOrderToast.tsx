'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface NewOrderToast {
  id: string;
  orderNumber: string;
  orderType: "dine_in" | "pickup";
  tableNumber: string | null;
  customerName: string | null;
  itemCount: number;
  isPriority?: boolean;
}

interface KDSNewOrderToastProps {
  toast: NewOrderToast;
  onView: (orderId: string) => void;
  onDismiss: (orderId: string) => void;
}

export function KDSNewOrderToast({ toast, onView, onDismiss }: KDSNewOrderToastProps) {
  const displayText = toast.orderType === "dine_in" && toast.tableNumber
    ? `Table ${toast.tableNumber}`
    : `Pickup ${toast.customerName}`;

  const icon = toast.isPriority ? "⭐" : "🔔";
  const title = toast.isPriority ? "Priority Order" : "New Order";

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`rounded-lg shadow-lg p-4 flex items-center justify-between gap-4 cursor-pointer min-w-[400px] ${
        toast.isPriority 
          ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400" 
          : "bg-card border border-border"
      }`}
      onClick={() => onDismiss(toast.id)}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex items-center gap-2 text-sm flex-wrap flex-1 min-w-0">
          <span className="font-semibold whitespace-nowrap">{title}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-medium whitespace-nowrap">#{toast.orderNumber}</span>
          <span className="text-muted-foreground">·</span>
          <span className="whitespace-nowrap">{displayText}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground whitespace-nowrap">{toast.itemCount} items</span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="font-semibold flex-shrink-0 bg-transparent"
        onClick={(e) => {
          e.stopPropagation();
          onView(toast.id);
        }}
      >
        VIEW
      </Button>
    </motion.div>
  );
}

interface KDSToastContainerProps {
  toasts: NewOrderToast[];
  onView: (orderId: string) => void;
  onDismiss: (orderId: string) => void;
}

export function KDSToastContainer({ toasts, onView, onDismiss }: KDSToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <KDSNewOrderToast toast={toast} onView={onView} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
