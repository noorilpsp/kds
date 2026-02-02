"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { KDSHeader, type Station, ViewMode } from "@/components/kds/KDSHeader";
import { KDSColumns } from "@/components/kds/KDSColumns";
import { KDSToastContainer, type OrderChange, type ModificationToast } from "@/components/kds/KDSNewOrderToast";
import { KDSAllDayView } from "@/components/kds/KDSAllDayView";
import { KDSBatchingHints, type BatchSuggestion } from "@/components/kds/KDSBatchingHints";
import { KDS86Panel, type ItemStockStatus, type MenuItem, type StockStatus } from "@/components/kds/KDS86Panel";
import { KDS86ToastContainer, type Stock86Toast } from "@/components/kds/KDS86Toast";
import { Button } from "@/components/ui/button";

type OrderStatus = "pending" | "preparing" | "ready";

interface OrderItem {
  id: string;
  name: string;
  variant: string | null;
  quantity: number;
  customizations: string[];
  stationId?: string;
  isNew?: boolean;
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
  isModified?: boolean;
  modifiedAt?: string;
  isSnoozed?: boolean;
  snoozedAt?: string;
  snoozeUntil?: string;
  wasSnoozed?: boolean;
}

interface CompletedOrder {
  id: string;
  orderNumber: string;
  orderType: "dine_in" | "pickup";
  tableNumber: string | null;
  customerName: string | null;
  bumpedAt: string;
  items: OrderItem[];
  createdAt: string;
  originalOrder: Order;
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
    modifiedAt: minutesAgo(1), // Modified 1 minute ago - highlights will show
    isModified: true,
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
        isNew: true, // This was added in the modification
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
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [toasts, setToasts] = useState<NewOrderToast[]>([]);
  const [modificationToasts, setModificationToasts] = useState<ModificationToast[]>([]);
  const [highlightedTicketId, setHighlightedTicketId] = useState<string | null>(null);
  const [batchHighlightedIds, setBatchHighlightedIds] = useState<string[]>([]);
  const [activeStationId, setActiveStationId] = useState<string>(STATIONS[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>("tickets");
  const [dismissedBatches, setDismissedBatches] = useState<Set<string>>(new Set());
  const [show86Panel, setShow86Panel] = useState(false);
  const [stockStatuses, setStockStatuses] = useState<ItemStockStatus[]>([]);
  const [stock86Toasts, setStock86Toasts] = useState<Stock86Toast[]>([]);
  // Track tickets that just transitioned for animation purposes
  const [transitioningTickets, setTransitioningTickets] = useState<Map<string, { from: OrderStatus; to: OrderStatus }>>(new Map());
  const toastTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const modificationToastTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const stock86ToastTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const nextOrderNumber = useRef(1248);
  const snoozeIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const addModificationToast = useCallback((toast: ModificationToast) => {
    setModificationToasts((prev) => {
      const updated = [toast, ...prev];
      return updated.slice(0, 3); // Max 3 toasts
    });

    // Don't auto-dismiss - user must dismiss or view
    const timeout = setTimeout(() => {
      setModificationToasts((prev) => prev.filter((t) => t.id !== toast.id));
      modificationToastTimeoutRefs.current.delete(toast.id);
    }, 60000); // 60 seconds max display

    modificationToastTimeoutRefs.current.set(toast.id, timeout);
  }, []);

  const handleModificationToastView = useCallback((orderId: string) => {
    // Dismiss toast
    setModificationToasts((prev) => prev.filter((t) => t.id !== orderId));
    
    // Clear timeout
    const timeout = modificationToastTimeoutRefs.current.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      modificationToastTimeoutRefs.current.delete(orderId);
    }

    // Scroll to ticket
    const ticketElement = document.getElementById(`ticket-${orderId}`);
    ticketElement?.scrollIntoView({ behavior: "smooth", block: "center" });

    // Highlight briefly
    setHighlightedTicketId(orderId);
    setTimeout(() => setHighlightedTicketId(null), 2000);
  }, []);

  const handleModificationToastDismiss = useCallback((orderId: string) => {
    setModificationToasts((prev) => prev.filter((t) => t.id !== orderId));
    
    // Clear timeout
    const timeout = modificationToastTimeoutRefs.current.get(orderId);
    if (timeout) {
      clearTimeout(timeout);
      modificationToastTimeoutRefs.current.delete(orderId);
    }
  }, []);

  const batchSuggestions: BatchSuggestion[] = []; // Initialize batchSuggestions here

  const handleBatchDismiss = useCallback((index: number) => {
    const batch = batchSuggestions[index];
    if (batch) {
      const key = `${batch.itemName}|${batch.variant || ''}`;
      setDismissedBatches((prev) => new Set(prev).add(key));
    }
  }, [batchSuggestions]);

  const handleBatchHighlight = useCallback((batch: BatchSuggestion) => {
    // Highlight relevant tickets
    setBatchHighlightedIds(batch.orderIds);

    // Scroll to first ticket
    const firstTicket = document.getElementById(`ticket-${batch.orderIds[0]}`);
    firstTicket?.scrollIntoView({ behavior: "smooth", block: "center" });

    // Clear highlight after 30 seconds
    setTimeout(() => {
      setBatchHighlightedIds([]);
    }, 30000);
  }, []);

  const handleRefire = useCallback((item: OrderItem, reason?: string) => {
    // Find the original order
    const originalOrder = orders.find(order => 
      order.items.some(i => i.id === item.id)
    );
    
    if (!originalOrder) return;

    // Create remake order with "-R" suffix
    const remakeOrder: Order = {
      id: `remake-${Date.now()}`,
      orderNumber: `${originalOrder.orderNumber}-R`,
      orderType: originalOrder.orderType,
      tableNumber: originalOrder.tableNumber,
      customerName: originalOrder.customerName,
      status: "pending",
      createdAt: new Date().toISOString(),
      items: [{ ...item, id: `remake-item-${Date.now()}` }], // Single item being remade
      isRemake: true,
      remakeReason: reason,
      originalOrderId: originalOrder.id,
      stationStatuses: item.stationId ? { [item.stationId]: "pending" } : undefined,
    };

    // Add remake order to the top (it will appear at top of NEW column)
    setOrders((prev) => [remakeOrder, ...prev]);
    addToast(remakeOrder);
  }, [orders, addToast]);

  const handleRecall = useCallback((completedOrderId: string) => {
    const completedOrder = completedOrders.find(co => co.id === completedOrderId);
    
    if (!completedOrder) return;

    // Restore the original order as a "recalled" ticket in READY column
    const recalledOrder: Order = {
      ...completedOrder.originalOrder,
      id: `recalled-${Date.now()}`, // New ID for tracking
      status: "ready",
      isRecalled: true,
      recalledAt: new Date().toISOString(),
      // Set all station statuses to ready since it was completed
      stationStatuses: completedOrder.originalOrder.stationStatuses 
        ? Object.keys(completedOrder.originalOrder.stationStatuses).reduce((acc, key) => {
            acc[key] = "ready";
            return acc;
          }, {} as Record<string, OrderStatus>)
        : undefined,
    };

    // Add to orders
    setOrders((prev) => [...prev, recalledOrder]);

    // Remove from completed orders
    setCompletedOrders((prev) => prev.filter(co => co.id !== completedOrderId));

    // Scroll to and highlight the recalled ticket
    setTimeout(() => {
      const ticketElement = document.getElementById(`ticket-${recalledOrder.id}`);
      ticketElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedTicketId(recalledOrder.id);
      setTimeout(() => setHighlightedTicketId(null), 2000);
    }, 100);
  }, [completedOrders]);

  // Snooze handlers
  const canSnooze = useCallback((order: Order): boolean => {
    const now = new Date();
    const createdAt = new Date(order.createdAt);
    const waitMinutes = (now.getTime() - createdAt.getTime()) / 60000;
    
    // Cannot snooze urgent orders (10+ min wait)
    if (waitMinutes >= 10) return false;
    
    // Cannot snooze if already snoozed before
    if (order.wasSnoozed) return false;
    
    // Cannot snooze if currently snoozed
    if (order.isSnoozed) return false;
    
    return true;
  }, []);

  const handleSnooze = useCallback((orderId: string, durationSeconds: number) => {
    const now = new Date();
    const snoozeUntil = new Date(now.getTime() + durationSeconds * 1000);
    
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          isSnoozed: true,
          snoozedAt: now.toISOString(),
          snoozeUntil: snoozeUntil.toISOString(),
          wasSnoozed: true,
        };
      }
      return order;
    }));
  }, []);

  const handleWakeUp = useCallback((orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          isSnoozed: false,
          snoozedAt: undefined,
          snoozeUntil: undefined,
        };
      }
      return order;
    }));
  }, []);

  // Check snoozed orders and wake them up when time expires
  useEffect(() => {
    snoozeIntervalRef.current = setInterval(() => {
      const now = new Date();
      setOrders(prev => prev.map(order => {
        if (order.isSnoozed && order.snoozeUntil) {
          const snoozeUntil = new Date(order.snoozeUntil);
          if (now >= snoozeUntil) {
            // Wake up the order
            return {
              ...order,
              isSnoozed: false,
              snoozedAt: undefined,
              snoozeUntil: undefined,
            };
          }
        }
        return order;
      }));
    }, 1000); // Check every second

    return () => {
      if (snoozeIntervalRef.current) {
        clearInterval(snoozeIntervalRef.current);
      }
    };
  }, []);

  // 86 / Stock status handlers
  const menuItems: MenuItem[] = useMemo(() => [
    { id: "marg-1", name: "Margherita" },
    { id: "pepp-1", name: "Pepperoni" },
    { id: "hawaiian-1", name: "Hawaiian" },
    { id: "bbq-1", name: "BBQ Chicken" },
    { id: "caesar-1", name: "Caesar Salad" },
    { id: "garlic-1", name: "Garlic Bread" },
    { id: "ribeye-1", name: "Ribeye Steak" },
    { id: "salmon-1", name: "Salmon" },
    { id: "carbonara-1", name: "Carbonara" },
    { id: "tiramisu-1", name: "Tiramisu" },
  ], []);

  const handleUpdateStockStatus = useCallback((itemId: string, status: StockStatus, count?: number) => {
    const item = menuItems.find(m => m.id === itemId);
    if (!item) return;

    setStockStatuses(prev => {
      const existing = prev.find(s => s.itemId === itemId);
      const updated = prev.filter(s => s.itemId !== itemId);
      
      if (status === 'available') {
        // Remove from list if set to available
        return updated;
      }
      
      const newStatus: ItemStockStatus = {
        itemId,
        itemName: item.name,
        status,
        lowCount: status === 'low' ? count : undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: "Kitchen",
      };
      
      // Only show toast if status changed (not just updating count)
      if (!existing || existing.status !== status) {
        // Add toast notification
        const toast: Stock86Toast = {
          id: `86-${Date.now()}`,
          itemName: item.name,
          status,
          updatedBy: "Kitchen",
          lowCount: count,
        };
        
        setStock86Toasts(prevToasts => {
          const newToasts = [toast, ...prevToasts];
          return newToasts.slice(0, 3); // Max 3 toasts
        });

        // Auto dismiss after 10 seconds
        const timeout = setTimeout(() => {
          setStock86Toasts(prev => prev.filter(t => t.id !== toast.id));
          stock86ToastTimeoutRefs.current.delete(toast.id);
        }, 10000);
        
        stock86ToastTimeoutRefs.current.set(toast.id, timeout);
      }
      
      return [...updated, newStatus];
    });
  }, [menuItems]);

  const handle86ToastDismiss = useCallback((id: string) => {
    setStock86Toasts(prev => prev.filter(t => t.id !== id));
    const timeout = stock86ToastTimeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      stock86ToastTimeoutRefs.current.delete(id);
    }
  }, []);

  const eightySixCount = stockStatuses.filter(s => s.status !== 'available').length;

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

  const simulateOrderModification = useCallback(() => {
    // Find a random order that's in NEW or PREPARING status
    const modifiableOrders = orders.filter(o => o.status === "pending" || o.status === "preparing");
    if (modifiableOrders.length === 0) return;

    const order = modifiableOrders[Math.floor(Math.random() * modifiableOrders.length)];
    
    // Generate some mock changes
    const changes: { type: "added" | "removed" | "modified"; item: { name: string; quantity?: number; }; details?: string; }[] = [];
    
    // 40% chance: add an item
    if (Math.random() > 0.6) {
      changes.push({
        type: 'added',
        item: {
          name: 'Hawaiian',
          quantity: 1,
        }
      });
    }
    
    // 40% chance: remove an item
    if (Math.random() > 0.6 && order.items.length > 1) {
      const itemToRemove = order.items[Math.floor(Math.random() * order.items.length)];
      changes.push({
        type: 'removed',
        item: {
          name: itemToRemove.name,
          quantity: 1,
        }
      });
    }
    
    // 40% chance: modify an item
    if (Math.random() > 0.6 && order.items.length > 0) {
      const itemToModify = order.items[Math.floor(Math.random() * order.items.length)];
      changes.push({
        type: 'modified',
        item: {
          name: itemToModify.name,
        },
        details: 'Medium → Large'
      });
    }

    // If no changes were generated, add at least one
    if (changes.length === 0) {
      changes.push({
        type: 'added',
        item: {
          name: 'Garlic Bread',
          quantity: 1,
        }
      });
    }

    // Update order to mark as modified
    setOrders((prev) => prev.map(o => 
      o.id === order.id 
        ? { 
            ...o, 
            isModified: true, 
            modifiedAt: new Date().toISOString() 
          }
        : o
    ));

    // Create modification toast
    const modificationToast: ModificationToast = {
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      changes,
    };

    addModificationToast(modificationToast);
  }, [orders, addModificationToast]);

  const handleAction = (orderId: string, newStatus: OrderStatus) => {
    // Find the current order to track the transition
    const currentOrder = orders.find(o => o.id === orderId);
    const previousStatus = currentOrder?.status;

    setOrders((prevOrders) => {
      const updatedOrders = prevOrders.map((order) => {
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

        // If bumping from ready column and all stations ready, save to completed and remove order
        if (newStatus === "ready" && order.status === "ready" && allStationsReady) {
          // Add to completed orders history
          const completedOrder: CompletedOrder = {
            id: order.id,
            orderNumber: order.orderNumber,
            orderType: order.orderType,
            tableNumber: order.tableNumber,
            customerName: order.customerName,
            bumpedAt: new Date().toISOString(),
            items: order.items,
            createdAt: order.createdAt,
            originalOrder: order,
          };
          
          setCompletedOrders((prev) => [completedOrder, ...prev].slice(0, 10)); // Keep last 10
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
      
      return updatedOrders;
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

  // Detect batch opportunities
  const batchSuggestionsMemo = useMemo(() => {
    const threshold = 3;
    const newOrders = filteredOrders.filter(o => o.status === 'pending');
    
    // Count items across orders
    const itemCounts = new Map<string, {
      quantity: number;
      orderIds: Set<string>;
      name: string;
      variant: string | null;
    }>();
    
    newOrders.forEach(order => {
      order.items.forEach(item => {
        const key = `${item.name}|${item.variant || ''}`;
        const existing = itemCounts.get(key) || { 
          quantity: 0, 
          orderIds: new Set(),
          name: item.name,
          variant: item.variant,
        };
        existing.quantity += item.quantity;
        existing.orderIds.add(order.id);
        itemCounts.set(key, existing);
      });
    });
    
    // Filter to batches that meet threshold and haven't been dismissed
    const batches: BatchSuggestion[] = [];
    itemCounts.forEach((data, key) => {
      if (data.orderIds.size >= threshold && !dismissedBatches.has(key)) {
        const relevantOrders = newOrders.filter(o => data.orderIds.has(o.id));
        batches.push({
          itemName: data.name,
          variant: data.variant,
          totalQuantity: data.quantity,
          orderCount: data.orderIds.size,
          orderIds: Array.from(data.orderIds),
          orderNumbers: relevantOrders.map(o => o.orderNumber),
        });
      }
    });
    
    // Sort by quantity (highest first)
    return batches.sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 4); // Max 4 suggestions
  }, [filteredOrders, dismissedBatches]);

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

  return (
    <div className="h-screen flex flex-col">
      <KDSHeader 
        stationName={activeStation.name.toUpperCase()} 
        activeCount={activeCount}
        stations={STATIONS}
        activeStationId={activeStationId}
        onStationChange={setActiveStationId}
        orderCounts={orderCounts}
        completedOrders={completedOrders}
        onRecall={handleRecall}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        eightySixCount={eightySixCount}
        onEightySixClick={() => setShow86Panel(true)}
      />
      
      {viewMode === "tickets" && (
        <>
          <KDSBatchingHints 
            batches={batchSuggestions}
            onDismiss={handleBatchDismiss}
            onHighlight={handleBatchHighlight}
            orders={filteredOrders}
          />
          <div className="flex-1 overflow-hidden">
            <KDSColumns 
              orders={filteredOrders} 
              onAction={handleAction}
              onRefire={handleRefire}
              highlightedTicketId={highlightedTicketId}
              batchHighlightedIds={batchHighlightedIds}
              currentStationId={activeStationId}
              stations={STATIONS}
              transitioningTickets={transitioningTickets}
              canSnooze={canSnooze}
              onSnooze={handleSnooze}
              onWakeUp={handleWakeUp}
              stockStatuses={stockStatuses}
            />
          </div>
        </>
      )}
      
      {viewMode === "all-day" && (
        <div className="flex-1 overflow-auto">
          <KDSAllDayView orders={filteredOrders} />
        </div>
      )}
      
      <KDSToastContainer 
        toasts={toasts}
        modificationToasts={modificationToasts}
        onView={handleToastView}
        onDismiss={handleToastDismiss}
        onModificationView={handleModificationToastView}
        onModificationDismiss={handleModificationToastDismiss}
      />

      <KDS86ToastContainer 
        toasts={stock86Toasts}
        onDismiss={handle86ToastDismiss}
      />

      {show86Panel && (
        <KDS86Panel
          items={menuItems}
          stockStatuses={stockStatuses}
          onUpdateStatus={handleUpdateStockStatus}
          onClose={() => setShow86Panel(false)}
        />
      )}

      {/* Demo buttons to simulate new orders and modifications */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <Button 
          onClick={simulateNewOrder}
          size="lg"
          className="shadow-lg"
        >
          Simulate New Order
        </Button>
        <Button 
          onClick={simulateOrderModification}
          size="lg"
          className="shadow-lg bg-amber-600 hover:bg-amber-700"
        >
          Simulate Modification
        </Button>
      </div>
    </div>
  );
}
