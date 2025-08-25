import { BrowserProvider, JsonRpcProvider, Contract, type ContractRunner, type Eip1193Provider, type InterfaceAbi } from "ethers";
// import { ENV } from "@/lib/env";

export function getPublicProvider() {
      return new JsonRpcProvider("https://bsc-dataseed1.binance.org/")   ;
}

export async function getBrowserProvider() {
      if (typeof window === "undefined") {
            throw new Error("No injected provider detected");
      }
      const w = window as unknown as { ethereum?: Eip1193Provider };
      if (!w.ethereum) {
            throw new Error("No injected provider detected");
      }
      return new BrowserProvider(w.ethereum);
}

export function getContract<T = Contract>(address: string, abi: InterfaceAbi, providerOrSigner: ContractRunner): T {
      // ethers v6 Contract is fully typed but we keep it simple here
      return new Contract(address, abi, providerOrSigner) as unknown as T;
}


