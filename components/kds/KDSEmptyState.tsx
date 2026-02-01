import { ChefHat } from "lucide-react";

export function KDSEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <ChefHat className="h-12 w-12 mb-3 opacity-50" />
      <p className="text-sm">No orders here</p>
    </div>
  );
}
