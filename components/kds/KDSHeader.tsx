import { ChefHat } from "lucide-react";

interface KDSHeaderProps {
  stationName: string;
  activeCount: number;
}

export function KDSHeader({ stationName, activeCount }: KDSHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
      <div className="flex items-center gap-2">
        <ChefHat className="h-6 w-6" />
        <h1 className="text-xl font-semibold uppercase tracking-wider">
          {stationName}
        </h1>
      </div>
      <div className="text-muted-foreground">
        <span className="font-medium">{activeCount}</span> active
      </div>
    </div>
  );
}
