"use client";

import { useState } from "react";
import { KDSColumn } from "./KDSColumn";
import { PreparingLanes } from "./PreparingLanes";
import { Button } from "@/components/ui/button";
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
  stationStatuses?: Record<string, OrderStatus>;
}

interface KDSColumnsProps {
  orders: Order[];
  onAction: (orderId: string, newStatus: OrderStatus) => void;
  onRefire?: (orderId: string, itemId: string, reason: string) => void;
  highlightedTicketId?: string | null;
  currentStationId?: string;
  stations?: Station[];
  transitioningTickets?: Map<string, { from: OrderStatus; to: OrderStatus }>;
}

export function KDSColumns({ 
  orders, 
  onAction, 
  onRefire,
  highlightedTicketId,
  currentStationId,
  stations,
  transitioningTickets = new Map()
}: KDSColumnsProps) {
  const [activeTab, setActiveTab] = useState<OrderStatus>("pending");

  // Filter by station-specific status if currentStationId is provided
  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => {
      if (currentStationId && order.stationStatuses) {
        return order.stationStatuses[currentStationId] === status;
      }
      return order.status === status;
    });
  };

  const newOrders = getOrdersByStatus("pending");
  const preparingOrders = getOrdersByStatus("preparing");
  const readyOrders = getOrdersByStatus("ready");

  return (
    <>
      {/* Desktop/Tablet: Three columns with 20-60-20 proportions */}
      <div className="hidden md:flex divide-x divide-border h-full">
        {/* NEW Column - 20% */}
        <div className="w-[20%] flex-shrink-0">
          <KDSColumn
            title="NEW"
            status="pending"
            orders={orders}
            onAction={onAction}
            onRefire={onRefire}
            highlightedTicketId={highlightedTicketId}
            currentStationId={currentStationId}
            stations={stations}
            transitioningTickets={transitioningTickets}
          />
        </div>

        {/* PREPARING Column with Sub-Station Lanes - 60% */}
        <div className="w-[60%] flex-shrink-0 flex flex-col min-h-0">
          <div className="bg-muted px-1.5 py-1 2xl:px-2 2xl:py-1.5 border-b border-border border-b-2 border-b-blue-400 dark:border-b-blue-500 flex-shrink-0">
            <h2 className="font-semibold text-sm 2xl:text-base text-center uppercase tracking-wide">
              PREPARING ({preparingOrders.length})
            </h2>
          </div>
          <div className="flex-1 min-h-0">
            <PreparingLanes
              orders={preparingOrders}
              onAction={onAction}
              highlightedTicketId={highlightedTicketId}
              currentStationId={currentStationId}
              stations={stations}
              allOrders={orders}
              transitioningTickets={transitioningTickets}
            />
          </div>
        </div>

        {/* READY Column - 20% */}
        <div className="w-[20%] flex-shrink-0">
          <KDSColumn
            title="READY"
            status="ready"
            orders={orders}
            onAction={onAction}
            onRefire={onRefire}
            highlightedTicketId={highlightedTicketId}
            currentStationId={currentStationId}
            stations={stations}
            isReady={true}
            transitioningTickets={transitioningTickets}
          />
        </div>
      </div>

      {/* Mobile: Tab switcher + single column */}
      <div className="md:hidden flex flex-col h-full">
        {/* Tab Switcher */}
        <div className="flex gap-2 p-4 border-b border-border flex-shrink-0">
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            onClick={() => setActiveTab("pending")}
            className="flex-1"
          >
            NEW ({newOrders.length})
          </Button>
          <Button
            variant={activeTab === "preparing" ? "default" : "outline"}
            onClick={() => setActiveTab("preparing")}
            className="flex-1"
          >
            PREP ({preparingOrders.length})
          </Button>
          <Button
            variant={activeTab === "ready" ? "default" : "outline"}
            onClick={() => setActiveTab("ready")}
            className="flex-1"
          >
            READY ({readyOrders.length})
          </Button>
        </div>

        {/* Single column of tickets */}
        <div className="flex-1 overflow-y-auto">
          <KDSColumn
            title={activeTab === "pending" ? "NEW" : activeTab === "preparing" ? "PREPARING" : "READY"}
            status={activeTab}
            orders={orders}
            onAction={onAction}
            onRefire={onRefire}
            highlightedTicketId={highlightedTicketId}
            currentStationId={currentStationId}
            stations={stations}
            isMobile={true}
            transitioningTickets={transitioningTickets}
          />
        </div>
      </div>
    </>
  );
}
