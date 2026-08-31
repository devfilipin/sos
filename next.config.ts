import type { NextConfig } from "next";

const emergencyHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
const nextConfig: NextConfig = { async headers() { return [
  { source: "/sos", headers: emergencyHeaders },
  { source: "/e/:path*", headers: emergencyHeaders },
]; } };

export default nextConfig;
