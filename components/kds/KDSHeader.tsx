'use client';

import { ChefHat, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useState } from "react";

export interface Station {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CompletedOrder {
  id: string;
  orderNumber: string;
  tableNumber: string | null;
  customerName: string | null;
  completedAt: string;
  itemCount: number;
  items: Array<{ name: string; quantity: number }>;
}

interface KDSHeaderProps {
  stationName: string;
  activeCount: number;
  stations: Station[];
  activeStationId: string;
  onStationChange: (stationId: string) => void;
  orderCounts: Record<string, number>;
  onRecall?: (orderId: string) => void;
  recentlyCompleted?: CompletedOrder[];
}

export function KDSHeader({ 
  stationName, 
  activeCount,
  stations,
  activeStationId,
  onStationChange,
  orderCounts,
  onRecall,
  recentlyCompleted = [],
}: KDSHeaderProps) {
  const [recallOpen, setRecallOpen] = useState(false);

  const getTimeSince = (date: string): string => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1m ago';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
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

      {/* Kitchen logo centered */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <ChefHat className="h-6 w-6" />
        <h1 className="text-xl font-semibold uppercase tracking-wider">
          {stationName}
        </h1>
      </div>

      {/* Recall and Active count on the right */}
      <div className="flex items-center gap-4">
        <Popover open={recallOpen} onOpenChange={setRecallOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-transparent"
            >
              <RotateCcw className="w-4 h-4" />
              Recall
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-4">
              <h3 className="font-semibold text-base">Recall Order</h3>
              
              {recentlyCompleted.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No completed orders to recall
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentlyCompleted.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">
                            #{order.orderNumber}
                            {order.tableNumber && ` · T-${order.tableNumber}`}
                            {order.customerName && ` · ${order.customerName}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getTimeSince(order.completedAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        {order.items.map((item, idx) => (
                          <div key={idx}>
                            {item.quantity}× {item.name}
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs bg-transparent"
                        onClick={() => {
                          onRecall?.(order.id);
                          setRecallOpen(false);
                        }}
                      >
                        Recall
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {recentlyCompleted.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Showing last {recentlyCompleted.length} completed orders
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="text-muted-foreground">
          <span className="font-medium">{activeCount}</span> active
        </div>
      </div>
    </div>
  );
}
