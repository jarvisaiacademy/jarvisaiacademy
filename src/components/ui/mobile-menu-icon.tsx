import React from "react";

export function MobileMenuIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="4" y1="8.5" x2="20" y2="8.5" />
      <line x1="4" y1="15.5" x2="13" y2="15.5" />
    </svg>
  );
}

export default MobileMenuIcon;
