import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: "hallyoswim",
  project: "hallyoswim-web",
  silent: !process.env.CI,
  sourcemaps: {
    disable: true
  }
});
