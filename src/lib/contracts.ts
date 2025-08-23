import { getPublicProvider, getContract } from "@/lib/eth";
import { assertAddress } from "@/lib/env";
import BloodDonorSystemABI from "@/lib/abis/BloodDonorSystem";
import DonorDAOGovernanceABI from "@/lib/abis/DonorDAOGovernance";
import BloodDonorTokenABI from "@/lib/abis/BloodDonorToken";

export function getBloodDonorSystem() {
      const provider = getPublicProvider();
      return getContract(assertAddress("BLOOD_DONOR_SYSTEM_ADDRESS"), BloodDonorSystemABI, provider);
}

export function getDAOGovernance() {
      const provider = getPublicProvider();
      return getContract(assertAddress("DAO_GOVERNANCE_ADDRESS"), DonorDAOGovernanceABI, provider);
}

export function getBDT() {
      const provider = getPublicProvider();
      return getContract(assertAddress("BDT_ADDRESS"), BloodDonorTokenABI, provider);
}


