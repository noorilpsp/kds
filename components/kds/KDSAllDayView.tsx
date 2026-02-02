"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  variant: string | null;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: "dine_in" | "pickup";
  tableNumber: string | null;
  customerName: string | null;
  status: string;
  items: OrderItem[];
}

interface AggregatedItem {
  name: string;
  variant: string | null;
  count: number;
  orderIds: string[];
}

interface CategoryGroup {
  name: string;
  icon: string;
  totalCount: number;
  items: AggregatedItem[];
}

interface KDSAllDayViewProps {
  orders: Order[];
}

function groupItemsByCategory(orders: Order[]): CategoryGroup[] {
  // Get all items from active orders only
  const allItems = orders
    .filter(o => o.status !== 'completed')
    .flatMap(o => 
      o.items.map(item => ({ 
        ...item, 
        orderId: o.id,
        orderNumber: o.orderNumber,
        tableNumber: o.tableNumber,
        customerName: o.customerName,
        orderType: o.orderType,
        status: o.status,
      }))
    );

  // Count items
  const itemMap = new Map<string, AggregatedItem>();
  
  allItems.forEach(item => {
    const key = `${item.name}|${item.variant || ''}`;
    const existing = itemMap.get(key);
    
    if (existing) {
      existing.count += item.quantity;
      if (!existing.orderIds.includes(item.orderId)) {
        existing.orderIds.push(item.orderId);
      }
    } else {
      itemMap.set(key, {
        name: item.name,
        variant: item.variant,
        count: item.quantity,
        orderIds: [item.orderId],
      });
    }
  });

  // For now, we'll use simple category detection based on item names
  // In a real app, this would come from menu data
  const categoryMap = new Map<string, AggregatedItem[]>();

  itemMap.forEach((item) => {
    let category = "Other";
    let icon = "🍽️";

    // Simple category detection
    const name = item.name.toLowerCase();
    if (name.includes('pizza') || name.includes('margherita') || name.includes('pepperoni') || name.includes('hawaiian')) {
      category = "Pizzas";
      icon = "🍕";
    } else if (name.includes('salad') || name.includes('caesar') || name.includes('greek')) {
      category = "Salads";
      icon = "🥗";
    } else if (name.includes('pasta') || name.includes('carbonara') || name.includes('bolognese') || name.includes('spaghetti')) {
      category = "Pasta";
      icon = "🍝";
    } else if (name.includes('fries') || name.includes('bread') || name.includes('rings') || name.includes('wings')) {
      category = "Sides";
      icon = "🍟";
    } else if (name.includes('burger')) {
      category = "Burgers";
      icon = "🍔";
    } else if (name.includes('drink') || name.includes('soda') || name.includes('juice')) {
      category = "Drinks";
      icon = "🥤";
    }

    const categoryItems = categoryMap.get(category) || [];
    categoryItems.push(item);
    categoryMap.set(category, categoryItems);
  });

  // Convert to CategoryGroup array and sort items by count
  const categories: CategoryGroup[] = [];
  categoryMap.forEach((items, categoryName) => {
    const totalCount = items.reduce((sum, item) => sum + item.count, 0);
    const icon = items[0] ? getCategoryIcon(categoryName) : "🍽️";
    
    categories.push({
      name: categoryName,
      icon,
      totalCount,
      items: items.sort((a, b) => b.count - a.count),
    });
  });

  return categories.sort((a, b) => b.totalCount - a.totalCount);
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Pizzas: "🍕",
    Salads: "🥗",
    Pasta: "🍝",
    Sides: "🍟",
    Burgers: "🍔",
    Drinks: "🥤",
  };
  return icons[category] || "🍽️";
}

interface ItemOrdersModalProps {
  item: AggregatedItem;
  orders: Order[];
  onClose: () => void;
}

function ItemOrdersModal({ item, orders, onClose }: ItemOrdersModalProps) {
  const relevantOrders = orders.filter(o => item.orderIds.includes(o.id));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-background rounded-lg shadow-xl max-w-md w-full m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {item.name} {item.variant && `(${item.variant})`}
            </h3>
            <p className="text-sm text-muted-foreground">
              Total: {item.count} across {relevantOrders.length} orders
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
          {relevantOrders.map(order => {
            const orderItem = order.items.find(
              i => i.name === item.name && i.variant === item.variant
            );
            const quantity = orderItem?.quantity || 0;
            const displayText = order.orderType === "dine_in" && order.tableNumber
              ? `T-${order.tableNumber}`
              : order.orderType === "pickup" && order.customerName
              ? order.customerName
              : "Pickup";

            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{order.orderNumber}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{displayText}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted uppercase">
                    {order.status}
                  </span>
                </div>
                <span className="font-medium">× {quantity}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function KDSAllDayView({ orders }: KDSAllDayViewProps) {
  const [selectedItem, setSelectedItem] = useState<AggregatedItem | null>(null);
  const categories = groupItemsByCategory(orders);
  const totalOrders = orders.filter(o => o.status !== 'completed').length;

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">All-Day Totals</h2>
          <div className="text-muted-foreground">
            <span className="font-medium">{totalOrders}</span> active orders
          </div>
        </div>

        {categories.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No active orders
          </Card>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <Card key={category.name} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="text-lg font-semibold uppercase tracking-wide">
                      {category.name}
                    </h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {category.totalCount} total
                  </div>
                </div>

                <div className="space-y-3">
                  {category.items.map((item, idx) => {
                    const percentage = (item.count / category.totalCount) * 100;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedItem(item)}
                        className="w-full text-left hover:bg-muted/50 rounded-lg p-3 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {item.name} {item.variant && `(${item.variant})`}
                          </span>
                          <span className="font-bold text-lg">× {item.count}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.05 }}
                              className="h-full bg-primary"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <ItemOrdersModal
          item={selectedItem}
          orders={orders}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
