import { ethers } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";
import { RawMetadata } from "./characters";

export const POLYGON_CHAIN_ID = 137;
export const POLYGON_RPC =
  process.env.NEXT_PUBLIC_RPC_URL || "https://polygon-rpc.com";
export const NFT_CONTRACT =
  "0x7121d40fde5f2a82674262b8601decd9e066c936";

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "function walletOfOwner(address owner) view returns (uint256[])",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
];

declare global {
  interface Window {
    ethereum?: any;
  }
}

export type WalletSession = {
  address: string;
  chainId: number;
  provider: ethers.BrowserProvider;
  rawProvider: any;
  providerType: "injected" | "walletconnect";
};

export function getReadProvider() {
  return new ethers.JsonRpcProvider(POLYGON_RPC);
}

export async function switchNetwork(rawProvider: any) {
  if (!rawProvider) return;
  try {
    await rawProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ethers.toBeHex(POLYGON_CHAIN_ID) }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await rawProvider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: ethers.toBeHex(POLYGON_CHAIN_ID),
            chainName: "Polygon Mainnet",
            rpcUrls: [POLYGON_RPC],
            nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
            blockExplorerUrls: ["https://polygonscan.com/"],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

export async function connectWallet(preferWalletConnect?: boolean): Promise<WalletSession> {
  const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;
  const shouldUseWalletConnect = preferWalletConnect || !window.ethereum;

  let rawProvider: any;
  let providerType: "injected" | "walletconnect" = "injected";

  if (shouldUseWalletConnect) {
    if (!projectId) {
      throw new Error("Missing NEXT_PUBLIC_WC_PROJECT_ID for WalletConnect");
    }
    rawProvider = await EthereumProvider.init({
      projectId,
      chains: [POLYGON_CHAIN_ID],
      showQrModal: true,
      rpcMap: {
        [POLYGON_CHAIN_ID]: POLYGON_RPC,
      },
    });
    providerType = "walletconnect";
    await rawProvider.connect();
  } else {
    rawProvider = window.ethereum;
    if (!rawProvider) {
      throw new Error("No Ethereum wallet found. Please install MetaMask or use WalletConnect.");
    }
  }

  try {
    await rawProvider.request({ method: "eth_requestAccounts" });
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("Connection rejected by user.");
    }
    if (error.code === -32002) {
      throw new Error("Connection request already pending in your wallet.");
    }
    throw error;
  }

  const provider = new ethers.BrowserProvider(rawProvider, "any");
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  let network = await provider.getNetwork();

  if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
    try {
      await rawProvider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ethers.toBeHex(POLYGON_CHAIN_ID) }],
      });
      network = await provider.getNetwork();
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await rawProvider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ethers.toBeHex(POLYGON_CHAIN_ID),
                chainName: "Polygon Mainnet",
                rpcUrls: [POLYGON_RPC],
                nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                blockExplorerUrls: ["https://polygonscan.com/"],
              },
            ],
          });
          network = await provider.getNetwork();
        } catch (addError) {
          console.error("Failed to add Polygon network", addError);
        }
      }
    }
  }

  return {
    address,
    chainId: Number(network.chainId),
    provider,
    rawProvider,
    providerType,
  };
}

export async function disconnectWallet(rawProvider?: any) {
  if (!rawProvider) return;
  if (typeof rawProvider.disconnect === "function") {
    await rawProvider.disconnect();
  }
}

export function getContract(provider: ethers.Provider) {
  return new ethers.Contract(NFT_CONTRACT, ERC721_ABI, provider);
}

export function resolveIpfs(uri: string) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    const cleaned = uri.replace("ipfs://", "");
    const path = cleaned.startsWith("ipfs/") ? cleaned.slice(5) : cleaned;
    return `https://ipfs.io/ipfs/${path}`;
  }
  if (uri.includes("/ipfs/")) {
    const parts = uri.split("/ipfs/");
    const path = parts[parts.length - 1];
    return `https://ipfs.io/ipfs/${path}`;
  }
  return uri;
}

export async function fetchTokenMetadata(tokenUri: string) {
  const resolved = resolveIpfs(tokenUri);
  if (resolved.startsWith("data:application/json")) {
    const base64 = resolved.split(",")[1];
    const json = JSON.parse(atob(base64));
    return json;
  }
  const response = await fetch(resolved, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch metadata");
  }
  return response.json();
}

export function resolveImageUri(uri: string) {
  return resolveIpfs(uri);
}

export async function fetchOwnedTokenIds(provider: ethers.BrowserProvider, owner: string) {
  const contract = getContract(provider);
  try {
    const ids = await contract.walletOfOwner(owner);
    return ids.map((id: any) => id.toString());
  } catch (error) {
    try {
      const balance = await contract.balanceOf(owner);
      const total = Number(balance);
      const tokenIds: string[] = [];
      for (let i = 0; i < total; i += 1) {
        const tokenId = await contract.tokenOfOwnerByIndex(owner, i);
        tokenIds.push(tokenId.toString());
      }
      return tokenIds;
    } catch (innerError) {
      return scanTokensFromTransfers(owner);
    }
  }
}

