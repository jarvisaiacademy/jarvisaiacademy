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
};

export default nextConfig;
