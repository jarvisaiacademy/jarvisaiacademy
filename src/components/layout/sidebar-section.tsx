"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface SidebarSectionProps {
  /** The group's name, e.g. "Courses". */
  label: string;
  /** The rows the header collapses. */
  children: React.ReactNode;
  defaultOpen?: boolean;
}

/**
 * A collapsible group in the sidebar, styled after ChatGPT's section headers: a
 * full-width, muted row that barely reads as a control until you hover it, with
 * the chevron appearing on hover rather than at rest.
 *
 * Every sidebar group goes through this, so adding one costs only its label and
 * rows instead of a restatement of the chrome.
 */
export function SidebarSection({
  label,
  children,
  defaultOpen = true,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="group flex w-full items-center gap-1 px-3 py-1 rounded-lg text-left text-[11px] font-medium text-neutral-400 dark:text-neutral-500 transition-colors cursor-pointer hover:text-neutral-600 dark:hover:text-neutral-300"
      >
        {label}
        {/* Hidden at rest, revealed on hover or keyboard focus. Touch has no hover
            to reveal it, so there it stays visible — otherwise a phone would show
            a label that never advertises itself as collapsible. */}
        <ChevronDown
          aria-hidden="true"
          className={`w-3 h-3 shrink-0 transition-transform opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100 ${
            isOpen ? "" : "-rotate-90"
          }`}
        />
      </button>
      {isOpen && children}
    </div>
  );
}

export default SidebarSection;
