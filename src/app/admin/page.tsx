"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getBrowserProvider, getContract } from "@/lib/eth";
import DonorDAOGovernanceABI from "@/lib/abis/DonorDAOGovernance";
import BloodDonorSystemABI from "@/lib/abis/BloodDonorSystem";
import { ENV } from "@/lib/env";
import styles from "./page.module.css";

export default function AdminPage() {
  const { address, switchToAddress } = useWallet();

  // Institution Management
  const [inst, setInst] = useState("");
  const [removeInst, setRemoveInst] = useState("");

  // Tier Management
  const [tier, setTier] = useState("1");
  const [threshold, setThreshold] = useState("5");
  const [tierMult, setTierMult] = useState("1");
  const [tierMultiplier, setTierMultiplier] = useState("100");

  // Blood Type Management
  const [bloodType, setBloodType] = useState("A+");
  const [bloodTypeMultiplier, setBloodTypeMultiplier] = useState("100");

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

    if (!ENV.DAO_GOVERNANCE_ADDRESS || !ENV.BLOOD_DONOR_SYSTEM_ADDRESS) {
      console.error("Contract addresses not configured");
      setStatus(
        "Contract addresses not configured. Please check environment variables."
      );
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    setCheckingAdmin(true);
    console.log("Checking admin status for address:", address);
    console.log("DAO Governance Address:", ENV.DAO_GOVERNANCE_ADDRESS);
    console.log("Blood Donor System Address:", ENV.BLOOD_DONOR_SYSTEM_ADDRESS);

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
      const govCode = await provider.getCode(ENV.DAO_GOVERNANCE_ADDRESS);
      const sysCode = await provider.getCode(ENV.BLOOD_DONOR_SYSTEM_ADDRESS);

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
            ENV.DAO_GOVERNANCE_ADDRESS,
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
            ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
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
    if (!ENV.DAO_GOVERNANCE_ADDRESS) return;

    try {
      const provider = await getBrowserProvider();
      const gov = getContract(
        ENV.DAO_GOVERNANCE_ADDRESS,
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

  const addInstitution = async () => {
    if (!ENV.DAO_GOVERNANCE_ADDRESS) {
      setStatus("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      const signer = await getValidatedSigner();
      if (!signer) return;
      const gov = getContract(
        ENV.DAO_GOVERNANCE_ADDRESS,
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
    if (!ENV.DAO_GOVERNANCE_ADDRESS) {
      setStatus("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const gov = getContract(
        ENV.DAO_GOVERNANCE_ADDRESS,
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
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS) {
      setStatus("Blood donor system not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const sys = getContract(
        ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
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
    if (!ENV.DAO_GOVERNANCE_ADDRESS) {
      setStatus("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const gov = getContract(
        ENV.DAO_GOVERNANCE_ADDRESS,
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
    if (!ENV.DAO_GOVERNANCE_ADDRESS) {
      setStatus("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const gov = getContract(
        ENV.DAO_GOVERNANCE_ADDRESS,
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
    if (!ENV.DAO_GOVERNANCE_ADDRESS) {
      setStatus("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const gov = getContract(
        ENV.DAO_GOVERNANCE_ADDRESS,
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
        if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS) {
          setStatus("BloodDonorSystem contract not configured");
          return;
        }

        const sys = getContract(
          ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
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
        if (!ENV.DAO_GOVERNANCE_ADDRESS) {
          setStatus("DonorDAOGovernance contract not configured");
          return;
        }

        const gov = getContract(
          ENV.DAO_GOVERNANCE_ADDRESS,
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
        if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS) {
          setStatus("BloodDonorSystem contract not configured");
          return;
        }

        const sys = getContract(
          ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
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
        if (!ENV.DAO_GOVERNANCE_ADDRESS) {
          setStatus("DonorDAOGovernance contract not configured");
          return;
        }

        const gov = getContract(
          ENV.DAO_GOVERNANCE_ADDRESS,
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
          Manage research institutions, configure system parameters, and oversee
          platform governance
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
              DAO Contract: {ENV.DAO_GOVERNANCE_ADDRESS}
              <br />
              System Contract: {ENV.BLOOD_DONOR_SYSTEM_ADDRESS}
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

          {/* Research Institution Management */}
          <div className={styles.card}>
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
          </div>

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
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>Blood Type</label>
                <select
                  className={styles.select}
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
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
