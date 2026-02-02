'use client';

import { Button } from "@/components/ui/button";

interface SnoozePickerProps {
  onSelect: (seconds: number) => void;
  onCancel: () => void;
}

export function SnoozePicker({ onSelect, onCancel }: SnoozePickerProps) {
  const durations = [
    { label: '1m', seconds: 60 },
    { label: '2m', seconds: 120 },
    { label: '3m', seconds: 180 },
    { label: '5m', seconds: 300 }
  ];

  return (
    <div className="absolute z-50 bg-background border border-border rounded-lg shadow-lg p-3 min-w-[240px]">
      <div className="text-sm font-medium mb-3">Snooze for:</div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {durations.map(d => (
          <Button
            key={d.seconds}
            onClick={() => onSelect(d.seconds)}
            variant="outline"
            className="bg-amber-50 hover:bg-amber-100 border-amber-200"
          >
            {d.label}
          </Button>
        ))}
      </div>
      <Button
        onClick={onCancel}
        variant="ghost"
        size="sm"
        className="w-full"
      >
        Cancel
      </Button>
    </div>
  );
}
