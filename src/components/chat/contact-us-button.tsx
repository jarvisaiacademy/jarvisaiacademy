"use client";

import React from "react";
import { siteConfig } from "@/config/site";

/**
 * Default contact phone and call link.
 * You can customize these defaults directly here, or pass `href` / `phoneNumber`
 * as props to the <ContactUsButton /> component.
 */
export const DEFAULT_CONTACT_PHONE = siteConfig.contact.phone;
export const DEFAULT_CONTACT_CALL_LINK = `tel:${DEFAULT_CONTACT_PHONE.replace(/\s+/g, "")}`;

/**
 * Default WhatsApp contact phone, prefilled message and link.
 */
export const DEFAULT_WHATSAPP_PHONE = siteConfig.contact.whatsappNumber;
export const DEFAULT_WHATSAPP_MESSAGE =
  "Hello Jarvis AI Academy, I am interested in your courses and would like to make an inquiry.";

/**
 * Helper to construct a WhatsApp click-to-chat URL with a prefilled message.
 * Formats a 10-digit Indian phone number to international format (prefixed with 91).
 */
export function createWhatsAppLink(
  phone: string = DEFAULT_WHATSAPP_PHONE,
  message: string = DEFAULT_WHATSAPP_MESSAGE
): string {
  const digits = phone.replace(/\D/g, "");
  const fullPhone = digits.length === 10 ? `91${digits}` : digits;
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${fullPhone}?text=${encodedText}`;
}

export const DEFAULT_WHATSAPP_LINK = createWhatsAppLink(
  DEFAULT_WHATSAPP_PHONE,
  DEFAULT_WHATSAPP_MESSAGE
);

/**
 * Official Font Awesome 6 Solid Headset Icon (`fa-headset`).
 * Path data extracted from `@fortawesome/free-solid-svg-icons/faHeadset` (viewBox: 0 0 448 512).
 */
export function FontAwesomeHeadsetIcon({
  className = "h-3.5 w-3.5",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M224 64c-79 0-144.7 57.3-157.7 132.7 9.3-3 19.3-4.7 29.7-4.7l16 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-16 0c-53 0-96-43-96-96l0-64C0 100.3 100.3 0 224 0S448 100.3 448 224l0 168.1c0 66.3-53.8 120-120.1 120l-87.9-.1-32 0c-26.5 0-48-21.5-48-48s21.5-48 48-48l32 0c26.5 0 48 21.5 48 48l0 0 40 0c39.8 0 72-32.2 72-72l0-20.9c-14.1 8.2-30.5 12.8-48 12.8l-16 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48l16 0c10.4 0 20.3 1.6 29.7 4.7-13-75.3-78.6-132.7-157.7-132.7z" />
    </svg>
  );
}

export interface ContactUsButtonProps {
  /**
   * The destination link. If provided, overrides `phoneNumber` and `DEFAULT_WHATSAPP_LINK`.
   * Examples: "https://wa.me/918806431723", "tel:+918806431723", "/contact", etc.
   */
  href?: string;
  /**
   * Custom phone number for WhatsApp. Formatted into a WhatsApp link with `message`.
   */
  phoneNumber?: string;
  /**
   * Pre-filled message for WhatsApp inquiry. Defaults to `DEFAULT_WHATSAPP_MESSAGE`.
   */
  message?: string;
  /**
   * Button text displayed on the left side of the pill.
   * Defaults to "CONTACT US".
   */
  text?: string;
  /**
   * Optional custom CSS class name to append or override styling.
   */
  className?: string;
  /**
   * Optional click handler.
   */
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  /**
   * Link target (e.g. "_blank"). Defaults to "_blank" for external links.
   */
  target?: string;
  /**
   * Rel attribute for security (e.g. "noopener noreferrer"). Defaults to "noopener noreferrer" for external links.
   */
  rel?: string;
  /**
   * Accessible aria-label. Defaults to "Contact Us on WhatsApp".
   */
  ariaLabel?: string;
}

/**
 * Modern pill-shaped CTA button with vibrant purple-to-pink gradient, bold uppercase typography,
 * soft shadow, and a white circular icon container with Font Awesome fa-headset icon in dark purple.
 */
export function ContactUsButton({
  href,
  phoneNumber,
  message,
  text = "CONTACT US",
  className = "",
  onClick,
  target,
  rel,
  ariaLabel = "Contact Us on WhatsApp",
}: ContactUsButtonProps) {
  // Determine target link: WhatsApp link with prefilled message by default
  const targetHref =
    href ??
    (phoneNumber
      ? createWhatsAppLink(phoneNumber, message ?? DEFAULT_WHATSAPP_MESSAGE)
      : message
        ? createWhatsAppLink(DEFAULT_WHATSAPP_PHONE, message)
        : DEFAULT_WHATSAPP_LINK);

  const isExternal =
    targetHref.startsWith("http://") ||
    targetHref.startsWith("https://") ||
    targetHref.startsWith("//");

  const resolvedTarget = target ?? (isExternal ? "_blank" : undefined);
  const resolvedRel = rel ?? (isExternal ? "noopener noreferrer" : undefined);

  return (
    <a
      href={targetHref}
      onClick={onClick}
      target={resolvedTarget}
      rel={resolvedRel}
      aria-label={ariaLabel}
      className={`group/contact inline-flex cursor-pointer items-center justify-between gap-2.5 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 pl-4 pr-1.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-purple-500/20 transition-all duration-300 hover:brightness-105 hover:shadow-lg hover:shadow-pink-500/30 active:scale-98 sm:text-[13px] ${className}`}
    >
      <span className="leading-none">{text}</span>
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white shadow-xs transition-transform duration-200 group-hover/contact:scale-105"
      >
        <FontAwesomeHeadsetIcon className="h-3.5 w-3.5 text-purple-900 transition-colors" />
      </span>
    </a>
  );
}
