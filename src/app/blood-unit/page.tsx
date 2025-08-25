"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getBrowserProvider, getContract } from "@/lib/eth";
import BloodDonorSystemABI from "@/lib/abis/BloodDonorSystem";
// import { ENV } from "@/lib/env";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import styles from "./page.module.css";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

export default function BloodUnitPage() {
  const { address, switchToAddress } = useWallet();
  const [form, setForm] = useState({
    anonymousId: "",
    recordHash: "",
    hb: "0",
    volume: "450",
    donorAddress: "",
  });

  // Medical record data for hash generation
  const [medicalData, setMedicalData] = useState({
    donorName: "",
    donorId: "",
    bloodPressure: "",
    temperature: "",
    weight: "",
    medicalHistory: "",
    medications: "",
    donationDate: new Date().toISOString().split("T")[0],
    donationTime: new Date().toTimeString().split(" ")[0],
    bloodUnitId: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("medical");
  const [hasBloodUnitRole, setHasBloodUnitRole] = useState(false);
  const [bloodUnitStats, setBloodUnitStats] = useState({
    reputation: "0",
    donationCount: "0",
  });

  // Complete research profile form
  const [researchProfileId, setResearchProfileId] = useState("");

  const handleChange = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleMedicalDataChange = (key: string, value: string) =>
    setMedicalData((f) => ({ ...f, [key]: value }));

  // Generate anonymous ID based on wallet address
  const generateAnonymousId = async (walletAddress: string) => {
    try {
      const provider = await getBrowserProvider();
      const contract = getContract(
        CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,   
        BloodDonorSystemABI,
        provider
      );

      // Use default salt of 0 (same as donor registration)
      const anonymousId = await contract.generateAnonymousId(
        walletAddress,
        BigInt(0)
      );
      return anonymousId;
    } catch (error) {
      console.error("Error generating anonymous ID:", error);
      return null;
    }
  };

  // Generate anonymous ID when donor address is entered
  useEffect(() => {
    const generateAnonIdFromDonorAddress = async () => {
      if (
        form.donorAddress &&
        form.donorAddress.length === 42 &&
        form.donorAddress.startsWith("0x")
      ) {
        const anonId = await generateAnonymousId(form.donorAddress);
        if (anonId) {
          setForm((f) => ({ ...f, anonymousId: anonId }));
          toast.success("Anonymous ID generated from donor address! 🔐");
        }
      }
    };

    generateAnonIdFromDonorAddress();
  }, [form.donorAddress]);

  // Generate hash from medical data
  const generateRecordHash = () => {
    try {
      // Create a structured medical record object
      const medicalRecord = {
        donorInfo: {
          name: medicalData.donorName,
          id: medicalData.donorId,
        },
        vitalSigns: {
          bloodPressure: medicalData.bloodPressure,
          temperature: medicalData.temperature,
          weight: medicalData.weight,
          hemoglobin: form.hb,
        },
        donationDetails: {
          date: medicalData.donationDate,
          time: medicalData.donationTime,
          volume: form.volume,
          bloodUnitId: medicalData.bloodUnitId,
        },
        medicalInfo: {
          history: medicalData.medicalHistory,
          medications: medicalData.medications,
          notes: medicalData.notes,
        },
        metadata: {
          timestamp: Date.now(),
          bloodUnit: address,
          version: "1.0",
        },
      };

      // Convert to JSON string for consistent hashing
      const recordString = JSON.stringify(medicalRecord, null, 0);

      // Generate keccak256 hash
      const hash = ethers.keccak256(ethers.toUtf8Bytes(recordString));

      // Update the form with generated hash
      setForm((f) => ({ ...f, recordHash: hash }));

      // Store the original data in localStorage for later retrieval
      const storageKey = `medical_record_${hash}`;
      localStorage.setItem(storageKey, recordString);

      toast.success("Record hash generated successfully! 🔐");
      console.log("Generated hash:", hash);
      console.log("Original data stored with key:", storageKey);

      return hash;
    } catch (error) {
      console.error("Error generating hash:", error);
      toast.error("Failed to generate record hash");
      return null;
    }
  };

  // Decode hash to retrieve original data
  const decodeRecordHash = (hash: string) => {
    try {
      const storageKey = `medical_record_${hash}`;
      const storedData = localStorage.getItem(storageKey);

      if (!storedData) {
        toast.error("No data found for this hash");
        return null;
      }

      const medicalRecord = JSON.parse(storedData);
      toast.success("Record decoded successfully! 📋");
      console.log("Decoded medical record:", medicalRecord);

      return medicalRecord;
    } catch (error) {
      console.error("Error decoding hash:", error);
      toast.error("Failed to decode record hash");
      return null;
    }
  };

  // Check if user has BLOOD_UNIT_ROLE
  useEffect(() => {
    const checkRole = async () => {
      if (!address) {
        setHasBloodUnitRole(false);
        return;
      }

      // Known addresses with BLOOD_UNIT_ROLE
      const KNOWN_ADMIN_WALLET = "0xFB42A0d228609942ccd685E0D9ceF1825F26Cb78";
      const KNOWN_BLOOD_UNIT = "0xeE31E24e1F23778a1E532FE26be7a6399A5C5a30";

      // Quick check for known addresses
      if (
        address.toLowerCase() === KNOWN_ADMIN_WALLET.toLowerCase() ||
        address.toLowerCase() === KNOWN_BLOOD_UNIT.toLowerCase()
      ) {
        console.log("✅ Recognized blood unit address, granting access");
        setHasBloodUnitRole(true);

        // Load stats for recognized addresses
        if (CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM) {
          try {
            const provider = await getBrowserProvider();
            const sys = getContract(
              CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
              BloodDonorSystemABI,
              provider
            );

            const reputation = await sys.bloodUnitReputation(address);
            const donationCount = await sys.bloodUnitDonationCount(address);

            setBloodUnitStats({
              reputation: reputation.toString(),
              donationCount: donationCount.toString(),
            });
          } catch (error) {
            console.error("Error loading stats:", error);
          }
        }
        return;
      }

      if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM) {
        console.error("Contract address not configured");
        return;
      }

      try {
        const provider = await getBrowserProvider();
        const network = await provider.getNetwork();
        console.log("Connected to network:", network.chainId.toString());

        // Verify we're on BSC Mainnet
        if (network.chainId.toString() !== "56") {
          console.log(
            `Wrong network! Please switch to BSC Mainnet (Chain ID: 56). Current: ${network.chainId}`
          );
          setHasBloodUnitRole(false);
          return;
        }

        // Test contract connectivity
        const sysCode = await provider.getCode(CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM);
        console.log("System contract code exists:", sysCode !== "0x");

        if (sysCode === "0x") {
          console.log("No contract found at specified address");
          setHasBloodUnitRole(false);
          return;
        }

        const sys = getContract(
          CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
          BloodDonorSystemABI,
          provider
        );

        // Check BLOOD_UNIT_ROLE using the known role hash from the verification script
        const BLOOD_UNIT_ROLE =
          "0x7795041f4657df87af70bd1315911da973ec3e777f97ec78f04c191a56a02a95";
        console.log("Using BLOOD_UNIT_ROLE:", BLOOD_UNIT_ROLE);

        const hasRole = await sys.hasRole(BLOOD_UNIT_ROLE, address);
        console.log("Has BLOOD_UNIT_ROLE:", hasRole);

        setHasBloodUnitRole(hasRole);

        if (hasRole) {
          // Get blood unit statistics
          const reputation = await sys.bloodUnitReputation(address);
          const donationCount = await sys.bloodUnitDonationCount(address);

          setBloodUnitStats({
            reputation: reputation.toString(),
            donationCount: donationCount.toString(),
          });
        }
      } catch (error) {
        console.error("Error checking blood unit role:", error);
        setHasBloodUnitRole(false);
      }
    };

    checkRole();
  }, [address]);

  // Helper function to validate wallet connection and get signer
  const getValidatedSigner = async () => {
    // Check if wallet is connected
    if (!address) {
      toast.error("Please connect your wallet first");
      return null;
    }

    try {
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();

      // Get the actual signer address
      const signerAddress = await signer.getAddress();

      // If addresses don't match, update to match the actual connected wallet
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        console.log(
          `Wallet address mismatch detected. Context: ${address}, Actual: ${signerAddress}`
        );
        toast.success(
          `🔄 Switching to connected wallet: ${signerAddress.slice(
            0,
            6
          )}...${signerAddress.slice(-4)}`,
          { duration: 2000 }
        );

        // Switch the wallet context to the actual connected wallet
        switchToAddress(signerAddress);

        // Wait a moment for context to update, then proceed
        setTimeout(() => {
          toast.success("Wallet switched successfully! Please try again.", {
            duration: 3000,
          });
        }, 500);
        return null;
      }

      console.log("Requesting signature from wallet:", signerAddress);
      return signer;
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      toast.error("❌ Failed to connect to wallet");
      return null;
    }
  };

  const handleRecordDonation = async () => {
    if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM) {
      toast.error("Contract not configured");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Recording donation...");

    try {
      const signer = await getValidatedSigner();
      if (!signer) {
        setLoading(false);
        toast.dismiss(toastId);
        return;
      }

      const sys = getContract(
        CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
        BloodDonorSystemABI,
        signer
      );
      const tx = await sys.recordDonation(
        form.anonymousId,
        form.recordHash,
        BigInt(form.hb),
        BigInt(form.volume),
        form.donorAddress
      );

      toast.loading("Waiting for confirmation...", { id: toastId });
      await tx.wait();

      toast.success("Donation recorded successfully! 🎉", { id: toastId });

      // Clear form
      setForm({
        anonymousId: "",
        recordHash: "",
        hb: "0",
        volume: "450",
        donorAddress: "",
      });

      // Refresh stats
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to record donation";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteResearchProfile = async () => {
    if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM) {
      toast.error("Contract not configured");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Completing research profile...");

    try {
      const signer = await getValidatedSigner();
      if (!signer) {
        setLoading(false);
        toast.dismiss(toastId);
        return;
      }

      const sys = getContract(
        CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
        BloodDonorSystemABI,
        signer
      );
      const tx = await sys.completeResearchProfile(researchProfileId);

      toast.loading("Waiting for confirmation...", { id: toastId });
      await tx.wait();

      toast.success("Research profile completed successfully! 🎉", {
        id: toastId,
      });

      // Clear form
      setResearchProfileId("");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to complete research profile";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Hospital Blood Donor Unit </h1>
        <p className={styles.subtitle}>
          Record blood donations and manage unit information with secure
          blockchain verification
        </p>
      </div>

      {!address ? (
        <div className={styles.connectWrapper}>
          <div className={styles.connectMessage}>
            <h3>Connect Your Wallet</h3>
            <p>
              Please connect your wallet using the button in the header to
              access the blood unit portal.
            </p>
          </div>
        </div>
      ) : !hasBloodUnitRole ? (
        <div className={styles.accessDenied}>
          <div className={styles.accessMessage}>
            <h3>🚫 Access Denied</h3>
            <p>
              You don&apos;t have the required BLOOD_UNIT_ROLE to access this
              portal. Please contact an administrator to get the proper
              permissions.
            </p>
            <div className={styles.accessInfo}>
              <p>
                <strong>Your Address:</strong> {formatAddress(address)}
              </p>
              <p>
                <strong>Required Role:</strong> BLOOD_UNIT_ROLE
              </p>
              <p>
                <strong>Role Hash:</strong>{" "}
                0x7795041f4657df87af70bd1315911da973ec3e777f97ec78f04c191a56a02a95
              </p>
            </div>
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
                  System Contract: {CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM}
              <br />
              Known Admin: 0xFB42A0d228609942ccd685E0D9ceF1825F26Cb78
              <br />
              Known Blood Unit: 0xeE31E24e1F23778a1E532FE26be7a6399A5C5a30
            </div>
            <div className={styles.actionButtons}>
              <button
                className={styles.button}
                onClick={() => window.location.reload()}
              >
                Retry Access Check
              </button>
              <button
                className={styles.button}
                onClick={() => {
                  setHasBloodUnitRole(true);
                  toast.success(
                    "⚠️ TEMPORARY BYPASS ENABLED - For testing only!"
                  );
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
          {/* Tab Navigation */}
          <div className={styles.tabNav}>
            {[
              { id: "medical", label: "Medical Data", icon: "🏥" },
              { id: "record", label: "Record Donation", icon: "🩸" },
              { id: "profile", label: "Research Profiles", icon: "📋" },
              { id: "stats", label: "Unit Statistics", icon: "📊" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tabButton} ${
                  activeTab === tab.id ? styles.activeTab : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.tabIcon}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Medical Data Tab */}
          {activeTab === "medical" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>🏥</span>
                Medical Data Entry
              </h2>
              <p className={styles.description}>
                Enter the donor&apos;s medical information to generate a secure
                hash for off-chain record storage. This data will be hashed and
                stored locally for verification purposes.
              </p>

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Donor Name</label>
                  <input
                    className={styles.input}
                    value={medicalData.donorName}
                    onChange={(e) =>
                      handleMedicalDataChange("donorName", e.target.value)
                    }
                    placeholder="Enter donor's full name"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Donor ID</label>
                  <input
                    className={styles.input}
                    value={medicalData.donorId}
                    onChange={(e) =>
                      handleMedicalDataChange("donorId", e.target.value)
                    }
                    placeholder="Enter donor's ID number"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Blood Pressure</label>
                  <input
                    className={styles.input}
                    value={medicalData.bloodPressure}
                    onChange={(e) =>
                      handleMedicalDataChange("bloodPressure", e.target.value)
                    }
                    placeholder="120/80 mmHg"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Temperature (°C)</label>
                  <input
                    className={styles.input}
                    type="number"
                    step="0.1"
                    value={medicalData.temperature}
                    onChange={(e) =>
                      handleMedicalDataChange("temperature", e.target.value)
                    }
                    placeholder="36.5"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Weight (kg)</label>
                  <input
                    className={styles.input}
                    type="number"
                    step="0.1"
                    value={medicalData.weight}
                    onChange={(e) =>
                      handleMedicalDataChange("weight", e.target.value)
                    }
                    placeholder="70.0"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    Hemoglobin Level (g/dL)
                  </label>
                  <input
                    className={styles.input}
                    type="number"
                    step="0.1"
                    value={form.hb}
                    onChange={(e) => handleChange("hb", e.target.value)}
                    placeholder="12.5"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Volume (ml)</label>
                  <input
                    className={styles.input}
                    type="number"
                    value={form.volume}
                    onChange={(e) => handleChange("volume", e.target.value)}
                    placeholder="450"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Donation Date</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={medicalData.donationDate}
                    onChange={(e) =>
                      handleMedicalDataChange("donationDate", e.target.value)
                    }
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Donation Time</label>
                  <input
                    className={styles.input}
                    type="time"
                    value={medicalData.donationTime}
                    onChange={(e) =>
                      handleMedicalDataChange("donationTime", e.target.value)
                    }
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Blood Unit ID</label>
                  <input
                    className={styles.input}
                    value={medicalData.bloodUnitId}
                    onChange={(e) =>
                      handleMedicalDataChange("bloodUnitId", e.target.value)
                    }
                    placeholder="Unit identifier"
                  />
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Medical History</label>
                  <textarea
                    className={styles.textarea}
                    value={medicalData.medicalHistory}
                    onChange={(e) =>
                      handleMedicalDataChange("medicalHistory", e.target.value)
                    }
                    placeholder="Relevant medical history..."
                    rows={3}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Current Medications</label>
                  <textarea
                    className={styles.textarea}
                    value={medicalData.medications}
                    onChange={(e) =>
                      handleMedicalDataChange("medications", e.target.value)
                    }
                    placeholder="Current medications..."
                    rows={3}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Additional Notes</label>
                  <textarea
                    className={styles.textarea}
                    value={medicalData.notes}
                    onChange={(e) =>
                      handleMedicalDataChange("notes", e.target.value)
                    }
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </div>
              </div>

              <div className={styles.actionButtons}>
                <button
                  className={`${styles.primaryButton} ${
                    loading ? styles.loading : ""
                  }`}
                  onClick={generateRecordHash}
                  disabled={loading}
                >
                  Generate Record Hash 🔐
                </button>
                <button
                  className={styles.button}
                  onClick={() =>
                    form.recordHash && decodeRecordHash(form.recordHash)
                  }
                  disabled={!form.recordHash}
                >
                  Decode Current Hash 📋
                </button>
              </div>

              {form.recordHash && (
                <div className={styles.hashDisplay}>
                  <h4>Generated Record Hash:</h4>
                  <div className={styles.hashContainer}>
                    <span className={styles.hashText}>{form.recordHash}</span>
                    <button
                      className={styles.copyButton}
                      onClick={() => {
                        navigator.clipboard.writeText(form.recordHash);
                        toast.success("Hash copied to clipboard! 📋");
                      }}
                      title="Copy Hash"
                    >
                      📋
                    </button>
                  </div>
                  <small className={styles.fieldHint}>
                    This hash represents the medical record data and can be used
                    for verification.
                  </small>
                </div>
              )}
            </div>
          )}

          {/* Record Donation Tab */}
          {activeTab === "record" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>🩸</span>
                Record Blood Donation
              </h2>
              <p className={styles.description}>
                Record a new blood donation with all required medical and donor
                information. This will update the donor&apos;s profile and
                distribute rewards.
              </p>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Anonymous ID (bytes32)</label>
                  <div className={styles.inputGroup}>
                    <input
                      className={styles.input}
                      value={form.anonymousId}
                      onChange={(e) =>
                        handleChange("anonymousId", e.target.value)
                      }
                      placeholder="0x..."
                    />
                    <button
                      className={styles.regenerateButton}
                      onClick={async () => {
                        if (form.donorAddress) {
                          const anonId = await generateAnonymousId(
                            form.donorAddress
                          );
                          if (anonId) {
                            setForm((f) => ({ ...f, anonymousId: anonId }));
                            toast.success("Anonymous ID regenerated! 🔄");
                          }
                        } else {
                          toast.error("Please enter donor address first");
                        }
                      }}
                      title="Generate Anonymous ID from Donor Address"
                      disabled={!form.donorAddress}
                    >
                      🔄
                    </button>
                  </div>
                  <small className={styles.fieldHint}>
                    Donor&apos;s anonymous identifier from registration
                    (auto-generated from donor address above)
                  </small>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Record Hash (bytes32)</label>
                  <input
                    className={styles.input}
                    value={form.recordHash}
                    onChange={(e) => handleChange("recordHash", e.target.value)}
                    placeholder="0x..."
                  />
                  <small className={styles.fieldHint}>
                    Hash of off-chain medical record
                  </small>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    Hemoglobin Level (g/dL)
                  </label>
                  <input
                    className={styles.input}
                    type="number"
                    step="0.1"
                    value={form.hb}
                    onChange={(e) => handleChange("hb", e.target.value)}
                    placeholder="12.5"
                  />
                  <small className={styles.fieldHint}>
                    Pre-donation hemoglobin measurement
                  </small>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Volume (ml)</label>
                  <input
                    className={styles.input}
                    type="number"
                    value={form.volume}
                    onChange={(e) => handleChange("volume", e.target.value)}
                    placeholder="450"
                  />
                  <small className={styles.fieldHint}>
                    Volume of blood donated in milliliters
                  </small>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Donor Address</label>
                  <input
                    className={styles.input}
                    value={form.donorAddress}
                    onChange={(e) =>
                      handleChange("donorAddress", e.target.value)
                    }
                    placeholder="0x..."
                  />
                  <small className={styles.fieldHint}>
                    Donor&apos;s wallet address for reward distribution
                  </small>
                </div>
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={`${styles.primaryButton} ${
                    loading ? styles.loading : ""
                  }`}
                  onClick={handleRecordDonation}
                  disabled={
                    loading ||
                    !form.anonymousId ||
                    !form.recordHash ||
                    !form.donorAddress
                  }
                >
                  {loading ? "Processing..." : "Record Donation"}
                </button>
              </div>
            </div>
          )}

          {/* Research Profile Tab */}
          {activeTab === "profile" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>📋</span>
                Complete Research Profile
              </h2>
              <p className={styles.description}>
                Mark a donor&apos;s research profile as complete. This enables
                additional rewards and indicates the donor has provided
                comprehensive research data.
              </p>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Anonymous ID (bytes32)</label>
                  <input
                    className={styles.input}
                    value={researchProfileId}
                    onChange={(e) => setResearchProfileId(e.target.value)}
                    placeholder="0x..."
                  />
                  <small className={styles.fieldHint}>
                    Donor&apos;s anonymous identifier to complete research
                    profile
                  </small>
                </div>
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={`${styles.primaryButton} ${
                    loading ? styles.loading : ""
                  }`}
                  onClick={handleCompleteResearchProfile}
                  disabled={loading || !researchProfileId}
                >
                  {loading ? "Processing..." : "Complete Research Profile"}
                </button>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === "stats" && (
            <>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>📊</span>
                  Blood Unit Performance
                </h2>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🏆</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>
                        {bloodUnitStats.reputation}
                      </span>
                      <span className={styles.statLabel}>Reputation Score</span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🩸</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>
                        {bloodUnitStats.donationCount}
                      </span>
                      <span className={styles.statLabel}>
                        Donations Processed
                      </span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>💰</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>
                        {bloodUnitStats.donationCount !== "0"
                          ? Math.round(
                              Number(bloodUnitStats.reputation) /
                                Number(bloodUnitStats.donationCount)
                            )
                          : 0}
                      </span>
                      <span className={styles.statLabel}>
                        Avg. Reward Per Donation
                      </span>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>✅</div>
                    <div className={styles.statInfo}>
                      <span className={styles.statValue}>Active</span>
                      <span className={styles.statLabel}>Unit Status</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>ℹ️</span>
                  Unit Information
                </h2>
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Unit Address</span>
                    <span className={styles.infoValue}>
                      {formatAddress(address)}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Role</span>
                    <span className={styles.infoValue}>BLOOD_UNIT_ROLE</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Access Level</span>
                    <span className={styles.infoValue}>
                      Verified Blood Unit
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Capabilities</span>
                    <span className={styles.infoValue}>
                      Record Donations, Complete Research Profiles
                    </span>
                  </div>
                </div>
                <div className={styles.actionButtons}>
                  <button className={styles.button}>
                    View Donation History
                  </button>
                  <button className={styles.button}>Export Unit Report</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
