import type { NextConfig } from "next";

// Security headers sent with every response. Each turns on a browser
// protection the app doesn't otherwise need to opt out of.
const securityHeaders = [
  // Don't let other sites put this app in a frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Don't guess file types from content; trust Content-Type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin (not full URLs with book/idea ids) to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The app never needs these device features.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
