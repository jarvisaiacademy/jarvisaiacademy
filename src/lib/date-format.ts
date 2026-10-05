/**
 * Global Date Formatter for Jarvis AI Academy.
 * Standard format: "5 October 2026" (d MMMM yyyy).
 */

export function formatDate(
  input?: string | number | Date | null,
  fallback: string = "—"
): string {
  if (!input) return fallback;
  const date = typeof input === "object" && input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return fallback;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Global Date + Time Formatter for Jarvis AI Academy.
 * Standard format: "5 October 2026, 11:30 pm"
 */
export function formatDateTime(
  input?: string | number | Date | null,
  fallback: string = "—"
): string {
  if (!input) return fallback;
  const date = typeof input === "object" && input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return fallback;

  const datePart = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart}, ${timePart.toLowerCase()}`;
}
