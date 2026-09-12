"use client";

import { ImageIcon, PenLine, Globe, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface QuickActionsProps {
  onActionClick?: (label: string) => void;
}

const actions: { id: string; label: string; icon: LucideIcon }[] = [
  {
    id: "image",
    label: "Create an image or sticker",
    icon: ImageIcon,
  },
  {
    id: "write",
    label: "Write or edit",
    icon: PenLine,
  },
  {
    id: "search",
    label: "Search the web",
    icon: Globe,
  },
];

export function QuickActions({ onActionClick }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="w-full max-w-2xl mx-auto mt-6 flex flex-col gap-1.5 px-2"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onActionClick?.(action.label)}
            className="group flex items-center gap-3 w-fit py-1.5 px-2 text-sm text-neutral-300 hover:text-white rounded-lg transition-all text-left select-none hover:bg-white/5"
          >
            <Icon className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors shrink-0" />
            <span className="font-normal">{action.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
