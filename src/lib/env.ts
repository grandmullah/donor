export const ENV = {
      // Public RPC used both client and server (BSC Mainnet)
      RPC_URL: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "https://bsc-dataseed1.binance.org/",
      // Addresses (set these in .env.local)
      BLOOD_DONOR_SYSTEM_ADDRESS: process.env.NEXT_PUBLIC_BLOOD_DONOR_SYSTEM_ADDRESS || "",
      DAO_GOVERNANCE_ADDRESS: process.env.NEXT_PUBLIC_DAO_GOVERNANCE_ADDRESS || "",
      BDT_ADDRESS: process.env.NEXT_PUBLIC_BDT_ADDRESS || "",
};

export function assertAddress(name: keyof typeof ENV): string {
      const value = ENV[name];
      if (!value) throw new Error(`${name} is not set`);
      return value;
}


