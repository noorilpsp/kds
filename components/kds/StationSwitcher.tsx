'use client';

import { Button } from "@/components/ui/button";

export interface Station {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface StationSwitcherProps {
  stations: Station[];
  activeStationId: string;
  onStationChange: (stationId: string) => void;
  orderCounts: Record<string, number>;
}

export function StationSwitcher({
  stations,
  activeStationId,
  onStationChange,
  orderCounts,
}: StationSwitcherProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2 overflow-x-auto">
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
  );
}
