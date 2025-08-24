import { getPublicProvider, getContract } from "@/lib/eth";
import BloodDonorSystemABI from "@/lib/abis/BloodDonorSystem";
import DonorDAOGovernanceABI from "@/lib/abis/DonorDAOGovernance";
import BloodDonorTokenABI from "@/lib/abis/BloodDonorToken";

// Contract addresses (BSC Mainnet)
export const CONTRACT_ADDRESSES = {
      BLOOD_DONOR_SYSTEM: "0xa6EE1D8fc188A80028BffCCE5FeADE30135Bf2A9",
      DAO_GOVERNANCE: "0x803fE3F5665000E5E10C4AC5c6D97BeaeA41ed07",
      BDT_TOKEN: "0x54398ed787A8A9aeE136311a3e8b3f27a95643C9",
} as const;

export function getBloodDonorSystem() {
      const provider = getPublicProvider();
      return getContract(CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM, BloodDonorSystemABI, provider);
}

export function getDAOGovernance() {
      const provider = getPublicProvider();
      return getContract(CONTRACT_ADDRESSES.DAO_GOVERNANCE, DonorDAOGovernanceABI, provider);
}

export function getBDT() {
      const provider = getPublicProvider();
      return getContract(CONTRACT_ADDRESSES.BDT_TOKEN, BloodDonorTokenABI, provider);
}


