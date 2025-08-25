"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Avatar from "boring-avatars";
import Link from "next/link";
import { useWallet } from "@/contexts/WalletContext";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import styles from "./Header.module.css";

function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

export default function Header() {
  const { wallet, address } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const label = wallet?.label || "Wallet";

  const avatarSeed = useMemo(() => address || label, [address, label]);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setIsOpen(false);
    } catch {}
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const AVATAR_COLORS = ["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.row}>
          <Link href="/" className={styles.brand}>
            RBD
          </Link>
          <nav className={styles.nav}>
            <Link href="/donor">Donor</Link>
            <Link href="/blood-unit">Hospital Blood Donor Unit</Link>
            {/* <Link href="/research">Research</Link> */}
            <Link href="/admin">Admin</Link>
          </nav>
        </div>

        <div>
          {wallet ? (
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                className={`btn ${styles.avatarBtn}`}
                onClick={() => setIsOpen((v) => !v)}
              >
                <Avatar
                  name={avatarSeed}
                  variant="beam"
                  size={28}
                  square
                  colors={AVATAR_COLORS}
                />
                <span style={{ fontSize: 13 }}>
                  {shortenAddress(address || "")}
                </span>
              </button>

              {isOpen ? (
                <div className={styles.menu}>
                  <div className={styles.profileInfo}>
                    <Avatar
                      name={avatarSeed}
                      variant="beam"
                      size={36}
                      square
                      colors={AVATAR_COLORS}
                    />
                    <div className={styles.profileDetails}>
                      <div className={styles.profileName}>{label}</div>
                      <div className={styles.profileAddress}>
                        {shortenAddress(address || "", 6)}
                      </div>
                    </div>
                  </div>
                  <div className={styles.menuActions}>
                    <button className={styles.copyBtn} onClick={handleCopy}>
                      Copy Address
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <ConnectWalletButton />
          )}
        </div>
      </div>
    </header>
  );
}
