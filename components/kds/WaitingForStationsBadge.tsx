'use client';

import { Card } from "@/components/ui/card";
import type { Station } from "./StationSwitcher";

interface WaitingForStationsBadgeProps {
  waitingStations: Station[];
}

export function WaitingForStationsBadge({ waitingStations }: WaitingForStationsBadgeProps) {
  if (waitingStations.length === 0) return null;

  return (
    <div className="px-2.5 py-2 2xl:px-3 2xl:py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs 2xl:text-sm font-medium text-blue-400">
          Waiting:
        </span>
        <div className="flex gap-1.5 2xl:gap-2 flex-wrap">
          {waitingStations.map((station) => (
            <div
              key={station.id}
              className="flex items-center gap-1 text-xs 2xl:text-sm px-1.5 py-0.5 2xl:px-2 2xl:py-1 rounded"
              style={{
                backgroundColor: `${station.color}15`,
                color: station.color,
              }}
            >
              <span className="text-[11px] 2xl:text-xs">{station.icon}</span>
              <span className="font-medium">{station.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
