import type { NextConfig } from "next";

// Security headers, applied by Next itself.
//
// These were first added to netlify.toml, and the live site proved that is not enough: static
// assets served straight off Netlify's edge (site.webmanifest) came back with the full set,
// while every HTML route came back without X-Frame-Options, Referrer-Policy or the CSP, with
// `cache-status: "Next.js"; hit` on the response. Netlify's [[headers]] rules are applied by
// the edge and do not reach a response the Next runtime serves out of its own cache. Next
// applies the list below however the response is produced, so this is the copy that holds.
//
// netlify.toml keeps its own copy for the static files Netlify never hands to Next. Both
// sending the same values is harmless; the duplication is deliberate, since neither file can
// read the other.
//
// TRAP: if NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ever moves off *.firebaseapp.com to this domain,
// the /__/auth/* proxy becomes live and `X-Frame-Options: DENY` on it breaks the sign-in
// popup, which loads that handler in a frame. Exempt /__/auth/* from this list at that point.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), clipboard-write=(self)",
  },
  // Report-only: this cannot block anything, it only logs violations to the browser console.
  // 'unsafe-inline' in script-src is required by the two inline scripts layout.tsx injects;
  // enforcing a strict script-src needs nonces and a middleware.ts, which is separate work.
  {
    key: "Content-Security-Policy-Report-Only",
    value:
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://*.firebaseapp.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob: https://cdn.jsdelivr.net https://*.googleusercontent.com https://www.gstatic.com; " +
      "font-src 'self' data:; " +
      "connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com; " +
      "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com; " +
      "worker-src 'self' blob:; " +
      "manifest-src 'self'; " +
      "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Allow ngrok tunnels for external demo sharing
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.ngrok-free.app",
        "*.ngrok.app",
        "*.ngrok.io",
        "localhost:3000",
        "localhost:3001",
        "localhost:3005",
      ],
    },
  },
  async rewrites() {
    // Proxies the Firebase Auth handler when the OAuth popup is pointed at the custom domain.
    // Read from the environment rather than hardcoded: this line named the decommissioned
    // `jarvisaiacademy-580a7` long after the project had been replaced, so it silently
    // proxied to a dead backend. Deriving it means the rewrite follows the project the rest
    // of the app is configured against. `netlify.toml` carries the same rule and cannot
    // interpolate, so that copy needs updating by hand whenever the project changes.
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return [];
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${projectId}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
