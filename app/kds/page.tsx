"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { KDSHeader, type Station } from "@/components/kds/KDSHeader";
import { KDSColumns } from "@/components/kds/KDSColumns";
import { KDSToastContainer } from "@/components/kds/KDSNewOrderToast";
import { Button } from "@/components/ui/button";

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
  isPriority?: boolean;
  specialInstructions?: string;
  stationStatuses?: Record<string, OrderStatus>;
  isRemake?: boolean;
  remakeReason?: string;
  originalOrderId?: string;
  isRecalled?: boolean;
  recalledAt?: string;
  completedAt?: string;
}

interface NewOrderToast {
  id: string;
  orderNumber: string;
  orderType: "dine_in" | "pickup";
  tableNumber: string | null;
  customerName: string | null;
  itemCount: number;
  isPriority?: boolean;
}

// Define stations
const STATIONS: Station[] = [
  { id: "kitchen", name: "Kitchen", icon: "🍳", color: "#f97316" },
  { id: "bar", name: "Bar", icon: "🍺", color: "#3b82f6" },
  { id: "dessert", name: "Dessert", icon: "🍰", color: "#ec4899" },
];

// Generate times relative to now for demo purposes
const now = new Date();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();

const initialOrders: Order[] = [
  {
    id: "1",
    orderNumber: "1234",
    orderType: "dine_in",
    tableNumber: "5",
    customerName: null,
    status: "pending",
    createdAt: minutesAgo(12), // Urgent - 12 minutes ago
    specialInstructions: "Extra crispy, birthday celebration",
    stationStatuses: {
      kitchen: "pending",
      bar: "pending",
      dessert: "pending",
    },
    items: [
      {
        id: "1",
        name: "Margherita",
        variant: "Large",
        quantity: 2,
        customizations: ["Extra cheese", "Mushrooms"],
        stationId: "kitchen",
      },
      {
        id: "2",
        name: "Pepperoni",
        variant: "Medium",
        quantity: 1,
        customizations: [],
        stationId: "kitchen",
      },
      {
        id: "2a",
        name: "Coca-Cola",
        variant: null,
        quantity: 2,
        customizations: [],
        stationId: "bar",
      },
      {
        id: "2b",
        name: "Tiramisu",
        variant: null,
        quantity: 1,
        customizations: [],
        stationId: "dessert",
      },
    ],
  },
  {
    id: "2",
    orderNumber: "1235",
    orderType: "pickup",
    tableNumber: null,
    customerName: "John",
    status: "preparing",
    createdAt: minutesAgo(8),
    stationStatuses: {
      kitchen: "preparing",
    },
    items: [
      {
        id: "3",
        name: "Caesar Salad",
        variant: null,
        quantity: 1,
        customizations: [],
        stationId: "kitchen",
      },
    ],
  },
  {
    id: "3",
    orderNumber: "1236",
    orderType: "dine_in",
    tableNumber: "9",
    customerName: null,
    status: "ready",
    createdAt: minutesAgo(5),
    stationStatuses: {
      kitchen: "ready",
    },
    items: [
      {
        id: "4",
        name: "Carbonara",
        variant: "Large",
        quantity: 1,
        customizations: ["Extra parmesan"],
        stationId: "kitchen",
      },
    ],
  },
  {
    id: "4",
    orderNumber: "1237",
    orderType: "dine_in",
    tableNumber: "3",
    customerName: null,
    status: "pending",
    createdAt: minutesAgo(7), // Warning - 7 minutes ago
    stationStatuses: {
      kitchen: "pending",
    },
    items: [
      {
        id: "5",
        name: "Hawaiian",
        variant: "Large",
        quantity: 1,
        customizations: ["Extra pineapple", "Light sauce", "Well done"],
        stationId: "kitchen",
      },
    ],
  },
  {
    id: "5",
    orderNumber: "1238",
    orderType: "pickup",
    tableNumber: null,
    customerName: "Sarah",
    status: "pending",
    createdAt: minutesAgo(3), // Normal - 3 minutes ago
    stationStatuses: {
      kitchen: "pending",
      bar: "pending",
      dessert: "ready",
    },
    items: [
      {
        id: "6",
        name: "Veggie Supreme",
        variant: "Medium",
        quantity: 2,
        customizations: ["No olives", "Extra mushrooms"],
        stationId: "kitchen",
      },
      {
        id: "6b",
        name: "Caesar Salad",
        variant: null,
        quantity: 1,
        customizations: [],
        stationId: "kitchen",
      },
      {
        id: "6c",
        name: "Garlic Bread",
        variant: null,
        quantity: 1,
        customizations: [],
        stationId: "kitchen",
      },
      {
        id: "6d",
        name: "Coca-Cola",
        variant: null,
        quantity: 2,
        customizations: [],
        stationId: "bar",
      },
    ],
  },
  {
    id: "6",
    orderNumber: "1239",
    orderType: "dine_in",
    tableNumber: "7",
    customerName: null,
    status: "preparing",
    createdAt: minutesAgo(6),
    stationStatuses: {
      kitchen: "preparing",
    },
    items: [
      {
        id: "7",
        name: "BBQ Chicken",
        variant: "Large",
        quantity: 1,
        customizations: [],
        stationId: "kitchen",
      },
      {
        id: "8",
        name: "Garlic Bread",
        variant: null,
        quantity: 2,
        customizations: [],
        stationId: "kitchen",
      },
    ],
  },
  {
    id: "7",
    orderNumber: "1240",
    orderType: "pickup",
    tableNumber: null,
    customerName: "Mike",
    status: "pending",
    createdAt: minutesAgo(15), // Urgent - 15 minutes ago
    specialInstructions: "Gluten-free crust, no contact with regular flour",
    stationStatuses: {
      kitchen: "pending",
    },
    items: [
      {
        id: "9",
        name: "Four Cheese",
        variant: "Small",
        quantity: 1,
        customizations: ["Extra mozzarella"],
        stationId: "kitchen",
      },
    ],
  },
  {
    id: "8",
    orderNumber: "1241",
    orderType: "dine_in",
    tableNumber: "12",
    customerName: null,
    status: "pending",
    createdAt: minutesAgo(2), // Normal - 2 minutes ago
    stationStatuses: {
      kitchen: "pending",
    },
    items: [
      {
        id: "10",
        name: "Meat Lovers",
        variant: "Large",
        quantity: 1,
        customizations: ["Extra bacon"],
        stationId: "kitchen",
      },
    ],
  },
  {
    id: "9",
    orderNumber: "1242",
    orderType: "dine_in",
    tableNumber: "8",
    customerName: null,
    status: "preparing",
    createdAt: minutesAgo(4),
    stationStatuses: {
      kitchen: "preparing",
    },
    items: [
      {
        id: "11",
        name: "Mediterranean",
        variant: "Medium",
        quantity: 1,
        customizations: ["No feta"],
        stationId: "kitchen",
      },
    ],
  },
  {
    id: "10",
    orderNumber: "1243",
    orderType: "dine_in",
    tableNumber: "15",
    customerName: null,
    status: "pending",
    createdAt: minutesAgo(6), // Warning - 6 minutes ago
    stationStatuses: {
      kitchen: "pending",
      bar: "pending",
      dessert: "pending",
    },
    items: [
      {
        id: "12",
        name: "Pepperoni",
        variant: "Large",
        quantity: 2,
        customizations: [],
        stationId: "kitchen",
      },
      {
        id: "13",
        name: "Chicken Wings",
        variant: "Spicy",
        quantity: 1,
        customizations: [],
        stationId: "kitchen",
      },
      {
        id: "13a",
        name: "Beer",
        variant: "Draft",
        quantity: 2,
        customizations: [],
        stationId: "bar",
      },
      {
        id: "13b",
        name: "Cheesecake",
        variant: null,
        quantity: 1,
        customizations: [],
        stationId: "dessert",
      },
    ],
  },
  {
    id: "11",
    orderNumber: "1244",
    orderType: "pickup",
    tableNumber: null,
    customerName: "Lisa",
    status: "pending",
    createdAt: minutesAgo(1), // Normal - 1 minute ago
    stationStatuses: {
      bar: "pending",
    },
    items: [
      {
        id: "14",
        name: "Lemonade",
        variant: "Large",
        quantity: 2,
        customizations: ["No ice"],
        stationId: "bar",
      },
    ],
  },
  {
    id: "12",
    orderNumber: "1245",
    orderType: "dine_in",
    tableNumber: "2",
    customerName: null,
    status: "ready",
    createdAt: minutesAgo(3),
    stationStatuses: {
      dessert: "ready",
    },
    items: [
      {
        id: "15",
        name: "Chocolate Cake",
        variant: "Slice",
        quantity: 2,
        customizations: ["Extra whipped cream"],
        stationId: "dessert",
      },
    ],
  },
  {
    id: "13",
    orderNumber: "1246",
    orderType: "dine_in",
    tableNumber: "11",
    customerName: null,
    status: "preparing",
    createdAt: minutesAgo(5),
    stationStatuses: {
      bar: "preparing",
    },
    items: [
      {
        id: "16",
        name: "Mojito",
        variant: null,
        quantity: 2,
        customizations: [],
        stationId: "bar",
      },
    ],
  },
  {
    id: "14",
    orderNumber: "1247",
    orderType: "dine_in",
    tableNumber: "6",
    customerName: null,
    status: "pending",
    createdAt: minutesAgo(11), // Urgent - 11 minutes ago
    stationStatuses: {
      kitchen: "pending",
    },
    items: [
      {
        id: "17",
        name: "Seafood Deluxe",
        variant: "Large",
        quantity: 1,
        customizations: ["No anchovies"],
        stationId: "kitchen",
      },
    ],
  },
];

