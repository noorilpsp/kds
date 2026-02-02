'use client';

import { useState } from "react";
import { AlertTriangle, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StockStatus = 'available' | 'low' | 'out';

export interface ItemStockStatus {
  itemId: string;
  itemName: string;
  status: StockStatus;
  lowCount?: number;
  updatedAt: string;
  updatedBy: string;
}

export interface MenuItem {
  id: string;
  name: string;
}

interface KDS86PanelProps {
  items: MenuItem[];
  stockStatuses: ItemStockStatus[];
  onUpdateStatus: (itemId: string, status: StockStatus, count?: number) => void;
  onClose: () => void;
}

export function KDS86Panel({ items, stockStatuses, onUpdateStatus, onClose }: KDS86PanelProps) {
  const [search, setSearch] = useState('');
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const outItems = stockStatuses.filter(s => s.status === 'out');
  const lowItems = stockStatuses.filter(s => s.status === 'low');

  const getItemStatus = (itemId: string): StockStatus => {
    return stockStatuses.find(s => s.itemId === itemId)?.status || 'available';
  };

  const handleStatusChange = (itemId: string, status: StockStatus) => {
    if (status === 'low') {
      setUpdatingItem(itemId);
    } else {
      onUpdateStatus(itemId, status);
    }
  };

  const handleLowCountSelect = (itemId: string, count: number) => {
    onUpdateStatus(itemId, 'low', count);
    setUpdatingItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">86 / Stock Status</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Current 86'd Items */}
          {(outItems.length > 0 || lowItems.length > 0) && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Current 86&apos;d Items:</h3>
              <div className="space-y-2">
                {outItems.map(item => (
                  <div key={item.itemId} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 dark:text-red-400">🔴</span>
                      <span className="font-medium">{item.itemName}</span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">OUT</span>
                    </div>
                    <Button
                      onClick={() => onUpdateStatus(item.itemId, 'available')}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Restore
                    </Button>
                  </div>
                ))}
                {lowItems.map(item => (
                  <div key={item.itemId} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 dark:text-amber-400">🟡</span>
                      <span className="font-medium">{item.itemName}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400">LOW ({item.lowCount} left)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setUpdatingItem(item.itemId)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Update
                      </Button>
                      <Button
                        onClick={() => onUpdateStatus(item.itemId, 'available')}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick 86 List */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Quick 86:</h3>
            <div className="space-y-2">
              {filteredItems.map(item => {
                const status = getItemStatus(item.id);
                const isUpdating = updatingItem === item.id;

                return (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/50">
                    <span className="font-medium">{item.name}</span>
                    {isUpdating ? (
                      <div className="flex gap-2">
                        <div className="text-sm text-muted-foreground mr-2">How many left?</div>
                        {[2, 5, 10].map(count => (
                          <Button
                            key={count}
                            onClick={() => handleLowCountSelect(item.id, count)}
                            variant="outline"
                            size="sm"
                            className="px-3"
                          >
                            {count}
                          </Button>
                        ))}
                        <Button
                          onClick={() => setUpdatingItem(null)}
                          variant="ghost"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Select value={status} onValueChange={(value) => handleStatusChange(item.id, value as StockStatus)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">✅ Available</SelectItem>
                          <SelectItem value="low">🟡 Low Stock</SelectItem>
                          <SelectItem value="out">🔴 86 (Out)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
