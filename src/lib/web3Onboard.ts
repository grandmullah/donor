import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
// Do not import WalletConnect at module top-level to avoid validating empty projectId at build time

const injected = injectedModule({
      filter: {
            // Exclude Phantom wallet by returning false for phantom-related checks
            phantom: false,
      },
      displayUnavailable: [
            "MetaMask",
            "Brave Wallet",
            "Trust Wallet",
            "WalletConnect",
      ],
});

// Base wallets: injected only for now (MetaMask, Brave, etc.)
// Note: Phantom wallet is explicitly excluded from the configuration
const wallets = [injected];

// BSC Mainnet configuration for deployed contracts
const chains = [
      {
            id: "0x38", // BSC Mainnet chain ID
            token: "BNB",
            label: "BSC Mainnet",
            rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "https://bsc-dataseed1.binance.org/",
      },
];

const appMetadata = {
      name: "Blood Donor",
      description: "Wallet connection base using Web3 Onboard",
};

const web3Onboard = Onboard({
      wallets,
      chains,
      appMetadata,
});

export default web3Onboard;

