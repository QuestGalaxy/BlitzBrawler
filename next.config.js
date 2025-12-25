const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@web3modal/ethers",
    "@web3modal/core",
    "@web3modal/scaffold-utils",
    "@web3modal/scaffold-react",
    "@web3modal/wallet",
  ],
  webpack: (config) => {
    // Ensure a single valtio instance so Web3Modal state proxies are compatible.
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      valtio: path.resolve(__dirname, "node_modules/valtio"),
      "valtio/vanilla": path.resolve(__dirname, "node_modules/valtio/vanilla"),
      "valtio/vanilla/utils": path.resolve(__dirname, "node_modules/valtio/vanilla/utils"),
    };
    return config;
  },
};

module.exports = nextConfig;
