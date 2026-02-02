"use client";

import { ChefHat, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Station {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type ViewMode = "tickets" | "all-day";

type OrderStatus = "pending" | "preparing" | "ready";

interface OrderItem {
  id: string;
  name: string;
  variant: string | null;
  quantity: number;
  customizations: string[];
  stationId?: string;
}

interface CompletedOrder {
  id: string;
  orderNumber: string;
  orderType: "dine_in" | "pickup";
  tableNumber: string | null;
  customerName: string | null;
  bumpedAt: string;
  items: OrderItem[];
}

interface KDSHeaderProps {
  stationName: string;
  activeCount: number;
  stations: Station[];
  activeStationId: string;
  onStationChange: (stationId: string) => void;
  orderCounts: Record<string, number>;
  completedOrders?: CompletedOrder[];
  onRecall?: (orderId: string) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function KDSHeader({ 
  stationName, 
  activeCount,
  stations,
  activeStationId,
  onStationChange,
  orderCounts,
  completedOrders = [],
  onRecall,
  viewMode = "tickets",
  onViewModeChange,
}: KDSHeaderProps) {
  const getTimeAgo = (bumpedAt: string) => {
    const elapsed = Math.floor((Date.now() - new Date(bumpedAt).getTime()) / 60000);
    return elapsed < 1 ? "Just now" : `${elapsed}m ago`;
  };

  return (
    <div className="relative flex items-center justify-between border-b border-border bg-background px-6 py-4">
      {/* Station switcher on the left */}
      <div className="flex items-center gap-2">
        {stations.map((station) => {
          const isActive = station.id === activeStationId;
          const count = orderCounts[station.id] || 0;
          
          return (
            <Button
              key={station.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onStationChange(station.id)}
              className={`flex items-center gap-2 font-medium ${
                isActive ? "" : "hover:bg-muted"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: station.color,
                      color: "white",
                    }
                  : undefined
              }
            >
              <span className="text-base">{station.icon}</span>
              <span className="whitespace-nowrap">
                {station.name} ({count})
              </span>
            </Button>
          );
        })}
      </div>

      {/* Kitchen logo and view toggle centered */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <ChefHat className="h-6 w-6" />
          <h1 className="text-xl font-semibold uppercase tracking-wider">
            {stationName}
          </h1>
        </div>
        
        {onViewModeChange && (
          <div className="flex items-center rounded-md border border-border bg-muted/50 p-1">
            <Button
              variant={viewMode === "tickets" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("tickets")}
              className={`h-7 px-3 text-xs font-medium ${
                viewMode === "tickets" 
                  ? "bg-background shadow-sm" 
                  : "bg-transparent hover:bg-background/50"
              }`}
            >
              Tickets
            </Button>
            <Button
              variant={viewMode === "all-day" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("all-day")}
              className={`h-7 px-3 text-xs font-medium ${
                viewMode === "all-day" 
                  ? "bg-background shadow-sm" 
                  : "bg-transparent hover:bg-background/50"
              }`}
            >
              All-Day
            </Button>
          </div>
        )}
      </div>

      {/* Active count and Recall button on the right */}
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground">
          <span className="font-medium">{activeCount}</span> active
        </div>
        
        {onRecall && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Undo2 className="w-4 h-4" />
                Recall
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[400px] p-0">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold">Recall Order</h3>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="p-2 space-y-2">
                  {completedOrders.length === 0 ? (
                    <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No recently completed orders
                    </div>
                  ) : (
                    completedOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="space-y-0.5">
                            <div className="font-semibold">
                              #{order.orderNumber}
                              {order.orderType === "dine_in" && order.tableNumber && (
                                <span className="text-muted-foreground font-normal"> · Table {order.tableNumber}</span>
                              )}
                              {order.orderType === "pickup" && order.customerName && (
                                <span className="text-muted-foreground font-normal"> · {order.customerName}</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Bumped {getTimeAgo(order.bumpedAt)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => onRecall(order.id)}
                          >
                            Recall
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.items.map((item, idx) => (
                            <span key={item.id}>
                              {item.quantity}x {item.name}
                              {idx < order.items.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="px-4 py-2 border-t border-border bg-muted/30 text-xs text-center text-muted-foreground">
                Showing last {Math.min(completedOrders.length, 10)} completed orders
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
