import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
