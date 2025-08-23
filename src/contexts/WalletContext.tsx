"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useConnectWallet } from "@web3-onboard/react";

type Wallet = {
  label: string;
  accounts: Array<{ address: string }>;
} | null;

type WalletState = {
  wallet: Wallet;
  connecting: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchToAddress: (newAddress: string) => void;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const addr = wallet?.accounts?.[0]?.address || null;
    setAddress(addr);
  }, [wallet]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (wallet) {
        await disconnect(wallet);
      }
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const switchToAddress = (newAddress: string) => {
    console.log(`Switching wallet context from ${address} to ${newAddress}`);
    setAddress(newAddress);
  };

  const value: WalletState = {
    wallet,
    connecting,
    address,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchToAddress,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
