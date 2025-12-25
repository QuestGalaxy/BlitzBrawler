"use client";

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'
import { GameProvider } from "@/lib/game-context";
import { POLYGON_CHAIN_ID, POLYGON_RPC } from '@/lib/web3';

// 1. Get projectId from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'bafe4ed7deb483e722ef8cc764a23ca9';

// 2. Set chains
const polygon = {
  chainId: POLYGON_CHAIN_ID,
  name: 'Polygon Mainnet',
  currency: 'MATIC',
  explorerUrl: 'https://polygonscan.com',
  rpcUrl: POLYGON_RPC
}

// 3. Create a metadata object
const metadata = {
  name: 'Blitz Brawler Arena',
  description: 'Trait-driven auto arena football battles',
  url: 'https://blitzbrawler.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// 4. Create Ethers config
const ethersConfig = defaultConfig({
  /*Required*/
  metadata,

  /*Optional*/
  enableCoinbase: true,
  rpcUrl: POLYGON_RPC,
  defaultChainId: POLYGON_CHAIN_ID
})

// 5. Create a Web3Modal instance
createWeb3Modal({
  ethersConfig,
  chains: [polygon],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#fbbf24',
    '--w3m-color-mix': '#0f172a',
    '--w3m-color-mix-strength': 40
  }
})

export default function Providers({ children }: { children: React.ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}
