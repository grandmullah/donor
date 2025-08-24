"use client";

import { useWallet } from "@/contexts/WalletContext";
import styles from "./ConnectWalletButton.module.css";

export default function ConnectWalletButton() {
  const { wallet, connecting, isInitializing, connect, disconnect } = useWallet();

  const handleClick = async () => {
    if (wallet) {
      await disconnect();
      return;
    }
    await connect();
  };

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <button className={`${styles.button} ${styles.primary}`} disabled>
        Initializing...
      </button>
    );
  }

  return (
    <button
      className={`${styles.button} ${wallet ? styles.outline : styles.primary}`}
      onClick={handleClick}
      disabled={connecting}
    >
      {connecting ? "Connecting..." : wallet ? "Disconnect" : "Connect Wallet"}
    </button>
  );
}