async function getLogsAdaptive(params: {
  provider: ethers.Provider;
  address: string;
  topics: Array<string | Array<string> | null>;
  fromBlock: number;
  toBlock: number;
  onLogs: (logs: ethers.Log[]) => void;
}) {
  let chunk = 5000;
  const minChunk = 50;
  let from = params.fromBlock;

  while (from <= params.toBlock) {
    const to = Math.min(from + chunk - 1, params.toBlock);
    try {
      const logs = await params.provider.getLogs({
        address: params.address,
        fromBlock: from,
        toBlock: to,
        topics: params.topics,
      });
      params.onLogs(logs);
      from = to + 1;
    } catch (error: any) {
      if (error?.code === -32062 || String(error?.message).toLowerCase().includes("range is too large")) {
        const nextChunk = Math.max(minChunk, Math.floor(chunk / 2));
        if (nextChunk === chunk) {
          throw new Error("Log range too large even at minimum chunk size.");
        }
        chunk = nextChunk;
        continue;
      }
      throw error;
    }
  }
}

async function scanTokensFromTransfers(owner: string) {
  const readProvider = getReadProvider();
  const currentBlock = await readProvider.getBlockNumber();
  const startBlock = Number(process.env.NEXT_PUBLIC_NFT_START_BLOCK || 0);
  const owned = new Set<string>();
  const sent = new Set<string>();
  const iface = new ethers.Interface(ERC721_ABI);
  const transferEvent = iface.getEvent("Transfer");
  if (!transferEvent) return [];
  const transferTopic = transferEvent.topicHash;

  await getLogsAdaptive({
    provider: readProvider,
    address: NFT_CONTRACT,
    topics: [transferTopic],
    fromBlock: startBlock,
    toBlock: currentBlock,
    onLogs: (logs) => {
      logs.forEach((log) => {
        const parsed = iface.parseLog(log);
        if (!parsed) return;
        const fromAddress = String(parsed.args.from).toLowerCase();
        const toAddress = String(parsed.args.to).toLowerCase();
        const tokenId = String(parsed.args.tokenId);
        if (toAddress === owner.toLowerCase()) owned.add(tokenId);
        if (fromAddress === owner.toLowerCase()) sent.add(tokenId);
      });
    },
  });

  sent.forEach((tokenId) => owned.delete(tokenId));
  return Array.from(owned.values());
}

export async function fetchOwnedMetadata(provider: ethers.BrowserProvider, owner: string) {
  const contract = getContract(provider);
  const tokenIds = await fetchOwnedTokenIds(provider, owner);
  const settled = await Promise.allSettled(
    tokenIds.map(async (tokenId: string) => {
      const tokenUri = await contract.tokenURI(tokenId);
      const data = await fetchTokenMetadata(tokenUri);
      return { tokenId, data };
    })
  );
  const metadata = settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  );
  if (metadata.length === 0 && settled.length > 0) {
    const firstError = settled.find((result) => result.status === "rejected");
    if (firstError && firstError.status === "rejected") {
      throw firstError.reason;
    }
  }
  return metadata;
}

export async function fetchSampleTokenIds(limit: number) {
  const readProvider = getReadProvider();
  const contract = getContract(readProvider);
  try {
    const totalSupply = await contract.totalSupply();
    const total = Number(totalSupply);
    if (Number.isFinite(total) && total > 0) {
      const tokenIds: string[] = [];
      const count = Math.min(total, limit);
      try {
        for (let i = 0; i < count; i += 1) {
          const tokenId = await contract.tokenByIndex(i);
          tokenIds.push(tokenId.toString());
        }
        if (tokenIds.length >= count) return tokenIds;
      } catch (e) {
        tokenIds.length = 0;
        for (let i = 1; i <= count; i += 1) {
          tokenIds.push(i.toString());
        }
        return tokenIds;
      }
    }
  } catch (error) {
    // Fallback
  }
  return [];
}

export async function fetchSampleMetadata(limit: number) {
  const readProvider = getReadProvider();
  const contract = getContract(readProvider);
  const tokenIds = await fetchSampleTokenIds(limit);
  const results: { tokenId: string; data: RawMetadata }[] = [];

  for (const tokenId of tokenIds) {
    try {
      const tokenUri = await contract.tokenURI(tokenId);
      const data = await fetchTokenMetadata(tokenUri);
      results.push({ tokenId, data });
      if (results.length >= limit) break;
    } catch (error) {
      // Skip
    }
  }
  return results;
}
