import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
// next.config.js
/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    // 빌드 시 ESLint 에러를 무시합니다
    ignoreDuringBuilds: true,
  },
};