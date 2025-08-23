"use client";

import { ReactNode } from "react";
import { Web3OnboardProvider } from "@web3-onboard/react";
import web3Onboard from "@/lib/web3Onboard";
import { WalletProvider } from "@/contexts/WalletContext";

type Props = {
  children: ReactNode;
};

export default function Web3Provider({ children }: Props) {
  return (
    <Web3OnboardProvider web3Onboard={web3Onboard}>
      <WalletProvider>{children}</WalletProvider>
    </Web3OnboardProvider>
  );
}
