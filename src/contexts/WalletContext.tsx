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
  isInitializing: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchToAddress: (newAddress: string) => void;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();
  const [address, setAddress] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize wallet state from localStorage on mount
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Check if we're in browser environment
        if (typeof window === 'undefined') {
          setHasInitialized(true);
          return;
        }

        // Check if there's a previously connected wallet in localStorage
        const savedWalletLabel = localStorage.getItem('connectedWallet');
        if (savedWalletLabel && !wallet && !connecting) {
          console.log('Attempting to reconnect to:', savedWalletLabel);
          await connect();
        }
      } catch (error) {
        console.error('Failed to reconnect wallet:', error);
        // Clear invalid saved state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('connectedWallet');
        }
      } finally {
        setHasInitialized(true);
      }
    };

    if (!hasInitialized) {
      initializeWallet();
    }
  }, [connect, wallet, connecting, hasInitialized]);

  // Update address and save wallet state
  useEffect(() => {
    const addr = wallet?.accounts?.[0]?.address || null;
    setAddress(addr);
    
    // Save wallet connection state to localStorage (browser only)
    if (typeof window !== 'undefined') {
      if (wallet?.label) {
        localStorage.setItem('connectedWallet', wallet.label);
        localStorage.setItem('connectedAddress', addr || '');
      } else {
        localStorage.removeItem('connectedWallet');
        localStorage.removeItem('connectedAddress');
      }
    }
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
      // Clear localStorage on disconnect (browser only)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('connectedWallet');
        localStorage.removeItem('connectedAddress');
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
    isInitializing: !hasInitialized,
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
