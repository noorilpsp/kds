"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Lightbulb } from "lucide-react";

export interface BatchSuggestion {
  itemName: string;
  variant: string | null;
  totalQuantity: number;
  orderCount: number;
  orderIds: string[];
  orderNumbers: string[];
}

interface KDSBatchingHintsProps {
  batches: BatchSuggestion[];
  onDismiss: (index: number) => void;
  onHighlight: (batch: BatchSuggestion) => void;
  orders: Array<{
    id: string;
    orderNumber: string;
    tableNumber: string | null;
    customerName: string | null;
    orderType: "dine_in" | "pickup";
  }>;
}

export function KDSBatchingHints({
  batches,
  onDismiss,
  onHighlight,
  orders,
}: KDSBatchingHintsProps) {
  if (batches.length === 0) return null;

  return (
    <div className="px-6 pt-4">
      <AnimatePresence mode="popLayout">
        {batches.length === 1 ? (
          // Single batch - full width
          <motion.div
            key={`batch-0`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    BATCH SUGGESTION
                  </div>
                  <div className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                    <span className="font-medium">
                      {batches[0].itemName}{" "}
                      {batches[0].variant && `(${batches[0].variant})`}
                    </span>
                    <span className="mx-1">×</span>
                    <span className="font-bold">{batches[0].totalQuantity}</span>
                    <span className="text-amber-700 dark:text-amber-300 ml-1">
                      across {batches[0].orderCount} orders
                    </span>
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    Orders:{" "}
                    {batches[0].orderIds.slice(0, 5).map((orderId, idx) => {
                      const order = orders.find(o => o.id === orderId);
                      if (!order) return null;
                      
                      const displayText = order.orderType === "dine_in" && order.tableNumber
                        ? `#${order.orderNumber} (T-${order.tableNumber})`
                        : order.orderType === "pickup" && order.customerName
                        ? `#${order.orderNumber} (${order.customerName})`
                        : `#${order.orderNumber}`;
                      
                      return (
                        <span key={orderId}>
                          {displayText}
                          {idx < Math.min(batches[0].orderIds.length, 5) - 1 && ", "}
                        </span>
                      );
                    })}
                    {batches[0].orderIds.length > 5 && ` +${batches[0].orderIds.length - 5} more`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(0)}
                  className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50 h-8"
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  onClick={() => onHighlight(batches[0])}
                  className="bg-amber-600 hover:bg-amber-700 text-white h-8"
                >
                  Highlight Orders
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          // Multiple batches - grid layout
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-900 dark:text-amber-100">
                  BATCH SUGGESTIONS ({batches.length})
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {batches.map((batch, idx) => (
                <motion.div
                  key={`batch-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-amber-900 dark:text-amber-100 text-sm">
                        {batch.itemName}{" "}
                        {batch.variant && (
                          <span className="text-amber-700 dark:text-amber-300">
                            ({batch.variant})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        {batch.totalQuantity} items · {batch.orderCount} orders
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(idx)}
                      className="h-6 w-6 p-0 text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onHighlight(batch)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs"
                  >
                    Highlight
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
