'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export type { OrderChange, ModificationToast };

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

interface OrderChange {
  type: 'added' | 'removed' | 'modified';
  item: {
    name: string;
    quantity?: number;
    variant?: string;
  };
  details?: string;
}

interface ModificationToast {
  id: string;
  orderNumber: string;
  tableNumber: string | null;
  customerName: string | null;
  changes: OrderChange[];
}

interface KDSModificationToastProps {
  toast: ModificationToast;
  onView: (orderId: string) => void;
  onDismiss: (orderId: string) => void;
}

export function KDSModificationToast({ toast, onView, onDismiss }: KDSModificationToastProps) {
  const displayText = toast.tableNumber
    ? `Table ${toast.tableNumber}`
    : `Pickup ${toast.customerName}`;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="bg-amber-100 dark:bg-amber-950 border-l-4 border-amber-500 rounded-lg shadow-lg p-4 min-w-[500px]"
    >
      <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-100 mb-2">
        <span className="text-xl">⚠️</span>
        ORDER MODIFIED
      </div>
      <div className="text-sm text-amber-700 dark:text-amber-200 mb-3">
        #{toast.orderNumber} · {displayText}
      </div>
      <div className="space-y-1 mb-4">
        <div className="font-medium text-sm text-amber-800 dark:text-amber-100">Changes:</div>
        {toast.changes.map((change, i) => {
          const baseClass = "text-sm flex items-center gap-2";
          const colorClass = 
            change.type === 'added' ? 'text-green-700 dark:text-green-400' :
            change.type === 'removed' ? 'text-red-700 dark:text-red-400' :
            'text-amber-700 dark:text-amber-300';
          
          return (
            <div key={i} className={`${baseClass} ${colorClass}`}>
              <span>•</span>
              <span>
                {change.type === 'added' && `Added: ${change.item.quantity}× ${change.item.name}`}
                {change.type === 'removed' && `Removed: ${change.item.quantity}× ${change.item.name}`}
                {change.type === 'modified' && `Changed: ${change.item.name} ${change.details}`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent text-amber-700 dark:text-amber-100 border-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900"
          onClick={() => onDismiss(toast.id)}
        >
          Dismiss
        </Button>
        <Button
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => onView(toast.id)}
        >
          View Order
        </Button>
      </div>
    </motion.div>
  );
}

interface KDSToastContainerProps {
  toasts: NewOrderToast[];
  modificationToasts?: ModificationToast[];
  onView: (orderId: string) => void;
  onDismiss: (orderId: string) => void;
  onModificationView?: (orderId: string) => void;
  onModificationDismiss?: (orderId: string) => void;
}

export function KDSToastContainer({ 
  toasts, 
  modificationToasts = [],
  onView, 
  onDismiss,
  onModificationView,
  onModificationDismiss
}: KDSToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {/* Modification toasts appear first (higher priority) */}
        {modificationToasts.map((toast) => (
          <div key={`mod-${toast.id}`} className="pointer-events-auto">
            <KDSModificationToast 
              toast={toast} 
              onView={onModificationView || onView}
              onDismiss={onModificationDismiss || onDismiss}
            />
          </div>
        ))}
        {/* New order toasts */}
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <KDSNewOrderToast toast={toast} onView={onView} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
