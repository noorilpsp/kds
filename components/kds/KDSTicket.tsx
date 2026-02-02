'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { WaitingForStationsBadge } from "./WaitingForStationsBadge";
import type { Station } from "./StationSwitcher";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RotateCcw, AlertTriangle } from "lucide-react";

type OrderStatus = "pending" | "preparing" | "ready";

interface OrderItem {
  id: string;
  name: string;
  variant: string | null;
  quantity: number;
  customizations: string[];
  stationId?: string;
  isNew?: boolean;
  isModified?: boolean;
  isRemoved?: boolean;
  changeDetails?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: "dine_in" | "pickup" | "delivery";
  tableNumber: string | null;
  customerName: string | null;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  specialInstructions?: string;
  stationStatuses?: Record<string, OrderStatus>;
  isRemake?: boolean;
  remakeReason?: string;
  originalOrderId?: string;
  isRecalled?: boolean;
  recalledAt?: string;
  isModified?: boolean;
  modifiedAt?: string;
}

interface KDSTicketProps {
  order: Order;
  onAction: (orderId: string, newStatus: OrderStatus) => void;
  onRefire?: (item: OrderItem, reason?: string) => void;
  priority?: number | null;
  isHighlighted?: boolean;
  currentStationId?: string;
  waitingStations?: Station[];
  isStationComplete?: boolean;
  columnAccent?: 'new' | 'preparing' | 'ready';
  assignedCook?: { name: string; color: string };
  transitionDirection?: 'from-left' | 'from-right';
  isLanding?: boolean;
  landingType?: 'preparing' | 'ready';
  skipEntranceAnimation?: boolean;
}

function getElapsedTime(createdAt: string): string {
  const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getElapsedMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
}

type UrgencyLevel = "urgent" | "warning" | "normal";

function getUrgencyLevel(createdAt: string): UrgencyLevel {
  const minutes = getElapsedMinutes(createdAt);
  if (minutes >= 10) return "urgent";
  if (minutes >= 5) return "warning";
  return "normal";
}

function getActionButton(status: OrderStatus): {
  label: string;
  nextStatus: OrderStatus;
} {
  switch (status) {
    case "pending":
      return { label: "START", nextStatus: "preparing" };
    case "preparing":
      return { label: "READY", nextStatus: "ready" };
    case "ready":
      return { label: "BUMP", nextStatus: "ready" };
  }
}

const ORDER_TYPE_BADGE: Record<Order["orderType"], { icon: string; label: string }> = {
  dine_in: { icon: "🍽", label: "DINE-IN" },
  pickup: { icon: "🥡", label: "TAKEAWAY" },
  delivery: { icon: "🚚", label: "DELIVERY" },
};

// Allergen detection
const ALLERGEN_KEYWORDS = [
  'allergy', 'allergic', 'allergen',
  'peanut', 'nut', 'tree nut',
  'gluten', 'celiac', 'coeliac',
  'dairy', 'lactose', 'milk',
  'shellfish', 'seafood', 'fish',
  'egg',
  'soy', 'soya',
  'sesame'
];

function detectAllergens(order: Order): string[] {
  const found: string[] = [];
  const textToScan = [
    order.specialInstructions || '',
    ...order.items.flatMap(i => i.customizations)
  ].join(' ').toLowerCase();
  
  for (const keyword of ALLERGEN_KEYWORDS) {
    if (textToScan.includes(keyword)) {
      found.push(keyword);
    }
  }
  
  return [...new Set(found)];
}

function getAllergenLabel(allergens: string[]): string {
  // Prioritize specific allergen types
  if (allergens.some(a => a.includes('peanut') || a.includes('nut'))) return 'NUT ALLERGY';
  if (allergens.some(a => a.includes('gluten') || a.includes('celiac'))) return 'GLUTEN ALLERGY';
  if (allergens.some(a => a.includes('dairy') || a.includes('lactose') || a.includes('milk'))) return 'DAIRY ALLERGY';
  if (allergens.some(a => a.includes('shellfish') || a.includes('seafood') || a.includes('fish'))) return 'SHELLFISH ALLERGY';
  if (allergens.some(a => a.includes('egg'))) return 'EGG ALLERGY';
  if (allergens.some(a => a.includes('soy'))) return 'SOY ALLERGY';
  if (allergens.some(a => a.includes('sesame'))) return 'SESAME ALLERGY';
  return 'ALLERGEN';
}

