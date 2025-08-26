"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getBrowserProvider, getContract } from "@/lib/eth";
import DonorDAOGovernanceABI from "@/lib/abis/DonorDAOGovernance";
import BloodDonorSystemABI from "@/lib/abis/BloodDonorSystem";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { ethers } from "ethers";
import styles from "./page.module.css";

export default function AdminPage() {
  const { address, switchToAddress } = useWallet();

  // Helper function to format Wei values to human-readable token amounts
  const formatTokenAmount = (weiValue: string | bigint) => {
    try {
      const formatted = ethers.formatEther(weiValue);
      const number = parseFloat(formatted);
      // Round to 2 decimal places for display
      return number.toFixed(2);
    } catch (error) {
      console.error("Error formatting token amount:", error);
      return "0.00";
    }
  };

  // Function to test reward calculation for a specific donor
  const testRewardCalculation = async (donor: DonorInfo) => {
    try {
      const provider = await getBrowserProvider();
      const sys = getContract(
        CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
        BloodDonorSystemABI,
        provider
      );

      // Get current incentive parameters
      const gov = getContract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DonorDAOGovernanceABI,
        provider
      );

      const [
        baseReward,
        consistencyBonus,
        dataCompletenessBonus,
        feedbackBonus,
      ] = await gov.getIncentiveParameters();

      const bloodTypeMultiplier = await gov.getBloodTypeMultiplier(
        donor.bloodType
      );
      const tierMultiplier = await gov.getTierMultiplier(donor.donorTier);

      // Calculate expected reward
      let expectedReward = baseReward;
      expectedReward =
        (expectedReward * BigInt(bloodTypeMultiplier)) / BigInt(100);
      expectedReward = (expectedReward * BigInt(tierMultiplier)) / BigInt(100);

      // Add bonuses if applicable
      if (donor.consistencyScore >= 80) {
        expectedReward += consistencyBonus;
      }

      // Note: hasCompleteResearchProfile is not available in DonorInfo, so we skip that bonus

      const message = `
🔍 Reward Calculation Test for ${donor.bloodType} donor:
• Base Reward: ${formatTokenAmount(baseReward)} BDT
• Blood Type Multiplier: ${bloodTypeMultiplier}% (${donor.bloodType})
• Tier Multiplier: ${tierMultiplier}% (Tier ${donor.donorTier})
• Consistency Score: ${donor.consistencyScore}%
• Expected Reward: ${formatTokenAmount(expectedReward)} BDT
• Actual Earned: ${formatTokenAmount(donor.totalRewardsEarned)} BDT
• Difference: ${formatTokenAmount(
        expectedReward - BigInt(donor.totalRewardsEarned)
      )} BDT
      `;

      console.log(message);
      alert(message);
    } catch (error) {
      console.error("Error testing reward calculation:", error);
      alert(
        `Error testing reward calculation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Test contract connection and multipliers
  const testContractConnection = async () => {
    try {
      const provider = await getBrowserProvider();
      if (!provider) {
        alert("Please connect your wallet first");
        return;
      }

      const gov = getContract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DonorDAOGovernanceABI,
        provider
      );

      // Test getting incentive parameters
      const [
        baseReward,
        consistencyBonus,
        dataCompletenessBonus,
        feedbackBonus,
      ] = await gov.getIncentiveParameters();

      // Test getting blood type multipliers for all types
      const bloodTypes = ["O-", "AB-", "B-", "A-", "A+", "O+", "B+", "AB+"];
      const multiplierResults: Record<string, string> = {};

      for (const bloodType of bloodTypes) {
        try {
          const multiplier = await gov.getBloodTypeMultiplier(bloodType);
          multiplierResults[bloodType] = multiplier.toString();
        } catch (error) {
          multiplierResults[bloodType] = `Error: ${
            error instanceof Error ? error.message : "Unknown"
          }`;
        }
      }

      // Test getting tier multipliers
      const tierResults: Record<string, string> = {};
      for (let tier = 0; tier <= 4; tier++) {
        try {
          const multiplier = await gov.getTierMultiplier(tier);
          tierResults[tier] = multiplier.toString();
        } catch (error) {
          tierResults[tier] = `Error: ${
            error instanceof Error ? error.message : "Unknown"
          }`;
        }
      }

      const message = `
🔍 Contract Connection Test Results:

📊 Incentive Parameters:
• Base Reward: ${formatTokenAmount(baseReward)} BDT
• Consistency Bonus: ${formatTokenAmount(consistencyBonus)} BDT
• Data Completeness Bonus: ${formatTokenAmount(dataCompletenessBonus)} BDT
• Feedback Bonus: ${formatTokenAmount(feedbackBonus)} BDT

🩸 Blood Type Multipliers:
${Object.entries(multiplierResults)
  .map(([type, mult]) => `• ${type}: ${mult}`)
  .join("\n")}

🏆 Tier Multipliers:
${Object.entries(tierResults)
  .map(([tier, mult]) => `• Tier ${tier}: ${mult}%`)
  .join("\n")}

💡 Analysis:
${
  Object.entries(multiplierResults).some(([_, mult]) => mult === "0")
    ? "❌ Some blood types have 0 multipliers - this will cause 0 rewards!"
    : "✅ All blood types have proper multipliers"
}
      `;

      console.log(message);
      alert(message);
    } catch (error) {
      console.error("Error testing contract connection:", error);
      alert(
        `Error testing contract connection: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Update all blood type multipliers to ensure proper rewards
  const updateAllBloodTypeMultipliers = async () => {
    try {
      const provider = await getBrowserProvider();
      if (!provider) {
        alert("Please connect your wallet first");
        return;
      }

      const gov = getContract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DonorDAOGovernanceABI,
        provider
      );

      // Define all blood type multipliers (ensuring users get 150-250 BDT rewards)
      const bloodTypeMultipliers = {
        "O-": 230, // Universal donor - highest multiplier (230 BDT)
        "AB-": 250, // Rarest blood type (250 BDT)
        "B-": 200, // Rare blood type (200 BDT)
        "A-": 150, // Uncommon blood type (150 BDT)
        "A+": 120, // Common but in demand (120 BDT)
        "O+": 130, // Most common, but universal donor (130 BDT)
        "B+": 140, // Common (140 BDT)
        "AB+": 100, // Common, but not universal (100 BDT)
      };

      let successCount = 0;
      let errorCount = 0;
      const results: string[] = [];

      // Update each blood type multiplier
      for (const [bloodType, multiplier] of Object.entries(
        bloodTypeMultipliers
      )) {
        try {
          const tx = await gov.setBloodTypeMultiplier(bloodType, multiplier);
          await tx.wait();
          results.push(`✅ ${bloodType}: ${multiplier}% (${multiplier} BDT)`);
          successCount++;
        } catch (error) {
          results.push(
            `❌ ${bloodType}: Error - ${
              error instanceof Error ? error.message : "Unknown"
            }`
          );
          errorCount++;
        }
      }

      const message = `
🚀 Blood Type Multipliers Update Complete!

📊 Results:
${results.join("\n")}

📈 Summary:
• Successfully updated: ${successCount} blood types
• Failed to update: ${errorCount} blood types
• Total blood types: ${Object.keys(bloodTypeMultipliers).length}

💡 Expected Rewards:
• O-: 230 BDT (Universal donor)
• AB-: 250 BDT (Rarest)
• B-: 200 BDT (Rare)
• A-: 150 BDT (Uncommon)
• A+: 120 BDT (Common)
• O+: 130 BDT (Common)
• B+: 140 BDT (Common)
• AB+: 100 BDT (Common)

🎯 Now donors should receive proper rewards between 100-250 BDT!
      `;

      console.log(message);
      alert(message);
    } catch (error) {
      console.error("Error updating blood type multipliers:", error);
      alert(
        `Error updating blood type multipliers: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Test reward calculation for all blood types to verify they work
  const testRewardCalculationForAllTypes = async () => {
    try {
      const provider = await getBrowserProvider();
      if (!provider) {
        alert("Please connect your wallet first");
        return;
      }

      const gov = getContract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DonorDAOGovernanceABI,
        provider
      );

      // Get base parameters
      const [baseReward, consistencyBonus] = await gov.getIncentiveParameters();

      // Test all blood types with tier 1 (110% multiplier)
      const bloodTypes = ["O-", "AB-", "B-", "A-", "A+", "O+", "B+", "AB+"];
      const testResults: string[] = [];

      for (const bloodType of bloodTypes) {
        try {
          const bloodTypeMultiplier = await gov.getBloodTypeMultiplier(
            bloodType
          );
          const tierMultiplier = 110; // Tier 1 (Bronze)

          // Calculate expected reward: baseReward * bloodTypeMultiplier / 100 * tierMultiplier / 100
          let expectedReward = baseReward;
          expectedReward =
            (expectedReward * BigInt(bloodTypeMultiplier)) / BigInt(100);
          expectedReward =
            (expectedReward * BigInt(tierMultiplier)) / BigInt(100);

          // Add consistency bonus if applicable (assuming 80%+ consistency)
          if (bloodTypeMultiplier > 0) {
            // Only add bonus if multiplier is set
            expectedReward += consistencyBonus;
          }

          const rewardInTokens = formatTokenAmount(expectedReward);
          const status = bloodTypeMultiplier > 0 ? "✅" : "❌";

          testResults.push(
            `${status} ${bloodType}: ${bloodTypeMultiplier}% → ${rewardInTokens} BDT`
          );
        } catch (error) {
          testResults.push(
            `❌ ${bloodType}: Error - ${
              error instanceof Error ? error.message : "Unknown"
            }`
          );
        }
      }

      const message = `
🧪 Reward Calculation Test Results

📊 Test Parameters:
• Base Reward: ${formatTokenAmount(baseReward)} BDT
• Tier: 1 (Bronze - 110% multiplier)
• Consistency Bonus: ${formatTokenAmount(consistencyBonus)} BDT (if score ≥80%)

🩸 Blood Type Reward Calculations:
${testResults.join("\n")}

💡 Analysis:
${
  testResults.some((result) => result.includes("❌"))
    ? "❌ Some blood types have issues - check multipliers!"
    : "✅ All blood types are working correctly!"
}

🎯 Expected Reward Range: 100-250 BDT per donation
      `;

      console.log(message);
      alert(message);
    } catch (error) {
      console.error("Error testing reward calculation for all types:", error);
      alert(
        `Error testing reward calculation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Institution Management
  const [inst, setInst] = useState("");
  const [removeInst, setRemoveInst] = useState("");

  // Tier Management
  const [tier, setTier] = useState("1");
  const [threshold, setThreshold] = useState("5");
  const [tierMult, setTierMult] = useState("1");
  const [tierMultiplier, setTierMultiplier] = useState("100");

  // Blood Type Management
  const [bloodType, setBloodType] = useState("O-");
  const [bloodTypeMultiplier, setBloodTypeMultiplier] = useState("230");

  // Blood type multiplier mapping
  const bloodTypeMultipliers: Record<string, string> = {
    "O-": "230", // Universal donor - highest multiplier
    "AB-": "250", // Rarest blood type
    "B-": "200", // Rare blood type
    "A-": "150", // Uncommon blood type
  };

  // Update multiplier when blood type changes
  const handleBloodTypeChange = (newBloodType: string) => {
    setBloodType(newBloodType);
    setBloodTypeMultiplier(bloodTypeMultipliers[newBloodType] || "150");
  };

  // Incentive Parameters
  const [baseReward, setBaseReward] = useState("100");
  const [consistencyBonus, setConsistencyBonus] = useState("50");
  const [dataCompletenessBonus, setDataCompletenessBonus] = useState("25");
  const [feedbackBonus, setFeedbackBonus] = useState("10");

  // Role Management
  const [roleAddress, setRoleAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState("BLOOD_UNIT_ROLE");

  // System Info
  const [systemInfo, setSystemInfo] = useState({
    baseReward: "0",
    consistencyBonus: "0",
    dataCompletenessBonus: "0",
    postDonationFeedbackBonus: "0",
  });

  // Donor List
  type DonorInfo = {
    anonymousId: string;
    bloodType: string;
    donationCount: number;
    donorTier: number;
    consistencyScore: number;
    isRegistered: boolean;
    totalRewardsEarned: string;
    rewardsRedeemed: string;
    firstDonationDate: number;
    lastDonationDate: number;
  };

  const [donors, setDonors] = useState<DonorInfo[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(false);
  const [donorCount, setDonorCount] = useState(0);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [donorsPerPage] = useState(10);

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Load system information and check admin status on mount
  useEffect(() => {
    if (address) {
      checkAdminStatus();
      loadSystemInfo();
    } else {
      setIsAdmin(false);
      setCheckingAdmin(false);
    }
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load donors when admin access is confirmed
  useEffect(() => {
    if (isAdmin && !checkingAdmin) {
      loadDonors();
    }
  }, [isAdmin, checkingAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAdminStatus = async () => {
    if (!address) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    // Known admin wallet address
    const KNOWN_ADMIN_WALLET = "0xFB42A0d228609942ccd685E0D9ceF1825F26Cb78";

    // Quick check for known admin wallet
    if (address.toLowerCase() === KNOWN_ADMIN_WALLET.toLowerCase()) {
      console.log("✅ Recognized admin wallet, granting access");
      setIsAdmin(true);
      setStatus("✅ Admin wallet recognized - Access granted!");
      setCheckingAdmin(false);
      return;
    }

    if (
      !CONTRACT_ADDRESSES.DAO_GOVERNANCE ||
      !CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM
    ) {
      console.error("Contract addresses not configured");
      setStatus(
        "Contract addresses not configured. Please check contracts.ts file."
      );
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    setCheckingAdmin(true);
    console.log("Checking admin status for address:", address);
    console.log("DAO Governance Address:", CONTRACT_ADDRESSES.DAO_GOVERNANCE);
    console.log(
      "Blood Donor System Address:",
      CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM
    );

    try {
      const provider = await getBrowserProvider();
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.chainId.toString());

      // Verify we're on BSC Mainnet
      if (network.chainId.toString() !== "56") {
        setStatus(
          `⚠️ Wrong network! Please switch to BSC Mainnet (Chain ID: 56). Current: ${network.chainId}`
        );
        setIsAdmin(false);
        return;
      }

      // Test basic contract connectivity first
      const govCode = await provider.getCode(CONTRACT_ADDRESSES.DAO_GOVERNANCE);
      const sysCode = await provider.getCode(
        CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM
      );

      console.log("Governance contract code exists:", govCode !== "0x");
      console.log("System contract code exists:", sysCode !== "0x");

      if (govCode === "0x" && sysCode === "0x") {
        setStatus(
          "⚠️ No contracts found at specified addresses. Please verify contract deployment."
        );
        setIsAdmin(false);
        return;
      }

      // Standard OpenZeppelin DEFAULT_ADMIN_ROLE
      const DEFAULT_ADMIN_ROLE =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      console.log("Using DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);

      let hasAdminRoleGov = false;
      let hasAdminRoleSys = false;
      let govError = null;
      let sysError = null;

      // Try Governance contract
      if (govCode !== "0x") {
        try {
          const gov = getContract(
            CONTRACT_ADDRESSES.DAO_GOVERNANCE,
            DonorDAOGovernanceABI,
            provider
          );
          hasAdminRoleGov = await gov.hasRole(DEFAULT_ADMIN_ROLE, address);
          console.log(
            "Has admin role on Governance contract:",
            hasAdminRoleGov
          );
        } catch (error) {
          govError = error;
          console.error("Error checking Governance contract:", error);
        }
      }

      // Try System contract
      if (sysCode !== "0x") {
        try {
          const sys = getContract(
            CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
            BloodDonorSystemABI,
            provider
          );
          hasAdminRoleSys = await sys.hasRole(DEFAULT_ADMIN_ROLE, address);
          console.log("Has admin role on System contract:", hasAdminRoleSys);
        } catch (error) {
          sysError = error;
          console.error("Error checking System contract:", error);
        }
      }

      // User is admin if they have admin role on either contract
      const isAdminUser = hasAdminRoleGov || hasAdminRoleSys;
      console.log("Final admin status:", isAdminUser);

      setIsAdmin(isAdminUser);

      if (isAdminUser) {
        setStatus("Admin access verified successfully! 🎉");
      } else if (govError && sysError) {
        setStatus(
          `⚠️ Could not verify admin status on either contract. Governance error: ${
            govError instanceof Error ? govError.message : "Unknown"
          }. System error: ${
            sysError instanceof Error ? sysError.message : "Unknown"
          }.`
        );
      } else if (govError || sysError) {
        const error = govError || sysError;
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        setStatus(
          `⚠️ Partial check completed. One contract failed: ${errorMsg}. Admin status: ${
            isAdminUser ? "GRANTED" : "DENIED"
          }.`
        );
      } else {
        setStatus("❌ No admin privileges found on any contracts.");
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setStatus(
        `Error checking admin status: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsAdmin(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  // Helper function to validate wallet connection and get signer
  const getValidatedSigner = async () => {
    // Check if wallet is connected
    if (!address) {
      setStatus("Please connect your wallet first");
      return null;
    }

    try {
      setStatus("Connecting to wallet...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();

      // Get the actual signer address
      const signerAddress = await signer.getAddress();

      // If addresses don't match, update to match the actual connected wallet
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        console.log(
          `Wallet address mismatch detected. Context: ${address}, Actual: ${signerAddress}`
        );
        setStatus(
          `🔄 Switching to connected wallet: ${signerAddress.slice(
            0,
            6
          )}...${signerAddress.slice(-4)}`
        );

        // Switch the wallet context to the actual connected wallet
        switchToAddress(signerAddress);

        // Wait a moment for context to update, then proceed
        setTimeout(() => {
          setStatus("Wallet switched successfully! Please try again.");
        }, 500);
        return null;
      }

      console.log("Requesting signature from wallet:", signerAddress);
      setStatus("Requesting signature from your wallet...");
      return signer;
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setStatus("❌ Failed to connect to wallet");
      return null;
    }
  };

  const loadSystemInfo = async () => {
    if (!CONTRACT_ADDRESSES.DAO_GOVERNANCE) return;

    try {
      const provider = await getBrowserProvider();
      const gov = getContract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DonorDAOGovernanceABI,
        provider
      );

      const incentiveParams = await gov.getIncentiveParameters();
      setSystemInfo({
        baseReward: incentiveParams[0].toString(),
        consistencyBonus: incentiveParams[1].toString(),
        dataCompletenessBonus: incentiveParams[2].toString(),
        postDonationFeedbackBonus: incentiveParams[3].toString(),
      });
    } catch (error) {
      console.error("Failed to load system info:", error);
    }
  };

  // Filter and search donors
  const filteredDonors = useMemo(() => {
    let filtered = donors;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (donor) =>
          donor.anonymousId.toLowerCase().includes(term) ||
          donor.bloodType.toLowerCase().includes(term)
      );
    }

    // Blood type filter
    if (bloodTypeFilter !== "all") {
      filtered = filtered.filter(
        (donor) => donor.bloodType === bloodTypeFilter
      );
    }

    // Tier filter
    if (tierFilter !== "all") {
      filtered = filtered.filter(
        (donor) => donor.donorTier.toString() === tierFilter
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((donor) => donor.isRegistered === isActive);
    }

    return filtered;
  }, [donors, searchTerm, bloodTypeFilter, tierFilter, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDonors.length / donorsPerPage);
  const startIndex = (currentPage - 1) * donorsPerPage;
  const paginatedDonors = filteredDonors.slice(
    startIndex,
    startIndex + donorsPerPage
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, bloodTypeFilter, tierFilter, statusFilter]);

  const loadDonors = async () => {
    if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM) return;

    setLoadingDonors(true);
    try {
      const provider = await getBrowserProvider();
      const sys = getContract(
        CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
        BloodDonorSystemABI,
        provider
      );

      // Get DonorRegistered events from the beginning of the contract
      const filter = sys.filters.DonorRegistered();
      const events = await sys.queryFilter(filter, 0, "latest");

      console.log(`Found ${events.length} donor registration events`);
      setDonorCount(events.length);

      // Extract unique anonymous IDs from events
      const uniqueAnonymousIds = new Set<string>();
      events.forEach((event) => {
        // Type guard to check if it's an EventLog with args
        if ("args" in event && event.args && event.args.anonymousId) {
          uniqueAnonymousIds.add(event.args.anonymousId);
        }
      });

      // Fetch detailed information for each donor
      const donorInfoPromises = Array.from(uniqueAnonymousIds).map(
        async (anonymousId) => {
          try {
            const donorData = await sys.donors(anonymousId);
            // FIXED: Correct mapping based on actual contract Donor struct
            // Contract Donor struct order: [anonymousId, name, email, phoneNumber, passwordHash, bloodType, donationCount, firstDonationDate, lastDonationDate, consistencyScore, donorTier, hasCompleteResearchProfile, isRegistered, totalRewardsEarned, rewardsRedeemed, salt]
            return {
              anonymousId,
              bloodType: donorData[5] || "Unknown", // bloodType is at index 5
              donationCount: Number(donorData[6]) || 0, // donationCount is at index 6
              donorTier: Number(donorData[10]) || 0, // donorTier is at index 10
              consistencyScore: Number(donorData[9]) || 0, // consistencyScore is at index 9
              isRegistered: donorData[12] || false, // isRegistered is at index 12
              totalRewardsEarned: donorData[13].toString(), // totalRewardsEarned is at index 13
              rewardsRedeemed: donorData[14].toString(), // rewardsRedeemed is at index 14
              firstDonationDate: Number(donorData[7]) || 0, // firstDonationDate is at index 7
              lastDonationDate: Number(donorData[8]) || 0, // lastDonationDate is at index 8
            };
          } catch (error) {
            console.error(`Failed to load donor ${anonymousId}:`, error);
            return null;
          }
        }
      );

      const donorInfoResults = await Promise.all(donorInfoPromises);
      const validDonors = donorInfoResults.filter(
        (donor): donor is DonorInfo => donor !== null
      );

      // Sort by donation count (highest first)
      validDonors.sort((a, b) => b.donationCount - a.donationCount);

      setDonors(validDonors);
      console.log(`Loaded ${validDonors.length} donors`);
    } catch (error) {
      console.error("Failed to load donors:", error);
      setStatus(
        `Failed to load donors: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoadingDonors(false);
    }
  };

  const addInstitution = async () => {
    if (!CONTRACT_ADDRESSES.DAO_GOVERNANCE) {
      setStatus("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      const signer = await getValidatedSigner();
      if (!signer) return;
      const gov = getContract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DonorDAOGovernanceABI,
        signer
      );
      const tx = await gov.addResearchInstitution(inst);
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Research institution added successfully! 🎉");
      setInst("");
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Failed to add institution");
    } finally {
      setLoading(false);
    }
  };

  const removeInstitution = async () => {
    if (!CONTRACT_ADDRESSES.DAO_GOVERNANCE) {
      setStatus("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const gov = getContract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DonorDAOGovernanceABI,
        signer
      );
      const tx = await gov.removeResearchInstitution(removeInst);
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Research institution removed successfully! 🎉");
      setRemoveInst("");
    } catch (e: unknown) {
      setStatus(
        e instanceof Error ? e.message : "Failed to remove institution"
      );
    } finally {
      setLoading(false);
    }
  };

  const setTierThreshold = async () => {
    if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM) {
      setStatus("Blood donor system not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const sys = getContract(
        CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
        BloodDonorSystemABI,
        signer
      );
      const tx = await sys.updateTierThreshold(BigInt(tier), BigInt(threshold));
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Tier threshold updated successfully! 🎉");
    } catch (e: unknown) {
      setStatus(e instanceof Error ? e.message : "Failed to update threshold");
    } finally {
      setLoading(false);
    }
  };

  const updateTierMultiplier = async () => {
    if (!CONTRACT_ADDRESSES.DAO_GOVERNANCE) {
      setStatus("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const gov = getContract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DonorDAOGovernanceABI,
        signer
      );
      const tx = await gov.setTierMultiplier(
        BigInt(tierMult),
        BigInt(tierMultiplier)
      );
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Tier multiplier updated successfully! 🎉");
    } catch (e: unknown) {
      setStatus(
        e instanceof Error ? e.message : "Failed to update tier multiplier"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateBloodTypeMultiplier = async () => {
    if (!CONTRACT_ADDRESSES.DAO_GOVERNANCE) {
      setStatus("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const gov = getContract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DonorDAOGovernanceABI,
        signer
      );
      const tx = await gov.setBloodTypeMultiplier(
        bloodType,
        BigInt(bloodTypeMultiplier)
      );
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Blood type multiplier updated successfully! 🎉");
    } catch (e: unknown) {
      setStatus(
        e instanceof Error
          ? e.message
          : "Failed to update blood type multiplier"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateIncentiveParameters = async () => {
    if (!CONTRACT_ADDRESSES.DAO_GOVERNANCE) {
      setStatus("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const gov = getContract(
        CONTRACT_ADDRESSES.DAO_GOVERNANCE,
        DonorDAOGovernanceABI,
        signer
      );
      const tx = await gov.setIncentiveParameters(
        BigInt(baseReward),
        BigInt(consistencyBonus),
        BigInt(dataCompletenessBonus),
        BigInt(feedbackBonus)
      );
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Incentive parameters updated successfully! 🎉");
      loadSystemInfo(); // Reload system info
    } catch (e: unknown) {
      setStatus(
        e instanceof Error ? e.message : "Failed to update incentive parameters"
      );
    } finally {
      setLoading(false);
    }
  };

  const grantRole = async () => {
    if (!roleAddress || !selectedRole) {
      setStatus("Please provide both address and role");
      return;
    }

    // Validate address format
    if (!roleAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setStatus(
        "Invalid address format. Please provide a valid Ethereum address."
      );
      return;
    }

    setLoading(true);
    try {
      const signer = await getValidatedSigner();
      if (!signer) return;

      // Role definitions with their hashes
      const roleDefinitions = {
        BLOOD_UNIT_ROLE: {
          hash: "0x7795041f4657df87af70bd1315911da973ec3e777f97ec78f04c191a56a02a95",
          contract: "BloodDonorSystem",
          description: "Blood Unit Operations",
        },
        VERIFIED_RESEARCHER: {
          hash: "0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357",
          contract: "BloodDonorSystem",
          description: "Research Data Access",
        },
        DEFAULT_ADMIN_ROLE: {
          hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
          contract: "both",
          description: "Full Admin Access",
        },
      };

      const roleInfo =
        roleDefinitions[selectedRole as keyof typeof roleDefinitions];
      if (!roleInfo) {
        setStatus("Invalid role selected");
        return;
      }

      let tx;
      const roleHash = roleInfo.hash;

      // Determine which contract to use
      if (
        roleInfo.contract === "BloodDonorSystem" ||
        roleInfo.contract === "both"
      ) {
        if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM) {
          setStatus("BloodDonorSystem contract not configured");
          return;
        }

        const sys = getContract(
          CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
          BloodDonorSystemABI,
          signer
        );

        // Check if address already has the role
        const hasRole = await sys.hasRole(roleHash, roleAddress);
        if (hasRole) {
          setStatus(`Address already has ${selectedRole} on BloodDonorSystem`);
          return;
        }

        setStatus(`Granting ${selectedRole} on BloodDonorSystem...`);
        tx = await sys.grantRole(roleHash, roleAddress);
      } else if (roleInfo.contract === "DonorDAOGovernance") {
        if (!CONTRACT_ADDRESSES.DAO_GOVERNANCE) {
          setStatus("DonorDAOGovernance contract not configured");
          return;
        }

        const gov = getContract(
          CONTRACT_ADDRESSES.DAO_GOVERNANCE,
          DonorDAOGovernanceABI,
          signer
        );

        // Check if address already has the role
        const hasRole = await gov.hasRole(roleHash, roleAddress);
        if (hasRole) {
          setStatus(
            `Address already has ${selectedRole} on DonorDAOGovernance`
          );
          return;
        }

        setStatus(`Granting ${selectedRole} on DonorDAOGovernance...`);
        tx = await gov.grantRole(roleHash, roleAddress);
      }

      if (tx) {
        setStatus("Waiting for confirmation...");
        const receipt = await tx.wait();
        setStatus(
          `✅ ${selectedRole} granted successfully to ${roleAddress}! 🎉`
        );

        // Clear form
        setRoleAddress("");

        console.log("Role granted:", {
          role: selectedRole,
          address: roleAddress,
          txHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
        });
      }
    } catch (e: unknown) {
      console.error("Error granting role:", e);
      let errorMessage = "Failed to grant role";

      if (e instanceof Error) {
        if (e.message.includes("AccessControl")) {
          errorMessage =
            "Access denied: You don't have permission to grant this role";
        } else if (e.message.includes("insufficient funds")) {
          errorMessage = "Insufficient BNB for gas fees";
        } else {
          errorMessage = e.message;
        }
      }

      setStatus(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const revokeRole = async () => {
    if (!roleAddress || !selectedRole) {
      setStatus("Please provide both address and role");
      return;
    }

    // Validate address format
    if (!roleAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setStatus(
        "Invalid address format. Please provide a valid Ethereum address."
      );
      return;
    }

    setLoading(true);
    try {
      const signer = await getValidatedSigner();
      if (!signer) return;

      // Role definitions with their hashes
      const roleDefinitions = {
        BLOOD_UNIT_ROLE: {
          hash: "0x7795041f4657df87af70bd1315911da973ec3e777f97ec78f04c191a56a02a95",
          contract: "BloodDonorSystem",
          description: "Blood Unit Operations",
        },
        VERIFIED_RESEARCHER: {
          hash: "0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357",
          contract: "BloodDonorSystem",
          description: "Research Data Access",
        },
        DEFAULT_ADMIN_ROLE: {
          hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
          contract: "both",
          description: "Full Admin Access",
        },
      };

      const roleInfo =
        roleDefinitions[selectedRole as keyof typeof roleDefinitions];
      if (!roleInfo) {
        setStatus("Invalid role selected");
        return;
      }

      let tx;
      const roleHash = roleInfo.hash;

      // Determine which contract to use
      if (
        roleInfo.contract === "BloodDonorSystem" ||
        roleInfo.contract === "both"
      ) {
        if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM) {
          setStatus("BloodDonorSystem contract not configured");
          return;
        }

        const sys = getContract(
          CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
          BloodDonorSystemABI,
          signer
        );

        // Check if address has the role
        const hasRole = await sys.hasRole(roleHash, roleAddress);
        if (!hasRole) {
          setStatus(`Address doesn't have ${selectedRole} on BloodDonorSystem`);
          return;
        }

        setStatus(`Revoking ${selectedRole} on BloodDonorSystem...`);
        tx = await sys.revokeRole(roleHash, roleAddress);
      } else if (roleInfo.contract === "DonorDAOGovernance") {
        if (!CONTRACT_ADDRESSES.DAO_GOVERNANCE) {
          setStatus("DonorDAOGovernance contract not configured");
          return;
        }

        const gov = getContract(
          CONTRACT_ADDRESSES.DAO_GOVERNANCE,
          DonorDAOGovernanceABI,
          signer
        );

        // Check if address has the role
        const hasRole = await gov.hasRole(roleHash, roleAddress);
        if (!hasRole) {
          setStatus(
            `Address doesn't have ${selectedRole} on DonorDAOGovernance`
          );
          return;
        }

        setStatus(`Revoking ${selectedRole} on DonorDAOGovernance...`);
        tx = await gov.revokeRole(roleHash, roleAddress);
      }

      if (tx) {
        setStatus("Waiting for confirmation...");
        const receipt = await tx.wait();
        setStatus(
          `✅ ${selectedRole} revoked successfully from ${roleAddress}! 🎉`
        );

        // Clear form
        setRoleAddress("");

        console.log("Role revoked:", {
          role: selectedRole,
          address: roleAddress,
          txHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
        });
      }
    } catch (e: unknown) {
      console.error("Error revoking role:", e);
      let errorMessage = "Failed to revoke role";

      if (e instanceof Error) {
        if (e.message.includes("AccessControl")) {
          errorMessage =
            "Access denied: You don't have permission to revoke this role";
        } else if (e.message.includes("insufficient funds")) {
          errorMessage = "Insufficient BNB for gas fees";
        } else {
          errorMessage = e.message;
        }
      }

      setStatus(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Admin Portal</h1>
        <p className={styles.subtitle}>
          configure system parameters, and oversee platform governance
        </p>
      </div>

      {!address ? (
        <div className={styles.connectWrapper}>
          <div className={styles.connectMessage}>
            <h3>Connect Your Wallet</h3>
            <p>
              Please connect your wallet using the button in the header to
              access the admin portal.
            </p>
          </div>
        </div>
      ) : checkingAdmin ? (
        <div className={styles.connectWrapper}>
          <div className={styles.connectMessage}>
            <h3>Verifying Admin Access...</h3>
            <p>Checking your admin permissions...</p>
          </div>
        </div>
      ) : !isAdmin ? (
        <div className={styles.connectWrapper}>
          <div className={styles.connectMessage}>
            <h3>🚫 Access Denied</h3>
            <p>
              You do not have administrator privileges to access this portal.
              Only users with admin roles can manage the Blood Donor System.
            </p>
            <div
              style={{
                margin: "1rem 0",
                padding: "1rem",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "0.9rem",
              }}
            >
              <strong>Debug Info:</strong>
              <br />
              Connected Address: {address}
              <br />
              DAO Contract: {CONTRACT_ADDRESSES.DAO_GOVERNANCE}
              <br />
              System Contract: {CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM}
              <br />
              Status: {status}
            </div>
            <div className={styles.actionButtons}>
              <button
                className={styles.button}
                onClick={() => window.history.back()}
              >
                Go Back
              </button>
              <button
                className={styles.button}
                onClick={() => (window.location.href = "/")}
              >
                Return Home
              </button>
              <button
                className={styles.button}
                onClick={checkAdminStatus}
                disabled={checkingAdmin}
              >
                {checkingAdmin ? "Checking..." : "Retry Admin Check"}
              </button>
              <button
                className={styles.button}
                onClick={() => {
                  setIsAdmin(true);
                  setStatus("⚠️ TEMPORARY BYPASS ENABLED - For testing only!");
                }}
                style={{ backgroundColor: "#dc2626" }}
              >
                🚨 Bypass for Testing
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.stack}>
          {/* Admin Status Indicator */}
          <div className={styles.card}>
            <div className={styles.adminStatus}>
              <span className={styles.adminBadge}>
                ✅ Admin Access Verified
              </span>
              <span className={styles.adminAddress}>
                Connected as: {address}
              </span>
            </div>
          </div>

          {/* System Overview */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📊</span>
              Current System Parameters
            </h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {systemInfo.baseReward}
                  </span>
                  <span className={styles.statLabel}>Base Reward</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔄</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {systemInfo.consistencyBonus}
                  </span>
                  <span className={styles.statLabel}>Consistency Bonus</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📋</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {systemInfo.dataCompletenessBonus}
                  </span>
                  <span className={styles.statLabel}>Data Completeness</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💬</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {systemInfo.postDonationFeedbackBonus}
                  </span>
                  <span className={styles.statLabel}>Feedback Bonus</span>
                </div>
              </div>
            </div>
          </div>

          {/* Donor Management */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>👥</span>
              Registered Donors
            </h2>
            <p className={styles.description}>
              View and manage all registered donors in the system. Monitor
              donation activity, reward earnings, and tier progression.
            </p>

            {/* Donor Statistics */}
            <div className={styles.statsGrid} style={{ marginBottom: "2rem" }}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>{donorCount}</span>
                  <span className={styles.statLabel}>Total Registrations</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {donors.filter((d) => d.isRegistered).length}
                  </span>
                  <span className={styles.statLabel}>Active Donors</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🩸</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {donors.reduce((sum, d) => sum + d.donationCount, 0)}
                  </span>
                  <span className={styles.statLabel}>Total Donations</span>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🏆</div>
                <div className={styles.statInfo}>
                  <span className={styles.statValue}>
                    {donors.filter((d) => d.donorTier >= 3).length}
                  </span>
                  <span className={styles.statLabel}>Gold+ Tier Donors</span>
                </div>
              </div>
            </div>

            {/* Donor Controls */}
            <div className={styles.donorControls}>
              <input
                type="text"
                placeholder="Search by Anonymous ID or Blood Type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />

              <select
                value={bloodTypeFilter}
                onChange={(e) => setBloodTypeFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Blood Types</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Tiers</option>
                <option value="0">None</option>
                <option value="1">Bronze</option>
                <option value="2">Silver</option>
                <option value="3">Gold</option>
                <option value="4">Platinum</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                className={`${styles.primaryButton} ${
                  loadingDonors ? styles.loading : ""
                }`}
                onClick={loadDonors}
                disabled={loadingDonors}
              >
                {loadingDonors ? "Loading..." : "Refresh"}
              </button>
            </div>

            {/* Filter Results Info */}
            {donors.length > 0 && (
              <div className={styles.donorStats}>
                <span>
                  Showing {paginatedDonors.length} of {filteredDonors.length}{" "}
                  donors
                  {filteredDonors.length !== donors.length &&
                    ` (filtered from ${donors.length} total)`}
                </span>
              </div>
            )}

            {/* Donors Table */}
            {loadingDonors ? (
              <div className={styles.loadingMessage}>
                <p>Loading donor information...</p>
              </div>
            ) : donors.length > 0 ? (
              <div className={styles.tableWrapper}>
                <table className={styles.donorTable}>
                  <thead>
                    <tr>
                      <th>Anonymous ID</th>
                      <th>Blood Type</th>
                      <th>Donations</th>
                      <th>Tier</th>
                      <th>Consistency Score</th>
                      <th>Rewards Earned</th>
                      <th>Rewards Redeemed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDonors.map((donor) => (
                      <tr key={donor.anonymousId}>
                        <td className={styles.anonymousId}>
                          {donor.anonymousId.slice(0, 8)}...
                          {donor.anonymousId.slice(-6)}
                          <br />
                          <button
                            onClick={() => testRewardCalculation(donor)}
                            style={{
                              fontSize: "0.7em",
                              padding: "2px 6px",
                              marginTop: "4px",
                              background: "#4a90e2",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            Test Reward
                          </button>
                        </td>
                        <td>
                          <span
                            className={`${styles.bloodType} ${
                              styles[
                                `bloodType${donor.bloodType.replace(
                                  /[+-]/g,
                                  ""
                                )}`
                              ]
                            }`}
                          >
                            {donor.bloodType}
                          </span>
                        </td>
                        <td className={styles.donationCount}>
                          {donor.donationCount}
                        </td>
                        <td>
                          <span
                            className={`${styles.tier} ${
                              styles[`tier${donor.donorTier}`]
                            }`}
                          >
                            {donor.donorTier === 0
                              ? "None"
                              : donor.donorTier === 1
                              ? "Bronze"
                              : donor.donorTier === 2
                              ? "Silver"
                              : donor.donorTier === 3
                              ? "Gold"
                              : "Platinum"}
                          </span>
                        </td>
                        <td className={styles.consistency}>
                          {donor.consistencyScore}%
                        </td>
                        <td className={styles.rewards}>
                          {formatTokenAmount(donor.totalRewardsEarned)} BDT
                          <br />
                          <small style={{ fontSize: "0.8em", opacity: 0.7 }}>
                            Raw: {donor.totalRewardsEarned}
                          </small>
                        </td>
                        <td className={styles.redeemed}>
                          {formatTokenAmount(donor.rewardsRedeemed)} BDT
                          <br />
                          <small style={{ fontSize: "0.8em", opacity: 0.7 }}>
                            Raw: {donor.rewardsRedeemed}
                          </small>
                        </td>
                        <td>
                          <span
                            className={`${styles.status} ${
                              donor.isRegistered
                                ? styles.active
                                : styles.inactive
                            }`}
                          >
                            {donor.isRegistered ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.paginationButton}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>

                    <div className={styles.paginationInfo}>
                      Page {currentPage} of {totalPages}
                    </div>

                    <button
                      className={styles.paginationButton}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : filteredDonors.length === 0 && donors.length > 0 ? (
              <div className={styles.emptyMessage}>
                <p>No donors match your current filters.</p>
                <p>Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              <div className={styles.emptyMessage}>
                <p>No registered donors found.</p>
                <p>Donors will appear here once they register in the system.</p>
              </div>
            )}
          </div>

          {/* Research Institution Management */}
          {/* <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>🏛️</span>
              Research Institution Management
            </h2>
            <p className={styles.description}>
              Add or remove verified research institutions. Only verified
              institutions can access anonymized donor data.
            </p>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Add Institution Address</label>
                <input
                  className={styles.input}
                  value={inst}
                  onChange={(e) => setInst(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>
                  Remove Institution Address
                </label>
                <input
                  className={styles.input}
                  value={removeInst}
                  onChange={(e) => setRemoveInst(e.target.value)}
                  placeholder="0x..."
                />
              </div>
            </div>
            <div className={styles.actionButtons}>
              <button
                className={`${styles.primaryButton} ${
                  loading ? styles.loading : ""
                }`}
                onClick={addInstitution}
                disabled={loading || !inst}
              >
                {loading ? "Processing..." : "Add Institution"}
              </button>
              <button
                className={`${styles.button} ${loading ? styles.loading : ""}`}
                onClick={removeInstitution}
                disabled={loading || !removeInst}
              >
                {loading ? "Processing..." : "Remove Institution"}
              </button>
            </div>
          </div> */}

          {/* Tier Management */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>🎯</span>
              Tier Management
            </h2>
            <p className={styles.description}>
              Configure donation tier thresholds and multipliers that determine
              reward levels.
            </p>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Tier Level (Threshold)</label>
                <select
                  className={styles.select}
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                >
                  <option value="1">Tier 1 (Bronze)</option>
                  <option value="2">Tier 2 (Silver)</option>
                  <option value="3">Tier 3 (Gold)</option>
                  <option value="4">Tier 4 (Platinum)</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Donation Threshold</label>
                <input
                  className={styles.input}
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Tier Level (Multiplier)</label>
                <select
                  className={styles.select}
                  value={tierMult}
                  onChange={(e) => setTierMult(e.target.value)}
                >
                  <option value="1">Tier 1 (Bronze)</option>
                  <option value="2">Tier 2 (Silver)</option>
                  <option value="3">Tier 3 (Gold)</option>
                  <option value="4">Tier 4 (Platinum)</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Tier Multiplier (%)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={tierMultiplier}
                  onChange={(e) => setTierMultiplier(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
            <div className={styles.actionButtons}>
              <button
                className={`${styles.primaryButton} ${
                  loading ? styles.loading : ""
                }`}
                onClick={setTierThreshold}
                disabled={loading || !tier || !threshold}
              >
                {loading ? "Processing..." : "Update Threshold"}
              </button>
              <button
                className={`${styles.button} ${loading ? styles.loading : ""}`}
                onClick={updateTierMultiplier}
                disabled={loading || !tierMult || !tierMultiplier}
              >
                {loading ? "Processing..." : "Update Multiplier"}
              </button>
            </div>
          </div>

          {/* Blood Type Multipliers */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>🩸</span>
              Blood Type Multipliers
            </h2>
            <p className={styles.description}>
              Configure reward multipliers based on blood type rarity and
              demand.
            </p>

            {/* Debug Section - Current Reward Parameters */}
            <div
              className={styles.debugSection}
              style={{
                background: "rgba(255,255,255,0.05)",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                fontSize: "0.9em",
              }}
            >
              <h4 style={{ margin: "0 0 0.5rem 0", color: "#ffd700" }}>
                🔍 Debug: Current Reward Parameters
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div>
                  <strong>Base Reward:</strong>{" "}
                  {formatTokenAmount("100000000000000000000")} BDT (100 tokens)
                </div>
                <div>
                  <strong>Consistency Bonus:</strong>{" "}
                  {formatTokenAmount("50000000000000000000")} BDT (50 tokens)
                </div>
                <div>
                  <strong>Data Completeness Bonus:</strong>{" "}
                  {formatTokenAmount("25000000000000000000")} BDT (25 tokens)
                </div>
                <div>
                  <strong>Feedback Bonus:</strong>{" "}
                  {formatTokenAmount("20000000000000000000")} BDT (20 tokens)
                </div>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <strong>Blood Type Multipliers:</strong>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "0.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <span>O-: 230%</span>
                  <span>AB-: 250%</span>
                  <span>B-: 250%</span>
                  <span>A-: 150%</span>
                  <span style={{ color: "#ff6b6b" }}>A+: NOT SET</span>
                  <span style={{ color: "#ff6b6b" }}>O+: NOT SET</span>
                  <span style={{ color: "#ff6b6b" }}>B+: NOT SET</span>
                  <span style={{ color: "#ff6b6b" }}>AB+: NOT SET</span>
                </div>
              </div>

              {/* Test Contract Connection */}
              <div style={{ marginTop: "1rem" }}>
                <button
                  onClick={testContractConnection}
                  style={{
                    background: "#4a90e2",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9em",
                    marginRight: "0.5rem",
                  }}
                >
                  🔍 Test Contract Connection & Multipliers
                </button>

                <button
                  onClick={updateAllBloodTypeMultipliers}
                  style={{
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9em",
                    marginRight: "0.5rem",
                  }}
                >
                  🚀 Update All Blood Type Multipliers
                </button>

                <button
                  onClick={testRewardCalculationForAllTypes}
                  style={{
                    background: "#ffc107",
                    color: "black",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9em",
                  }}
                >
                  🧪 Test Reward Calculation for All Types
                </button>
              </div>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Blood Type</label>
                <select
                  className={styles.select}
                  value={bloodType}
                  onChange={(e) => handleBloodTypeChange(e.target.value)}
                >
                  <option value="O-">O- (Universal donor - 230%)</option>
                  <option value="AB-">AB- (Rarest - 250%)</option>
                  <option value="B-">B- (Rare - 200%)</option>
                  <option value="A-">A- (Uncommon - 150%)</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Multiplier (%)</label>
                <input
                  className={styles.input}
                  type="number"
                  value={bloodTypeMultiplier}
                  onChange={(e) => setBloodTypeMultiplier(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
            <div className={styles.actionButtons}>
              <button
                className={`${styles.primaryButton} ${
                  loading ? styles.loading : ""
                }`}
                onClick={updateBloodTypeMultiplier}
                disabled={loading || !bloodType || !bloodTypeMultiplier}
              >
                {loading ? "Processing..." : "Update Blood Type Multiplier"}
              </button>
            </div>
          </div>

          {/* Incentive Parameters */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>⚙️</span>
              Incentive Parameters
            </h2>
            <p className={styles.description}>
              Configure the base reward amounts and bonus parameters for the
              donation incentive system.
            </p>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Base Reward</label>
                <input
                  className={styles.input}
                  type="number"
                  value={baseReward}
                  onChange={(e) => setBaseReward(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Consistency Bonus</label>
                <input
                  className={styles.input}
                  type="number"
                  value={consistencyBonus}
                  onChange={(e) => setConsistencyBonus(e.target.value)}
                  placeholder="50"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Data Completeness Bonus</label>
                <input
                  className={styles.input}
                  type="number"
                  value={dataCompletenessBonus}
                  onChange={(e) => setDataCompletenessBonus(e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Feedback Bonus</label>
                <input
                  className={styles.input}
                  type="number"
                  value={feedbackBonus}
                  onChange={(e) => setFeedbackBonus(e.target.value)}
                  placeholder="10"
                />
              </div>
            </div>
            <div className={styles.actionButtons}>
              <button
                className={`${styles.primaryButton} ${
                  loading ? styles.loading : ""
                }`}
                onClick={updateIncentiveParameters}
                disabled={
                  loading ||
                  !baseReward ||
                  !consistencyBonus ||
                  !dataCompletenessBonus ||
                  !feedbackBonus
                }
              >
                {loading ? "Processing..." : "Update Incentive Parameters"}
              </button>
            </div>
          </div>

          {/* Role Management */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>👑</span>
              Role Management
            </h2>
            <p className={styles.description}>
              Grant or revoke roles for different users. Manage access
              permissions for Blood Units, Researchers, and Administrators
              across the system.
            </p>

            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>User Address</label>
                <input
                  className={styles.input}
                  value={roleAddress}
                  onChange={(e) => setRoleAddress(e.target.value)}
                  placeholder="0x..."
                />
                <small className={styles.fieldHint}>
                  Wallet address to grant or revoke role for
                </small>
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>Role Type</label>
                <select
                  className={styles.input}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="BLOOD_UNIT_ROLE">Blood Unit Role</option>
                  <option value="VERIFIED_RESEARCHER">
                    Verified Researcher
                  </option>
                  <option value="DEFAULT_ADMIN_ROLE">Admin Role</option>
                </select>
                <small className={styles.fieldHint}>
                  Select the role to grant or revoke
                </small>
              </div>
            </div>

            {/* Role Information */}
            <div className={styles.roleInfo}>
              <h4>Role Information:</h4>
              {selectedRole === "BLOOD_UNIT_ROLE" && (
                <div className={styles.roleDetails}>
                  <p>
                    <strong>Contract:</strong> BloodDonorSystem
                  </p>
                  <p>
                    <strong>Permissions:</strong> Record donations, complete
                    research profiles
                  </p>
                  <p>
                    <strong>Hash:</strong> 0x7795...2a95
                  </p>
                </div>
              )}
              {selectedRole === "VERIFIED_RESEARCHER" && (
                <div className={styles.roleDetails}>
                  <p>
                    <strong>Contract:</strong> BloodDonorSystem
                  </p>
                  <p>
                    <strong>Permissions:</strong> Access research data, complete
                    profiles
                  </p>
                  <p>
                    <strong>Hash:</strong> 0x7b76...3357
                  </p>
                </div>
              )}
              {selectedRole === "DEFAULT_ADMIN_ROLE" && (
                <div className={styles.roleDetails}>
                  <p>
                    <strong>Contract:</strong> Both (System & Governance)
                  </p>
                  <p>
                    <strong>Permissions:</strong> Full administrative access
                  </p>
                  <p>
                    <strong>Hash:</strong> 0x0000...0000
                  </p>
                </div>
              )}
            </div>

            <div className={styles.actionButtons}>
              <button
                className={`${styles.primaryButton} ${
                  loading ? styles.loading : ""
                }`}
                onClick={grantRole}
                disabled={loading || !roleAddress || !selectedRole}
              >
                {loading ? "Processing..." : "Grant Role"}
              </button>
              <button
                className={`${styles.button} ${loading ? styles.loading : ""}`}
                onClick={revokeRole}
                disabled={loading || !roleAddress || !selectedRole}
                style={{ backgroundColor: "#dc2626" }}
              >
                {loading ? "Processing..." : "Revoke Role"}
              </button>
            </div>
          </div>

          {status && (
            <div
              className={`${styles.status} ${
                status.includes("🎉")
                  ? styles.success
                  : status.includes("Error") || status.includes("Failed")
                  ? styles.error
                  : ""
              }`}
            >
              {status}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
