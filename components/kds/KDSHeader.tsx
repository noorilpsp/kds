import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Station {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface KDSHeaderProps {
  stationName: string;
  activeCount: number;
  stations: Station[];
  activeStationId: string;
  onStationChange: (stationId: string) => void;
  orderCounts: Record<string, number>;
}

export function KDSHeader({ 
  stationName, 
  activeCount,
  stations,
  activeStationId,
  onStationChange,
  orderCounts,
}: KDSHeaderProps) {
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

      {/* Active count on the right */}
      <div className="text-muted-foreground">
        <span className="font-medium">{activeCount}</span> active
      </div>
    </div>
  );
}
