"use client";

import {
  GraduationCap,
  Shield,
  Heart,
  Brain,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { PinnedItem } from "@/types/chat";

const iconMap: Record<string, LucideIcon> = {
  GraduationCap,
  Shield,
  Heart,
  Brain,
  Sparkles,
};

const defaultPinned: PinnedItem[] = [
  {
    id: "pin-1",
    title: "Resume/Confidence Builder",
    iconName: "GraduationCap",
    color: "text-emerald-400",
  },
  {
    id: "pin-2",
    title: "Zexy.Live",
    iconName: "Shield",
    color: "text-sky-400",
  },
  {
    id: "pin-3",
    title: "Buddha and Ambedkar Unders...",
    iconName: "Heart",
    color: "text-cyan-400",
  },
  {
    id: "pin-4",
    title: "Learn GenAI/AI/ML/Tools/Pyth...",
    iconName: "Brain",
    color: "text-emerald-400",
  },
  {
    id: "pin-5",
    title: "Personal Development",
    iconName: "Heart",
    color: "text-rose-400",
  },
];

interface SidebarPinnedProps {
  items?: PinnedItem[];
  onSelect?: (id: string) => void;
}

export function SidebarPinned({
  items = defaultPinned,
  onSelect,
}: SidebarPinnedProps) {
  return (
    <div className="flex flex-col px-2 py-2">
      <span className="px-3 pb-1 text-xs font-semibold text-neutral-400 select-none">
        Pinned
      </span>

      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = iconMap[item.iconName] || Sparkles;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className="group flex items-center gap-2.5 w-full px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
              <span className="truncate">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
