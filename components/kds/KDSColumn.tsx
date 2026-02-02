"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { KDSTicket } from "./KDSTicket";
import { KDSEmptyState } from "./KDSEmptyState";
import type { Station } from "./StationSwitcher";

type OrderStatus = "pending" | "preparing" | "ready";

interface OrderItem {
  id: string;
  name: string;
  variant: string | null;
  quantity: number;
  customizations: string[];
  stationId?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: "dine_in" | "pickup";
  tableNumber: string | null;
  customerName: string | null;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  specialInstructions?: string;
  stationStatuses?: Record<string, OrderStatus>;
}

interface KDSColumnProps {
  title: string;
  status: OrderStatus;
  orders: Order[];
  onAction: (orderId: string, newStatus: OrderStatus) => void;
  onRefire?: (orderId: string, itemId: string, reason: string) => void;
  highlightedTicketId?: string | null;
  currentStationId?: string;
  stations?: Station[];
  isMobile?: boolean;
  isReady?: boolean;
  transitioningTickets?: Map<string, { from: OrderStatus; to: OrderStatus }>;
}

function getElapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

function sortByUrgency(orders: Order[]): Order[] {
  return orders.sort((a, b) => {
    const aMinutes = getElapsedMinutes(a.createdAt);
    const bMinutes = getElapsedMinutes(b.createdAt);
    
    const aUrgency = aMinutes >= 10 ? 2 : aMinutes >= 5 ? 1 : 0;
    const bUrgency = bMinutes >= 10 ? 2 : bMinutes >= 5 ? 1 : 0;
    
    // Sort by urgency tier first
    if (aUrgency !== bUrgency) return bUrgency - aUrgency;
    
    // Within same tier, oldest first
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function getUrgentPriority(order: Order, allOrders: Order[]): number | null {
  const elapsed = getElapsedMinutes(order.createdAt);
  if (elapsed < 10) return null; // Not urgent
  
  // Get all urgent orders sorted by oldest first
  const urgentOrders = allOrders
    .filter(o => getElapsedMinutes(o.createdAt) >= 10)
    .sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  
  const index = urgentOrders.findIndex(o => o.id === order.id);
  return index !== -1 ? index + 1 : null;
}

export function KDSColumn({ 
  title, 
  status, 
  orders, 
  onAction, 
  onRefire,
  highlightedTicketId,
  currentStationId,
  stations = [],
  isMobile = false,
  isReady = false,
  transitioningTickets = new Map()
}: KDSColumnProps) {
  // Track tickets that are in "staged" position (at top, before sliding to final position)
  const [stagedTickets, setStagedTickets] = useState<Set<string>>(new Set());
  const stagedTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  // Delay showing empty state so exit animation can run when the last ticket leaves
  const prevOrderCountRef = useRef<number | null>(null);
  const [showEmptyState, setShowEmptyState] = useState(false);
  // Skip entrance animation for NEW column on initial load (avoids double animation from React Strict Mode)
  const hasCompletedInitialRender = useRef(false);
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      hasCompletedInitialRender.current = true;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Filter by station-specific status if currentStationId is provided, otherwise use overall status
  const filteredOrders = orders.filter((order) => {
    if (currentStationId && order.stationStatuses) {
      return order.stationStatuses[currentStationId] === status;
    }
    return order.status === status;
  });

  // Detect newly arrived tickets and stage them at top (for READY column)
  useEffect(() => {
    if (status !== "ready") return; // Only apply staging for READY column

    const currentOrderIds = new Set(filteredOrders.map(o => o.id));
    const newlyArrived: string[] = [];

    // Find orders that just appeared (weren't in previous render)
    currentOrderIds.forEach(id => {
      if (!prevOrderIdsRef.current.has(id)) {
        // Check if this ticket is transitioning into ready
        const transition = transitioningTickets.get(id);
        if (transition && transition.to === "ready") {
          newlyArrived.push(id);
        }
      }
    });

    // Stage newly arrived tickets
    if (newlyArrived.length > 0) {
      setStagedTickets(prev => {
        const updated = new Set(prev);
        newlyArrived.forEach(id => updated.add(id));
        return updated;
      });

      // After highlight period, release to final sorted position
      newlyArrived.forEach(id => {
        // Clear any existing timeout
        const existingTimeout = stagedTimeoutsRef.current.get(id);
        if (existingTimeout) clearTimeout(existingTimeout);

        const timeout = setTimeout(() => {
          setStagedTickets(prev => {
            const updated = new Set(prev);
            updated.delete(id);
            return updated;
          });
          stagedTimeoutsRef.current.delete(id);
        }, 1100); // Release after ~1 second highlight

        stagedTimeoutsRef.current.set(id, timeout);
      });
    }

    prevOrderIdsRef.current = currentOrderIds;
  }, [filteredOrders, transitioningTickets, status]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      stagedTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Delay empty state when last ticket leaves so exit animation runs (NEW → preparing, READY → complete)
  const columnOrders = status === "pending"
    ? sortByUrgency([...filteredOrders])
    : status === "ready"
    ? [...filteredOrders].sort((a, b) => {
        const aIsStaged = stagedTickets.has(a.id);
        const bIsStaged = stagedTickets.has(b.id);
        if (aIsStaged && !bIsStaged) return -1;
        if (!aIsStaged && bIsStaged) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
    : [...filteredOrders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    const count = columnOrders.length;
    if (count === 0) {
      // Only delay empty state when we had items (so exit animation can run)
      if (prevOrderCountRef.current !== null && prevOrderCountRef.current > 0) {
        const t = setTimeout(() => setShowEmptyState(true), 400);
        prevOrderCountRef.current = 0;
        return () => clearTimeout(t);
      }
      setShowEmptyState(true);
    } else {
      setShowEmptyState(false);
    }
    prevOrderCountRef.current = count;
  }, [columnOrders.length]);

  // For READY column, show only first ticket fully, indicate rest
  const visibleOrders = isReady && !isMobile ? columnOrders.slice(0, 1) : columnOrders;
  const hiddenCount = isReady && !isMobile ? columnOrders.length - 1 : 0;

  const headerUnderlineClass = status === "pending"
    ? "border-b-2 border-b-gray-400 dark:border-b-gray-500"
    : status === "preparing"
    ? "border-b-2 border-b-blue-400 dark:border-b-blue-500"
    : status === "ready"
    ? "border-b-2 border-b-green-400 dark:border-b-green-500"
    : "";

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Hide header on mobile since we have tabs */}
      {!isMobile && (
        <div className={`bg-muted px-1.5 py-1 2xl:px-2 2xl:py-1.5 border-b border-border flex-shrink-0 ${headerUnderlineClass}`}>
          <h2 className="font-semibold text-sm 2xl:text-base text-center uppercase tracking-wide">
            {title} ({columnOrders.length})
          </h2>
        </div>
      )}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 2xl:p-5 min-h-0 relative">
        {columnOrders.length === 0 && showEmptyState && (
          <KDSEmptyState />
        )}
        <div className={isMobile ? "flex flex-col gap-4" : isReady ? "flex flex-col gap-6 2xl:gap-8" : "flex flex-col gap-4 2xl:gap-5"}>
          <AnimatePresence mode="popLayout">
            {visibleOrders.map((order) => {
                const priority = getUrgentPriority(order, filteredOrders);
                
                // Check if this station is complete
                const stationStatus = currentStationId && order.stationStatuses 
                  ? order.stationStatuses[currentStationId]
                  : undefined;
                
                const isStationComplete = stationStatus === "ready";
                
                // Find stations that are still pending/preparing
                const waitingStations = currentStationId && order.stationStatuses && stations.length > 0
                  ? stations.filter(s => {
                      const status = order.stationStatuses?.[s.id];
                      return s.id !== currentStationId && status !== "ready";
                    })
                  : [];
                
                // Check if this ticket just transitioned to this column
                const transition = transitioningTickets.get(order.id);
                const justArrived = transition && transition.to === status;
                const isStaged = stagedTickets.has(order.id);
                
                return (
                  <KDSTicket 
                    key={order.id} 
                    order={order} 
                    onAction={onAction}
                    onRefire={onRefire}
                    priority={priority}
                    isHighlighted={order.id === highlightedTicketId}
                    currentStationId={currentStationId}
                    waitingStations={waitingStations}
                    isStationComplete={isStationComplete}
                    columnAccent={status === "pending" ? "new" : status === "ready" ? "ready" : undefined}
                    transitionDirection={justArrived ? "from-left" : undefined}
                    isLanding={justArrived || isStaged}
                    landingType={(justArrived || isStaged) ? (status === "ready" ? "ready" : "preparing") : undefined}
                    skipEntranceAnimation={status === "pending" && !hasCompletedInitialRender.current}
                  />
                );
              })}
          </AnimatePresence>
          {hiddenCount > 0 && (
            <div className="text-center py-4 2xl:py-5 text-base 2xl:text-lg text-muted-foreground bg-muted/30 rounded-lg border border-border">
              +{hiddenCount} more {hiddenCount === 1 ? 'order' : 'orders'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