function itemHasAllergen(item: OrderItem): boolean {
  const text = item.customizations.join(' ').toLowerCase();
  return ALLERGEN_KEYWORDS.some(keyword => text.includes(keyword));
}

export function KDSTicket({ 
  order, 
  onAction,
  onRefire,
  priority, 
  isHighlighted,
  currentStationId,
  waitingStations = [],
  isStationComplete = false,
  columnAccent,
  assignedCook,
  transitionDirection,
  isLanding,
  landingType,
  skipEntranceAnimation = false,
}: KDSTicketProps) {
  const { label, nextStatus } = getActionButton(order.status);
  const orderTypeBadge = ORDER_TYPE_BADGE[order.orderType] ?? ORDER_TYPE_BADGE.pickup;
  const [elapsedTime, setElapsedTime] = useState(getElapsedTime(order.createdAt));
  const [urgencyLevel, setUrgencyLevel] = useState(getUrgencyLevel(order.createdAt));
  const [refireDialogOpen, setRefireDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [refireReason, setRefireReason] = useState<string>("");
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Detect allergens
  const allergens = detectAllergens(order);
  const hasAllergen = allergens.length > 0;
  const allergenLabel = hasAllergen ? getAllergenLabel(allergens) : '';

  // Check if modification highlights should show (fade after 2 minutes)
  const showModificationHighlights = order.isModified && order.modifiedAt 
    ? (Date.now() - new Date(order.modifiedAt).getTime()) < 120000
    : false;

  const handleRefireClick = (item: OrderItem) => {
    setSelectedItem(item);
    setRefireDialogOpen(true);
    setRefireReason("");
  };

  const handleRefireConfirm = () => {
    if (selectedItem && onRefire) {
      onRefire(selectedItem, refireReason);
    }
    setRefireDialogOpen(false);
    setSelectedItem(null);
    setRefireReason("");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime(order.createdAt));
      setUrgencyLevel(getUrgencyLevel(order.createdAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [order]);

  const urgencyDot = urgencyLevel === "urgent" 
    ? "🔴" 
    : urgencyLevel === "warning" 
    ? "🟡" 
    : null;

  const timerColorClass = urgencyLevel === "urgent"
    ? "text-red-500 font-semibold"
    : urgencyLevel === "warning"
    ? "text-yellow-600 dark:text-yellow-500 font-medium"
    : "text-muted-foreground";

  // Urgency border overrides column accent border
  const borderClass = urgencyLevel === "urgent"
    ? "border-l-4 border-y-2 border-r-2 border-red-500"
    : urgencyLevel === "warning"
    ? "border-l-4 border-y-2 border-r-2 border-yellow-500"
    : columnAccent === 'new'
    ? "border-l-4 border-l-gray-400 dark:border-l-gray-500"
    : columnAccent === 'preparing'
    ? "border-l-4 border-l-blue-400 dark:border-l-blue-500"
    : columnAccent === 'ready'
    ? "border-l-4 border-l-green-400 dark:border-l-green-500"
    : "";

  const shadowClass = urgencyLevel === "urgent"
    ? "shadow-[0_0_0_0_rgba(239,68,68,0.4)] animate-[urgentPulse_2s_ease-in-out_infinite]"
    : urgencyLevel === "warning"
    ? "shadow-[0_0_12px_rgba(234,179,8,0.3)]"
    : "";

  const highlightClass = isHighlighted ? "bg-yellow-100 dark:bg-yellow-900/30" : "";

  // Landing glow class based on destination
  const landingGlowClass = isLanding 
    ? landingType === "ready" 
      ? "ticket-landing-ready" 
      : "ticket-landing-preparing"
    : "";

  // Determine initial position based on transition direction / landing column
  const getInitialAnimation = () => {
    // Landing in READY: same slide-in as NEW → PREPARING (from left)
    if (columnAccent === "ready" && isLanding) {
      return { opacity: 0, x: -120, scale: 1.03 };
    }
    if (transitionDirection === "from-left") {
      return { opacity: 0, x: -120, scale: 1.03 };
    }
    if (transitionDirection === "from-right") {
      return { opacity: 0, x: 120, scale: 1.03 };
    }
    return { opacity: 0, scale: 0.95 };
  };

  // Animate to settled position
  const getAnimateState = () => {
    return { opacity: 1, x: 0, y: 0, scale: 1 };
  };

  // Transition timing for smooth directional movement
  const getTransition = () => {
    // Landing in READY: same as NEW → PREPARING slide-in
    if (columnAccent === "ready" && isLanding) {
      return {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
        scale: {
          duration: 0.5,
          delay: 0.2,
          ease: "easeOut"
        }
      };
    }
    if (transitionDirection) {
      return {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as const,
        scale: {
          duration: 0.5,
          delay: 0.2,
          ease: "easeOut"
        }
      };
    }
    return { duration: 0.3, ease: "easeOut" };
  };

  // Layout transition for smooth reordering when moving from staged to final position
  const layoutTransition = {
    type: "spring" as const,
    stiffness: 350,
    damping: 30,
    mass: 1,
  };

  // Remake/Recalled/Allergen/Modified badge styling
  const badgeBorderClass = hasAllergen
    ? "border-l-4 border-y-2 border-r-2 border-red-600 ring-2 ring-red-500"
    : order.isRemake
    ? "border-l-4 border-y-2 border-r-2 border-red-500"
    : order.isRecalled
    ? "border-l-4 border-y-2 border-r-2 border-yellow-500"
    : showModificationHighlights
    ? "border-l-4 border-y-2 border-r-2 border-amber-500"
    : borderClass;

  return (
    <>
      <motion.div
        id={`ticket-${order.id}`}
        layout={!(isLanding && (columnAccent === "ready" || columnAccent === "preparing"))}
        layoutId={`${order.id}-${columnAccent ?? "preparing"}`}
        initial={skipEntranceAnimation ? getAnimateState() : getInitialAnimation()}
        animate={getAnimateState()}
        exit={
          columnAccent === "new"
            ? { opacity: 0, x: 120, transition: { duration: 0.3, ease: "easeIn" } }
            : columnAccent === "preparing"
              ? { opacity: 0, x: 120, transition: { duration: 0.3, ease: "easeIn" } }
              : columnAccent === "ready"
                ? { opacity: 0, scale: 0.96, y: 20, transition: { duration: 0.25, ease: "easeIn" } }
                : { opacity: 0, scale: 0.98, transition: { duration: 0.2, ease: "easeIn" } }
        }
        transition={{
          ...getTransition(),
          layout: layoutTransition,
        }}
        className={`w-full max-w-[300px] 2xl:max-w-[340px] ${landingGlowClass}`}
      >
        <Card className={`relative overflow-hidden pt-0 pb-0 ${badgeBorderClass} ${shadowClass} ${highlightClass}`}>
          {/* ALLERGEN Banner - Highest priority */}
          {hasAllergen && (
            <div className="bg-red-600 text-white px-3 py-2 font-bold text-base 2xl:text-lg flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 2xl:w-6 2xl:h-6" />
              {allergenLabel}
            </div>
          )}
          
          {/* MODIFIED Badge */}
          {!hasAllergen && showModificationHighlights && (
            <div className="bg-amber-500 text-black px-2 py-1 text-center font-bold text-sm 2xl:text-base">
              ✏️ MODIFIED
            </div>
          )}
          
          {/* REMAKE/RECALLED Badge */}
          {!hasAllergen && !showModificationHighlights && (order.isRemake || order.isRecalled) && (
            <div className={`px-2 py-1 text-center font-bold text-sm 2xl:text-base ${
              order.isRemake 
                ? "bg-red-500 text-white"
                : "bg-yellow-500 text-black"
            }`}>
              {order.isRemake ? "🔄 REMAKE" : "↩ RECALLED"}
            </div>
          )}
          {/* COMPACT METADATA ROW - reduced dominance, item-focused hierarchy */}
          <div className="px-2 pt-1.5 pb-0 2xl:px-3 2xl:pt-2 2xl:pb-0 bg-muted/30 border-b border-border/50">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm 2xl:text-base text-muted-foreground leading-snug">
              <span className="min-w-0 flex items-center gap-1.5 shrink-0">
                <span className="shrink-0 text-muted-foreground/80" aria-label={orderTypeBadge.label} title={orderTypeBadge.label}>{orderTypeBadge.icon}</span>
                <span className="truncate font-medium text-foreground/80">
                  {order.orderType === "dine_in" && order.tableNumber
                    ? `Table ${order.tableNumber}`
                    : order.customerName}
                </span>
              </span>
              {priority != null ? (
                <span className="shrink-0 text-base 2xl:text-lg font-bold text-red-500 justify-self-center">
                  {['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'][priority - 1] || priority}
                </span>
              ) : (
                <span className="min-w-0" aria-hidden />
              )}
              <div className="flex items-center gap-2 justify-self-end shrink-0">
                {assignedCook && (
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 2xl:w-2.5 2xl:h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: assignedCook.color }}
                    />
                    <span>{assignedCook.name}</span>
                  </div>
                )}
                <div className={`flex items-center gap-1.5 tabular-nums ${timerColorClass}`}>
                  <svg
                    className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 shrink-0 opacity-70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <polyline points="12,6 12,12 16,14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{elapsedTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ITEMS - tight spacing above = below */}
          <div className="-mt-1.5 pt-0 px-2 pb-0 2xl:-mt-2 2xl:px-3 2xl:pb-0 space-y-0 2xl:space-y-0.5">
            {order.items.map((item) => {
              const hasItemAllergen = itemHasAllergen(item);
              const itemChangeClass = showModificationHighlights
                ? item.isNew
                  ? "text-green-600 dark:text-green-400"
                  : item.isModified
                  ? "text-amber-600 dark:text-amber-400"
                  : item.isRemoved
                  ? "line-through opacity-50"
                  : ""
                : "";
              
              return (
                <div key={item.id} className={`space-y-0.5 ${hasItemAllergen ? 'border-l-4 border-red-500 pl-2 bg-red-50 dark:bg-red-950/30' : ''}`}>
                  <div 
                    className="group/item relative flex items-baseline gap-2 text-lg 2xl:text-xl leading-snug"
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  >
                    <span className={`font-bold tabular-nums ${itemChangeClass || 'text-foreground'}`}>{item.quantity}x</span>
                    <span className={`font-bold ${itemChangeClass || 'text-foreground'}`}>{item.name}</span>
                    {item.variant && (
                      <span className={`text-base 2xl:text-lg font-medium ${itemChangeClass || 'text-muted-foreground'}`}>({item.variant})</span>
                    )}
                    {/* Modification label */}
                    {showModificationHighlights && item.isNew && (
                      <span className="ml-1 text-xs font-bold text-green-600 dark:text-green-400">← NEW</span>
                    )}
                    {showModificationHighlights && item.isModified && (
                      <span className="ml-1 text-xs font-bold text-amber-600 dark:text-amber-400">← CHANGED</span>
                    )}
                    {showModificationHighlights && item.isRemoved && (
                      <span className="ml-1 text-xs font-bold text-red-600 dark:text-red-400">← REMOVED</span>
                    )}
                  </div>
                  {/* Re-fire button - shows on hover (desktop) */}
                  {onRefire && hoveredItemId === item.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefireClick(item);
                      }}
                      className="ml-auto shrink-0 p-1 rounded hover:bg-muted transition-colors"
                      title="Re-fire this item"
                    >
                      <RotateCcw className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                  {/* Modifiers - work-first: visible, readable, part of cooking task */}
                  {item.customizations.length > 0 && (
                    <div className="pl-4 2xl:pl-5 space-y-1">
                      {item.customizations.map((customization, index) => {
                        const lower = customization.toLowerCase();
                        const isRemoval = lower.startsWith('no ');
                        const isAddition =
                          lower.startsWith('extra ') ||
                          lower.startsWith('add ') ||
                          lower.startsWith('with ') ||
                          lower.startsWith('double ') ||
                          lower.startsWith('plus ');
                        const displayText = isRemoval
                          ? customization.replace(/^no\s+/i, '').toUpperCase()
                          : customization;
                        const prefix = isRemoval ? '−' : isAddition ? '+' : '•';
                        return (
                          <div
                            key={index}
                            className={`text-base 2xl:text-lg leading-snug flex items-baseline gap-2 ${
                              isRemoval
                                ? 'text-red-500 dark:text-red-400 font-semibold'
                                : isAddition
                                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                  : 'text-foreground/85 font-medium'
                            }`}
                          >
                            <span
                              className={`shrink-0 ${isRemoval ? 'text-red-500 dark:text-red-400' : 'opacity-90'}`}
                              aria-hidden
                            >
                              {prefix}
                            </span>
                            {isRemoval ? (
                              <span>
                                <span className="font-semibold">NO </span>
                                {displayText}
                              </span>
                            ) : (
                              <span>{displayText}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* SPECIAL NOTES */}
          {order.specialInstructions && (
            <div className="mx-2 -mt-1 mb-2 2xl:mx-3 2xl:-mt-1.5 2xl:mb-3 px-2 py-1.5 2xl:px-3 2xl:py-2 bg-amber-500/20 border border-amber-500/40 rounded-md">
              <p className="text-[13px] 2xl:text-sm font-medium text-amber-800 dark:text-amber-200 leading-snug">
                {order.specialInstructions}
              </p>
            </div>
          )}

          {/* Waiting stations badge */}
          {isStationComplete && waitingStations.length > 0 && (
            <div className="px-2 pb-2 2xl:px-3 2xl:pb-3">
              <WaitingForStationsBadge waitingStations={waitingStations} />
            </div>
          )}

          {/* ACTION BUTTON - same tight gap as above items */}
          <div className="-mt-1.5 pt-0 px-2 pb-2 2xl:-mt-2 2xl:px-3 2xl:pb-3">
            {isStationComplete ? (
              <Button
                className="w-full font-medium text-base 2xl:text-lg h-11 2xl:h-12 bg-transparent text-muted-foreground hover:bg-muted"
                variant="outline"
                onClick={() => onAction(order.id, "ready")}
              >
                Complete
              </Button>
            ) : (
              <Button
                className="w-full font-semibold text-base 2xl:text-lg h-11 2xl:h-12"
                onClick={() => onAction(order.id, nextStatus)}
              >
                {label}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Re-fire Confirmation Dialog */}
      <Dialog open={refireDialogOpen} onOpenChange={setRefireDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Re-fire Item?</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="text-lg font-semibold">
                {selectedItem.quantity}x {selectedItem.name}
                {selectedItem.variant && (
                  <span className="text-muted-foreground font-medium"> ({selectedItem.variant})</span>
                )}
                {selectedItem.customizations.length > 0 && (
                  <div className="pl-4 mt-1 space-y-0.5">
                    {selectedItem.customizations.map((custom, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        + {custom}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason (optional):</label>
                <div className="flex flex-wrap gap-2">
                  {["Burned", "Dropped", "Wrong", "Other"].map((reason) => (
                    <Button
                      key={reason}
                      type="button"
                      variant={refireReason === reason ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRefireReason(reason)}
                    >
                      {reason}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefireDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRefireConfirm}>
              Re-fire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
