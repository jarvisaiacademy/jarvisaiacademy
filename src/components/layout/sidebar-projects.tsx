"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Radio,
  Smartphone,
  Sparkles,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { ProjectItem } from "@/types/chat";
import { motion, AnimatePresence } from "motion/react";

const iconMap: Record<string, LucideIcon> = {
  ShoppingBag,
  Radio,
  Smartphone,
  Sparkles,
};

const initialProjects: ProjectItem[] = [
  {
    id: "proj-1",
    name: "MenuMitra: Dev",
    iconName: "ShoppingBag",
    color: "text-amber-500",
  },
  {
    id: "proj-2",
    name: "Rokonet",
    iconName: "Radio",
    color: "text-rose-400",
  },
  {
    id: "proj-3",
    name: "Device Profiles",
    iconName: "Smartphone",
    color: "text-purple-400",
  },
  {
    id: "proj-4",
    name: "Astrology App",
    iconName: "Sparkles",
    color: "text-neutral-200",
  },
  {
    id: "proj-5",
    name: "MenuMitra",
    iconName: "ShoppingBag",
    color: "text-amber-500",
  },
];

const extraProjects: ProjectItem[] = [
  {
    id: "proj-6",
    name: "Jarvis AI Academy",
    iconName: "Sparkles",
    color: "text-sky-400",
  },
  {
    id: "proj-7",
    name: "Analytics Suite",
    iconName: "Radio",
    color: "text-emerald-400",
  },
];

interface SidebarProjectsProps {
  onSelect?: (id: string) => void;
}

export function SidebarProjects({ onSelect }: SidebarProjectsProps) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex flex-col px-2 py-2">
      <span className="px-3 pb-1 text-xs font-semibold text-neutral-400 select-none">
        Projects
      </span>

      <div className="flex flex-col gap-0.5">
        {initialProjects.map((item) => {
          const Icon = iconMap[item.iconName] || ShoppingBag;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className="group flex items-center gap-2.5 w-full px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}

        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-0.5 overflow-hidden"
            >
              {extraProjects.map((item) => {
                const Icon = iconMap[item.iconName] || ShoppingBag;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect?.(item.id)}
                    className="group flex items-center gap-2.5 w-full px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                    <span className="truncate">{item.name}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors text-left"
        >
          {showMore ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show less</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Show more</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
