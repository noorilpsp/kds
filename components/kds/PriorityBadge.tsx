'use client';

import { motion } from "framer-motion";

interface PriorityBadgeProps {
  priority: number;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const numbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  
  return (
    <motion.div
      key={priority}
      initial={{ scale: 1.3 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="absolute -top-3 -left-3 2xl:-top-4 2xl:-left-4 z-10"
    >
      <span className="text-4xl 2xl:text-5xl font-bold text-red-500 drop-shadow-lg">
        {numbers[priority - 1] || priority}
      </span>
    </motion.div>
  );
}