export default function KDSPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [toasts, setToasts] = useState<NewOrderToast[]>([]);
  const [highlightedTicketId, setHighlightedTicketId] = useState<string | null>(null);
  const [activeStationId, setActiveStationId] = useState<string>(STATIONS[0].id);
  // Track tickets that just transitioned for animation purposes
  const [transitioningTickets, setTransitioningTickets] = useState<Map<string, { from: OrderStatus; to: OrderStatus }>>(new Map());
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [recallConfirmation, setRecallConfirmation] = useState<{ orderId: string; show: boolean }>({ orderId: '', show: false });
  const toastTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const nextOrderNumber = useRef(1248);

  const addToast = useCallback((order: Order) => {
    const toast: NewOrderToast = {
      id: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      itemCount: order.items.length,
      isPriority: order.isPriority,
    };

    setToasts((prev) => {
      const updated = [toast, ...prev];
      return updated.slice(0, 3); // Max 3 toasts
    });

    // Auto-dismiss after 5 seconds
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      toastTimeoutRefs.current.delete(toast.id);
    }, 5000);

    toastTimeoutRefs.current.set(toast.id, timeout);
  }, []);

  const handleToastView = useCallback((orderId: string) => {
    // Dismiss toast
    setToasts((prev) => prev.filter((t) => t.id !== orderId));
    
    // Clear timeout
    const timeout = toastTimeoutRefs.current.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeoutRefs.current.delete(orderId);
    }

    // Scroll to ticket
    const ticketElement = document.getElementById(`ticket-${orderId}`);
    ticketElement?.scrollIntoView({ behavior: "smooth", block: "center" });

    // Highlight briefly
    setHighlightedTicketId(orderId);
    setTimeout(() => setHighlightedTicketId(null), 1000);
  }, []);

  const handleToastDismiss = useCallback((orderId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== orderId));
    
    // Clear timeout
    const timeout = toastTimeoutRefs.current.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeoutRefs.current.delete(orderId);
    }
  }, []);

  const handleRefire = useCallback((orderId: string, itemId: string, reason: string) => {
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder) return;

    const refireItem = originalOrder.items.find(i => i.id === itemId);
    if (!refireItem) return;

    // Create a new remake ticket
    const remakeOrderId = `${orderId}-R-${Date.now()}`;
    const remakeOrder: Order = {
      id: remakeOrderId,
      orderNumber: `${originalOrder.orderNumber}-R`,
      orderType: originalOrder.orderType,
      tableNumber: originalOrder.tableNumber,
      customerName: originalOrder.customerName,
      status: "pending",
      createdAt: new Date().toISOString(),
      items: [refireItem],
      isRemake: true,
      remakeReason: reason,
      originalOrderId: orderId,
      specialInstructions: originalOrder.specialInstructions,
      stationStatuses: refireItem.stationId ? { [refireItem.stationId]: "pending" } : undefined,
    };

    // Add remake ticket to orders
    setOrders((prev) => [remakeOrder, ...prev]);
    addToast({
      id: remakeOrderId,
      orderNumber: remakeOrder.orderNumber,
      orderType: remakeOrder.orderType,
      tableNumber: remakeOrder.tableNumber,
      customerName: remakeOrder.customerName,
      itemCount: 1,
    });
  }, [orders, addToast]);

  const handleRecall = useCallback((orderId: string) => {
    const completedOrder = completedOrders.find(o => o.id === orderId);
    if (!completedOrder) return;

    // Move from completed back to ready
    const recalledOrder: Order = {
      ...completedOrder,
      isRecalled: true,
      recalledAt: new Date().toISOString(),
      status: "ready",
    };

    // Remove from completed and add back to active orders
    setCompletedOrders((prev) => prev.filter(o => o.id !== orderId));
    setOrders((prev) => [recalledOrder, ...prev]);
    
    addToast({
      id: orderId,
      orderNumber: completedOrder.orderNumber,
      orderType: completedOrder.orderType,
      tableNumber: completedOrder.tableNumber,
      customerName: completedOrder.customerName,
      itemCount: completedOrder.items.length,
    });
  }, [completedOrders, addToast]);

  const simulateNewOrder = useCallback(() => {
    const orderTypes: Array<"dine_in" | "pickup"> = ["dine_in", "pickup"];
    const orderType = orderTypes[Math.floor(Math.random() * orderTypes.length)];
    const isPriority = Math.random() > 0.7; // 30% chance of priority
    
    // Random menu items with their stations
    const menuItems = [
      { name: "Margherita", variant: "Large", stationId: "kitchen" },
      { name: "Pepperoni", variant: "Medium", stationId: "kitchen" },
      { name: "Hawaiian", variant: "Large", stationId: "kitchen" },
      { name: "BBQ Chicken", variant: "Large", stationId: "kitchen" },
      { name: "Caesar Salad", variant: null, stationId: "kitchen" },
      { name: "Garlic Bread", variant: null, stationId: "kitchen" },
      { name: "Coca-Cola", variant: null, stationId: "bar" },
      { name: "Lemonade", variant: "Large", stationId: "bar" },
      { name: "Mojito", variant: null, stationId: "bar" },
      { name: "Beer", variant: "Draft", stationId: "bar" },
      { name: "Tiramisu", variant: null, stationId: "dessert" },
      { name: "Chocolate Cake", variant: "Slice", stationId: "dessert" },
      { name: "Cheesecake", variant: null, stationId: "dessert" },
    ];

    // Generate 1-4 random items
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const selectedItems: OrderItem[] = [];
    const stationsInOrder = new Set<string>();
    
    for (let i = 0; i < itemCount; i++) {
      const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
      stationsInOrder.add(menuItem.stationId);
      selectedItems.push({
        id: `item-${Date.now()}-${i}`,
        name: menuItem.name,
        variant: menuItem.variant,
        quantity: Math.floor(Math.random() * 2) + 1,
        customizations: Math.random() > 0.7 ? ["Extra cheese"] : [],
        stationId: menuItem.stationId,
      });
    }

    // Create station statuses for all stations that have items in this order
    const stationStatuses: Record<string, OrderStatus> = {};
    stationsInOrder.forEach(stationId => {
      stationStatuses[stationId] = "pending";
    });
    
    const newOrder: Order = {
      id: `new-${Date.now()}`,
      orderNumber: String(nextOrderNumber.current++),
      orderType,
      tableNumber: orderType === "dine_in" ? String(Math.floor(Math.random() * 20) + 1) : null,
      customerName: orderType === "pickup" ? ["Alex", "Sam", "Jordan", "Taylor"][Math.floor(Math.random() * 4)] : null,
      status: "pending",
      createdAt: new Date().toISOString(),
      isPriority,
      stationStatuses,
      items: selectedItems,
    };

    setOrders((prev) => [...prev, newOrder]);
    addToast(newOrder);
  }, [addToast]);

  const handleAction = (orderId: string, newStatus: OrderStatus) => {
    // Find the current order to track the transition
    const currentOrder = orders.find(o => o.id === orderId);
    const previousStatus = currentOrder?.status;

    setOrders((prevOrders) => {
      return prevOrders.map((order) => {
        if (order.id !== orderId) return order;
        
        // Update this station's status
        const updatedStationStatuses = order.stationStatuses ? {
          ...order.stationStatuses,
          [activeStationId]: newStatus,
        } : undefined;

        // Check if ALL stations are ready
        const allStationsReady = updatedStationStatuses 
          ? Object.values(updatedStationStatuses).every(status => status === "ready")
          : false;

        // If bumping from ready column and all stations ready, mark as completed and move to completed orders
        if (newStatus === "ready" && order.status === "ready" && allStationsReady) {
          // Only move to completed if this is not a recalled order (unless bumping a recalled one again)
          if (!order.isRecalled) {
            setCompletedOrders((prev) => [...prev, { ...order, completedAt: new Date().toISOString() }]);
          }
          return null as any;
        }

        // Determine overall order status
        let overallStatus: OrderStatus = order.status;
        if (allStationsReady) {
          overallStatus = "ready";
        } else if (updatedStationStatuses && Object.values(updatedStationStatuses).some(s => s === "preparing")) {
          overallStatus = "preparing";
        } else if (updatedStationStatuses && Object.values(updatedStationStatuses).every(s => s === "pending")) {
          overallStatus = "pending";
        }

        return {
          ...order,
          status: overallStatus,
          stationStatuses: updatedStationStatuses,
        };
      }).filter(Boolean) as Order[];
    });

    // Track the transition for animation based on station-specific status change
    const previousStationStatus = currentOrder?.stationStatuses?.[activeStationId];
    if (previousStationStatus && previousStationStatus !== newStatus) {
      setTransitioningTickets(prev => {
        const updated = new Map(prev);
        updated.set(orderId, { from: previousStationStatus, to: newStatus });
        return updated;
      });

      // Clear the transition state after animation completes (1200ms)
      setTimeout(() => {
        setTransitioningTickets(prev => {
          const updated = new Map(prev);
          updated.delete(orderId);
          return updated;
        });
      }, 1200);
    }
  };

  // Filter orders to only show items for current station
  const filteredOrders = useMemo(() => {
    return orders.map(order => ({
      ...order,
      items: order.items.filter(item => item.stationId === activeStationId),
    })).filter(order => order.items.length > 0);
  }, [orders, activeStationId]);

  // Calculate order counts per station
  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STATIONS.forEach(station => {
      counts[station.id] = orders.filter(order => 
        order.items.some(item => item.stationId === station.id)
      ).length;
    });
    return counts;
  }, [orders]);

  const activeCount = filteredOrders.length;

  const activeStation = STATIONS.find(s => s.id === activeStationId) || STATIONS[0];

  // Get recently completed orders for recall dropdown
  const recentlyCompletedForRecall = completedOrders.slice(0, 10).map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    tableNumber: order.tableNumber,
    customerName: order.customerName,
    completedAt: order.completedAt || new Date().toISOString(),
    itemCount: order.items.length,
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
    })),
  }));

  return (
    <div className="h-screen flex flex-col">
      <KDSHeader 
        stationName={activeStation.name.toUpperCase()} 
        activeCount={activeCount}
        stations={STATIONS}
        activeStationId={activeStationId}
        onStationChange={setActiveStationId}
        orderCounts={orderCounts}
        onRecall={handleRecall}
        recentlyCompleted={recentlyCompletedForRecall}
      />
      <div className="flex-1 overflow-hidden">
        <KDSColumns 
          orders={filteredOrders} 
          onAction={handleAction}
          onRefire={handleRefire}
          highlightedTicketId={highlightedTicketId}
          currentStationId={activeStationId}
          stations={STATIONS}
          transitioningTickets={transitioningTickets}
        />
      </div>
      
      <KDSToastContainer 
        toasts={toasts}
        onView={handleToastView}
        onDismiss={handleToastDismiss}
      />

      {/* Demo button to simulate new orders */}
      <div className="fixed bottom-4 right-4">
        <Button 
          onClick={simulateNewOrder}
          size="lg"
          className="shadow-lg"
        >
          Simulate New Order
        </Button>
      </div>
    </div>
  );
}
