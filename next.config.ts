import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    // The current brand images are already prepared at their display sizes.
    // Avoid a paid Cloudflare Images binding until the site needs transforms.
    unoptimized: true,
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
