"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getBrowserProvider, getContract } from "@/lib/eth";
import BloodDonorSystemABI from "@/lib/abis/BloodDonorSystem";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import toast from "react-hot-toast";
import styles from "./page.module.css";
// import { ENV } from "@/lib/env";

type DonorInfo = {
  bloodType: string;
  donationCount: number;
  donorTier: number;
  consistencyScore: number;
  // hasCompleteResearchProfile: boolean; // RESEARCH FUNCTIONALITY COMMENTED OUT
  isRegistered: boolean;
  totalRewardsEarned: string;
  rewardsRedeemed: string;
  firstDonationDate: number;
  lastDonationDate: number;
};

// RESEARCH TYPE COMMENTED OUT
// type ResearchConsent = {
//   researchInstitution: string;
//   grantedDate: number;
//   revokedDate: number;
//   isActive: boolean;
//   researchPurpose: string;
// };

type DonationRecord = {
  recordHash: string;
  timestamp: number;
  bloodUnit: string;
  feedbackProvided: boolean;
  hemoglobinLevel: number;
  volume: number;
  index: number;
};

type RegistrationFormData = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
};

type LoginFormData = {
  email: string;
  password: string;
};

type RewardItem = {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in BDT tokens
  icon: string;
  category: "medical" | "merchandise" | "services";
};

type DonorSummary = {
  anonymousId: string;
  donor: DonorInfo;
  historyLength: number;
  availableRewards: string;
  // consents: ResearchConsent[]; // RESEARCH FUNCTIONALITY COMMENTED OUT
} | null;

export default function DonorPage() {
  const { address, switchToAddress } = useWallet();
  const [bloodType, setBloodType] = useState("O-");
  const [salt] = useState<string>("0"); // Fixed to default value 0
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Feedback form states
  const [feedbackDonationIndex, setFeedbackDonationIndex] =
    useState<string>("");
  const [feedbackRating, setFeedbackRating] = useState<string>("5");
  const [feedbackHash, setFeedbackHash] = useState<string>("");

  // RESEARCH CONSENT STATES COMMENTED OUT
  // const [researchInstitution, setResearchInstitution] = useState<string>("");
  // const [researchPurpose, setResearchPurpose] = useState<string>("");

  const [summary, setSummary] = useState<DonorSummary>(null);

  // Donation history states
  const [donationHistory, setDonationHistory] = useState<DonationRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);

  // Registration popup states
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(false);
  const [registrationData, setRegistrationData] =
    useState<RegistrationFormData>({
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
    });
  const [registrationErrors, setRegistrationErrors] = useState<
    Partial<RegistrationFormData>
  >({});

  // Login popup states
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [loginErrors, setLoginErrors] = useState<Partial<LoginFormData>>({});

  // Reward redemption states
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);

  const anonId = useMemo(
    () => summary?.anonymousId as string | undefined,
    [summary]
  );

  const tierNames = ["Unranked", "Bronze", "Silver", "Gold", "Platinum"];
  const tierColors = ["#6b7280", "#cd7f32", "#c0c0c0", "#ffd700", "#e5e4e2"];

  // Reward items available for redemption
  const rewardItems: RewardItem[] = [
    {
      id: "medical-subsidy",
      name: "Medical Care Subsidy",
      description: "Partial coverage for medical treatments and procedures",
      cost: 500,
      icon: "🏥",
      category: "medical",
    },
    {
      id: "free-checkup",
      name: "Free Medical Check-up",
      description: "Comprehensive health screening and consultation",
      cost: 300,
      icon: "🩺",
      category: "medical",
    },
    {
      id: "preferential-care",
      name: "Preferential Care Access",
      description: "Priority scheduling and expedited medical services",
      cost: 200,
      icon: "⭐",
      category: "services",
    },
    {
      id: "medicine-discount",
      name: "Medicine Discount Voucher",
      description: "20% discount on prescription medications",
      cost: 150,
      icon: "💊",
      category: "medical",
    },
    {
      id: "donor-tshirt",
      name: "Donor T-Shirt",
      description: "Premium quality donor appreciation t-shirt",
      cost: 100,
      icon: "👕",
      category: "merchandise",
    },
  ];

  // Reusable function to fetch donor summary data
  const fetchSummary = useCallback(async () => {
    if (!address) return;

    try {
      // Direct contract interaction for fetching donor data
      const { getBloodDonorSystem } = await import("@/lib/contracts");
      const sys = getBloodDonorSystem();
      const saltBigInt = BigInt(salt || "0");
      const anonId = await sys.generateAnonymousId(address, saltBigInt);

      // Get donor information directly from contract
      const donor = await sys.donors(anonId);
      const historyLen = await sys.getDonationHistoryLength(anonId);
      const availableRewards = await sys.getAvailableRewards(anonId);

      const data = {
        anonymousId: anonId,
        donor: {
          bloodType: donor.bloodType,
          donationCount: Number(donor.donationCount),
          donorTier: Number(donor.donorTier),
          consistencyScore: Number(donor.consistencyScore),
          isRegistered: donor.isRegistered,
          totalRewardsEarned: donor.totalRewardsEarned.toString(),
          rewardsRedeemed: donor.rewardsRedeemed.toString(),
          firstDonationDate: Number(donor.firstDonationDate),
          lastDonationDate: Number(donor.lastDonationDate),
        },
        historyLength: Number(historyLen),
        availableRewards: availableRewards.toString(),
      };

      setSummary(data);
    } catch (error) {
      console.error("Failed to load donor data:", error);
      throw error; // Re-throw so calling functions can handle it
    }
  }, [address, salt]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

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

  const handleRegister = async () => {
    if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM) {
      toast.error("Contract address not configured");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Requesting signature…");

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

      // Use enhanced registration with all required fields
      const tx = await sys.registerDonor(
        registrationData.name,
        registrationData.email,
        registrationData.phoneNumber,
        registrationData.password,
        bloodType,
        BigInt(salt || "0")
      );

      toast.loading("Waiting for confirmation…", { id: toastId });
      await tx.wait();

      toast.success("Registered successfully! 🎉", { id: toastId });

      // Refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to register";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleProvideFeedback = async () => {
    if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM || !anonId) return;

    setLoading(true);
    const toastId = toast.loading("Providing feedback...");

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
      const tx = await sys.provideDonationFeedback(
        anonId,
        BigInt(feedbackDonationIndex),
        BigInt(feedbackRating),
        feedbackHash || "No additional feedback"
      );

      toast.loading("Waiting for confirmation…", { id: toastId });
      await tx.wait();

      toast.success("Feedback provided successfully! 🎉", { id: toastId });

      // Clear form
      setFeedbackDonationIndex("");
      setFeedbackRating("5");
      setFeedbackHash("");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to provide feedback";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // RESEARCH FUNCTION COMMENTED OUT
  /*
  const handleGrantConsent = async () => {
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS) return;

    setLoading(true);
    const toastId = toast.loading("Granting research consent...");

    try {
      const signer = await getValidatedSigner();
      if (!signer) {
        setLoading(false);
        toast.dismiss(toastId);
        return;
      }

      const sys = getContract(
        ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
        BloodDonorSystemABI,
        signer
      );
      const tx = await sys.grantResearchConsent(
        researchInstitution,
        researchPurpose
      );

      toast.loading("Waiting for confirmation…", { id: toastId });
      await tx.wait();

      toast.success("Research consent granted successfully! 🎉", {
        id: toastId,
      });

      // Clear form and refresh data
      setResearchInstitution("");
      setResearchPurpose("");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to grant consent";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  */

  // RESEARCH FUNCTION COMMENTED OUT
  /*
  const handleRevokeConsent = async (institution: string) => {
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS) return;

    setLoading(true);
    const toastId = toast.loading("Revoking research consent...");

    try {
      const signer = await getValidatedSigner();
      if (!signer) {
        setLoading(false);
        toast.dismiss(toastId);
        return;
      }

      const sys = getContract(
        ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
        BloodDonorSystemABI,
        signer
      );
      const tx = await sys.revokeResearchConsent(institution);

      toast.loading("Waiting for confirmation…", { id: toastId });
      await tx.wait();

      toast.success("Research consent revoked successfully! 🎉", {
        id: toastId,
      });

      // Refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to revoke consent";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  */

  const handleRedeem = async () => {
    if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM || !summary) return;

    setLoading(true);
    const toastId = toast.loading("Redeeming rewards...");

    try {
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const sys = getContract(
        CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
        BloodDonorSystemABI,
        signer
      );
      const tx = await sys.redeemRewards(BigInt(summary.availableRewards));

      toast.loading("Waiting for confirmation…", { id: toastId });
      await tx.wait();

      toast.success("Rewards redeemed successfully! 💰", { id: toastId });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to redeem";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return "Never";
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // RESEARCH FUNCTION COMMENTED OUT
  /*
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  */

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard! 📋`);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const fetchDonationHistory = useCallback(async () => {
    if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM || !summary?.anonymousId) return;

    setLoadingHistory(true);
    try {
      const provider = await getBrowserProvider();
      const sys = getContract(
        CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
        BloodDonorSystemABI,
        provider
      );

      const historyLength = summary.historyLength;
      const records: DonationRecord[] = [];

      // Fetch all donation records
      for (let i = 0; i < historyLength; i++) {
        try {
          const record = await sys.donationRecords(summary.anonymousId, i);
          records.push({
            recordHash: record.recordHash,
            timestamp: Number(record.timestamp),
            bloodUnit: record.bloodUnit,
            feedbackProvided: record.feedbackProvided,
            hemoglobinLevel: Number(record.hemoglobinLevel),
            volume: Number(record.volume),
            index: i,
          });
        } catch (error) {
          console.error(`Error fetching record ${i}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      records.sort((a, b) => b.timestamp - a.timestamp);
      setDonationHistory(records);
      setShowDetailedHistory(true);
    } catch (error) {
      console.error("Error fetching donation history:", error);
      toast.error("Failed to fetch donation history");
    } finally {
      setLoadingHistory(false);
    }
  }, [summary?.anonymousId, summary?.historyLength]);

  // Auto-load history when history tab is accessed for the first time
  useEffect(() => {
    if (
      activeTab === "history" &&
      summary &&
      summary.historyLength > 0 &&
      donationHistory.length === 0 &&
      !loadingHistory &&
      !showDetailedHistory
    ) {
      // Auto-load history for users with donations
      fetchDonationHistory();
    }
  }, [
    activeTab,
    summary,
    donationHistory.length,
    loadingHistory,
    showDetailedHistory,
    fetchDonationHistory,
  ]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const exportDonationHistory = () => {
    if (donationHistory.length === 0) {
      toast.error("No donation history to export");
      return;
    }

    const csvContent = [
      [
        "Date",
        "Blood Unit",
        "Volume (ml)",
        "Hemoglobin (g/dL)",
        "Feedback Given",
        "Record Hash",
      ],
      ...donationHistory.map((record) => [
        formatDateTime(record.timestamp),
        formatAddress(record.bloodUnit),
        record.volume.toString(),
        (record.hemoglobinLevel / 10).toFixed(1), // Convert from mg/dL to g/dL
        record.feedbackProvided ? "Yes" : "No",
        record.recordHash,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `donation-history-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Donation history exported successfully! 📄");
  };

  // Registration form validation
  const validateRegistrationForm = (): boolean => {
    const errors: Partial<RegistrationFormData> = {};

    // Name validation
    if (!registrationData.name.trim()) {
      errors.name = "Name is required";
    } else if (registrationData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!registrationData.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(registrationData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!registrationData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (
      !phoneRegex.test(registrationData.phoneNumber.replace(/[\s\-\(\)]/g, ""))
    ) {
      errors.phoneNumber = "Please enter a valid phone number";
    }

    // Password validation - simplified (no requirements)
    if (!registrationData.password) {
      errors.password = "Password is required";
    }

    setRegistrationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegistrationInputChange = (
    field: keyof RegistrationFormData,
    value: string
  ) => {
    setRegistrationData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (registrationErrors[field]) {
      setRegistrationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRegistrationSubmit = async () => {
    if (!validateRegistrationForm()) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Processing registration...");

    try {
      // Here you would typically send the registration data to your backend
      // For now, we'll simulate the registration process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // After successful registration, proceed with blockchain registration
      await handleRegister();

      toast.success("Registration completed successfully! 🎉", { id: toastId });
      setShowRegistrationPopup(false);

      // Reset form
      setRegistrationData({
        name: "",
        email: "",
        phoneNumber: "",
        password: "",
      });
      setRegistrationErrors({});
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Login form validation
  const validateLoginForm = (): boolean => {
    const errors: Partial<LoginFormData> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!loginData.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(loginData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!loginData.password) {
      errors.password = "Password is required";
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginInputChange = (
    field: keyof LoginFormData,
    value: string
  ) => {
    setLoginData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (loginErrors[field]) {
      setLoginErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLoginSubmit = async () => {
    if (!validateLoginForm()) {
      return;
    }

    if (!CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM) {
      toast.error("Contract address not configured");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Logging in...");

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

      // Call the smart contract loginDonor method
      const [anonymousId, success] = await sys.loginDonor(
        loginData.email,
        loginData.password
      );

      if (success) {
        console.log("Logged in with anonymous ID:", anonymousId);
        toast.success("Login successful! Welcome back! 🎉", { id: toastId });
        setShowLoginPopup(false);

        // Reset form
        setLoginData({
          email: "",
          password: "",
        });
        setLoginErrors({});

        // Refresh the donor summary to get updated data
        await fetchSummary();
      } else {
        toast.error("Invalid email or password. Please try again.", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(`Login failed: ${message}`, {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle reward redemption
  const handleRedeemReward = async (reward: RewardItem) => {
    if (!summary) return;

    const availableTokens = parseInt(summary.availableRewards);
    if (availableTokens < reward.cost) {
      toast.error(
        `Insufficient tokens. You need ${reward.cost} BDT tokens but have ${availableTokens}.`
      );
      return;
    }

    setSelectedReward(reward);
    setShowRedemptionModal(true);
  };

  const confirmRedemption = async () => {
    if (!selectedReward || !address) return;

    setLoading(true);
    const toastId = toast.loading(`Redeeming ${selectedReward.name}...`);

    try {
      const signer = await getValidatedSigner();
      if (!signer) return;

      const sys = getContract(
        CONTRACT_ADDRESSES.BLOOD_DONOR_SYSTEM,
        BloodDonorSystemABI,
        signer
      );

      // Call the smart contract to redeem rewards
      // The tokens will be transferred to the admin wallet
      const tx = await sys.redeemRewards(
        BigInt(selectedReward.cost),
        selectedReward.id // Pass reward ID for tracking
      );

      await tx.wait();

      toast.success(`${selectedReward.name} redeemed successfully! 🎉`, {
        id: toastId,
      });

      // Refresh the summary to update available rewards
      await fetchSummary();

      // Close modal and reset selection
      setShowRedemptionModal(false);
      setSelectedReward(null);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Failed to redeem reward";
      toast.error(message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Rare Blood Donor Portal</h1>
        <p className={styles.subtitle}>
          Manage your blood donations, track rewards, and contribute to
          life-saving
        </p>
      </div>

      {!address ? (
        <div className={styles.connectWrapper}>
          <div className={styles.connectMessage}>
            <h3>Connect Your Wallet</h3>
            <p>
              Please connect your wallet using the button in the header to
              access the donor portal.
            </p>
          </div>
        </div>
      ) : !summary?.donor.isRegistered ? (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <span className={styles.cardIcon}>🩸</span>
            Register as Donor
          </h2>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label className={styles.label}>Blood Type</label>
              <select
                className={styles.select}
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
              >
                {["O-", "A-", "B-", "AB-"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button
              className={`${styles.primaryButton} ${
                loading ? styles.loading : ""
              }`}
              onClick={() => setShowRegistrationPopup(true)}
              disabled={!bloodType || loading}
            >
              {loading ? "Processing..." : "Register as Donor"}
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => setShowLoginPopup(true)}
              disabled={loading}
            >
              Already Registered? Login
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.stack}>
          {/* Tab Navigation */}
          <div className={styles.tabNav}>
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "rewards", label: "Rewards", icon: "🎁" },
              { id: "feedback", label: "Feedback", icon: "⭐" },
              // { id: "consent", label: "Research Consent", icon: "🔬" }, // RESEARCH TAB COMMENTED OUT
              { id: "history", label: "History", icon: "📈" },
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

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>👤</span>
                  Donor Profile
                </h2>
                <div className={styles.profileGrid}>
                  <div className={styles.profileCard}>
                    <div className={styles.profileIcon}>🩸</div>
                    <div className={styles.profileInfo}>
                      <span className={styles.profileLabel}>Blood Type</span>
                      <span className={styles.profileValue}>
                        {summary.donor.bloodType}
                      </span>
                    </div>
                  </div>
                  <div className={styles.profileCard}>
                    <div
                      className={styles.profileIcon}
                      style={{
                        background: tierColors[summary.donor.donorTier],
                      }}
                    >
                      🏆
                    </div>
                    <div className={styles.profileInfo}>
                      <span className={styles.profileLabel}>Tier</span>
                      <span className={styles.profileValue}>
                        {tierNames[summary.donor.donorTier]}
                      </span>
                    </div>
                  </div>
                  <div className={styles.profileCard}>
                    <div className={styles.profileIcon}>📊</div>
                    <div className={styles.profileInfo}>
                      <span className={styles.profileLabel}>
                        Consistency Score
                      </span>
                      <span className={styles.profileValue}>
                        {summary.donor.consistencyScore}%
                      </span>
                    </div>
                  </div>
                  {/* RESEARCH PROFILE COMMENTED OUT
                  <div className={styles.profileCard}>
                    <div className={styles.profileIcon}>✅</div>
                    <div className={styles.profileInfo}>
                      <span className={styles.profileLabel}>
                        Research Profile
                      </span>
                      <span className={styles.profileValue}>
                        {summary.donor.hasCompleteResearchProfile
                          ? "Complete"
                          : "Incomplete"}
                      </span>
                    </div>
                  </div>
                  */}
                </div>
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>🔐</span>
                  Anonymous ID
                </h2>
                <p className={styles.description}>
                  Your anonymous identifier used for privacy-protected blood
                  donation records. Copy this ID for use when blood units record
                  your donations.
                </p>
                <div className={styles.anonymousIdContainer}>
                  <div className={styles.anonymousIdDisplay}>
                    <span className={styles.anonymousIdText}>
                      {summary.anonymousId}
                    </span>
                    <button
                      className={styles.copyButton}
                      onClick={() =>
                        copyToClipboard(summary.anonymousId, "Anonymous ID")
                      }
                      title="Copy Anonymous ID"
                    >
                      📋
                    </button>
                  </div>
                  <div className={styles.anonymousIdInfo}>
                    <small className={styles.fieldHint}>
                      <strong>Usage:</strong> Provide this ID to blood units
                      when donating blood. It protects your privacy while
                      enabling donation tracking and rewards.
                    </small>
                  </div>
                </div>
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>📊</span>
                  Statistics
                </h2>
                <div className={styles.summaryGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>
                      {summary.historyLength}
                    </span>
                    <span className={styles.statLabel}>Total Donations</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>
                      {summary.availableRewards}
                    </span>
                    <span className={styles.statLabel}>
                      Available Rewards (BDT)
                    </span>
                  </div>
                  {/* RESEARCH CONSENTS COMMENTED OUT
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>
                      {summary.consents.length}
                    </span>
                    <span className={styles.statLabel}>Research Consents</span>
                  </div>
                  */}
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>
                      {summary.donor.totalRewardsEarned}
                    </span>
                    <span className={styles.statLabel}>
                      Total Rewards Earned
                    </span>
                  </div>
                </div>

                <div className={styles.summaryList}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>First Donation</span>
                    <span className={styles.summaryValue}>
                      {formatDate(summary.donor.firstDonationDate)}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Last Donation</span>
                    <span className={styles.summaryValue}>
                      {formatDate(summary.donor.lastDonationDate)}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Anonymous ID</span>
                    <span className={styles.summaryValue}>
                      {anonId?.slice(0, 10)}...
                    </span>
                  </div>
                </div>

                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.primaryButton} ${
                      loading ? styles.loading : ""
                    }`}
                    onClick={handleRedeem}
                    disabled={summary.availableRewards === "0" || loading}
                  >
                    {loading ? "Processing..." : "Redeem Rewards"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Rewards Tab */}
          {activeTab === "rewards" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>🎁</span>
                Redeem Rewards
              </h2>
              <p className={styles.description}>
                Use your earned BDT tokens to redeem valuable rewards including
                medical care, merchandise, and exclusive services.
              </p>

              <div className={styles.rewardsBalance}>
                <div className={styles.balanceCard}>
                  <span className={styles.balanceLabel}>Available Tokens</span>
                  <span className={styles.balanceValue}>
                    {summary?.availableRewards || "0"} BDT
                  </span>
                </div>
              </div>

              <div className={styles.rewardsGrid}>
                {rewardItems.map((reward) => {
                  const canAfford =
                    parseInt(summary?.availableRewards || "0") >= reward.cost;
                  return (
                    <div key={reward.id} className={styles.rewardCard}>
                      <div className={styles.rewardIcon}>{reward.icon}</div>
                      <div className={styles.rewardInfo}>
                        <h3 className={styles.rewardName}>{reward.name}</h3>
                        <p className={styles.rewardDescription}>
                          {reward.description}
                        </p>
                        <div className={styles.rewardCost}>
                          <span className={styles.costLabel}>Cost:</span>
                          <span className={styles.costValue}>
                            {reward.cost} BDT
                          </span>
                        </div>
                      </div>
                      <button
                        className={`${styles.redeemButton} ${
                          !canAfford ? styles.disabled : ""
                        } ${loading ? styles.loading : ""}`}
                        onClick={() => handleRedeemReward(reward)}
                        disabled={!canAfford || loading}
                      >
                        {!canAfford ? "Insufficient Tokens" : "Redeem"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {rewardItems.length === 0 && (
                <div className={styles.emptyState}>
                  <p>No rewards available at this time. Check back later!</p>
                </div>
              )}
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === "feedback" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>⭐</span>
                Donation Feedback
              </h2>
              <p className={styles.description}>
                Provide feedback for your donations to earn bonus rewards and
                help improve the donation experience.
              </p>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Donation Index</label>
                  <input
                    className={styles.input}
                    type="number"
                    value={feedbackDonationIndex}
                    onChange={(e) => setFeedbackDonationIndex(e.target.value)}
                    placeholder="0"
                    min="0"
                    max={Math.max(0, summary.historyLength - 1).toString()}
                  />
                  <small className={styles.fieldHint}>
                    Select donation (0 to{" "}
                    {Math.max(0, summary.historyLength - 1)})
                  </small>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Rating (1-5)</label>
                  <select
                    className={styles.select}
                    value={feedbackRating}
                    onChange={(e) => setFeedbackRating(e.target.value)}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} Star{rating !== 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    Additional Comments (Optional)
                  </label>
                  <input
                    className={styles.input}
                    value={feedbackHash}
                    onChange={(e) => setFeedbackHash(e.target.value)}
                    placeholder="Any additional feedback..."
                  />
                </div>
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={`${styles.primaryButton} ${
                    loading ? styles.loading : ""
                  }`}
                  onClick={handleProvideFeedback}
                  disabled={
                    !feedbackDonationIndex ||
                    loading ||
                    summary.historyLength === 0
                  }
                >
                  {loading ? "Processing..." : "Submit Feedback"}
                </button>
              </div>
            </div>
          )}

          {/* RESEARCH CONSENT TAB COMMENTED OUT
          {activeTab === "consent" && (
            <>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>🔬</span>
                  Grant Research Consent
                </h2>
                <p className={styles.description}>
                  Allow verified research institutions to access your anonymized
                  donation data for medical research.
                </p>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Research Institution Address
                    </label>
                    <input
                      className={styles.input}
                      value={researchInstitution}
                      onChange={(e) => setResearchInstitution(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.label}>Research Purpose</label>
                    <input
                      className={styles.input}
                      value={researchPurpose}
                      onChange={(e) => setResearchPurpose(e.target.value)}
                      placeholder="Describe the research purpose..."
                    />
                  </div>
                </div>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.primaryButton} ${
                      loading ? styles.loading : ""
                    }`}
                    onClick={handleGrantConsent}
                    disabled={
                      !researchInstitution || !researchPurpose || loading
                    }
                  >
                    {loading ? "Processing..." : "Grant Consent"}
                  </button>
                </div>
              </div>

              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>📋</span>
                  Active Research Consents
                </h2>
                {summary.consents.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No research consents granted yet.</p>
                  </div>
                ) : (
                  <div className={styles.consentList}>
                    {summary.consents.map((consent, index) => (
                      <div key={index} className={styles.consentCard}>
                        <div className={styles.consentHeader}>
                          <div className={styles.consentInfo}>
                            <span className={styles.consentInstitution}>
                              {formatAddress(consent.researchInstitution)}
                            </span>
                            <span
                              className={`${styles.consentStatus} ${
                                consent.isActive
                                  ? styles.active
                                  : styles.revoked
                              }`}
                            >
                              {consent.isActive ? "Active" : "Revoked"}
                            </span>
                          </div>
                        </div>
                        <div className={styles.consentDetails}>
                          <p className={styles.consentPurpose}>
                            {consent.researchPurpose}
                          </p>
                          <div className={styles.consentDates}>
                            <span>
                              Granted: {formatDate(consent.grantedDate)}
                            </span>
                            {consent.revokedDate > 0 && (
                              <span>
                                Revoked: {formatDate(consent.revokedDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        {consent.isActive && (
                          <div className={styles.consentActions}>
                            <button
                              className={styles.revokeButton}
                              onClick={() =>
                                handleRevokeConsent(consent.researchInstitution)
                              }
                              disabled={loading}
                            >
                              Revoke Consent
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          */}

          {/* History Tab */}
          {activeTab === "history" && (
            <>
              {/* Statistics Card */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>📈</span>
                  Donation Statistics
                </h2>
                <div className={styles.historyStats}>
                  <div className={styles.historyStatCard}>
                    <span className={styles.historyStatValue}>
                      {summary.historyLength}
                    </span>
                    <span className={styles.historyStatLabel}>
                      Total Donations
                    </span>
                  </div>
                  <div className={styles.historyStatCard}>
                    <span className={styles.historyStatValue}>
                      {summary.donor.consistencyScore}%
                    </span>
                    <span className={styles.historyStatLabel}>
                      Consistency Score
                    </span>
                  </div>
                  <div className={styles.historyStatCard}>
                    <span className={styles.historyStatValue}>
                      {tierNames[summary.donor.donorTier]}
                    </span>
                    <span className={styles.historyStatLabel}>
                      Current Tier
                    </span>
                  </div>
                  <div className={styles.historyStatCard}>
                    <span className={styles.historyStatValue}>
                      {summary.donor.firstDonationDate > 0
                        ? formatDate(summary.donor.firstDonationDate)
                        : "N/A"}
                    </span>
                    <span className={styles.historyStatLabel}>
                      First Donation
                    </span>
                  </div>
                </div>
              </div>

              {/* History Controls */}
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  <span className={styles.cardIcon}>📋</span>
                  Donation History
                </h2>

                {summary.historyLength === 0 ? (
                  <div className={styles.emptyState}>
                    <p>
                      No donations recorded yet. Visit a blood unit to make your
                      first donation!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={styles.historyControls}>
                      <p className={styles.description}>
                        You have {summary.historyLength} donation
                        {summary.historyLength !== 1 ? "s" : ""} on record.
                        {showDetailedHistory
                          ? " View your detailed donation history below:"
                          : ""}
                      </p>
                      <div className={styles.actionButtons}>
                        {!showDetailedHistory ? (
                          <button
                            className={`${styles.primaryButton} ${
                              loadingHistory ? styles.loading : ""
                            }`}
                            onClick={fetchDonationHistory}
                            disabled={loadingHistory}
                          >
                            {loadingHistory
                              ? "Loading..."
                              : "View Detailed History"}
                          </button>
                        ) : (
                          <button
                            className={styles.button}
                            onClick={() => setShowDetailedHistory(false)}
                          >
                            Hide Details
                          </button>
                        )}
                        <button
                          className={styles.button}
                          onClick={exportDonationHistory}
                          disabled={donationHistory.length === 0}
                        >
                          Export Data
                        </button>
                      </div>
                    </div>

                    {/* Detailed History Display */}
                    {showDetailedHistory && donationHistory.length > 0 && (
                      <div className={styles.historyDetails}>
                        <div className={styles.historyHeader}>
                          <h3>Detailed Donation Records</h3>
                          <span className={styles.recordCount}>
                            {donationHistory.length} record
                            {donationHistory.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className={styles.donationRecords}>
                          {donationHistory
                            .slice(
                              (currentPage - 1) * recordsPerPage,
                              currentPage * recordsPerPage
                            )
                            .map((record) => (
                              <div
                                key={record.index}
                                className={styles.donationRecord}
                              >
                                <div className={styles.recordHeader}>
                                  <div className={styles.recordNumber}>
                                    #{record.index + 1}
                                  </div>
                                  <div className={styles.recordDate}>
                                    {formatDateTime(record.timestamp)}
                                  </div>
                                  <div
                                    className={`${styles.recordStatus} ${
                                      record.feedbackProvided
                                        ? styles.complete
                                        : styles.pending
                                    }`}
                                  >
                                    {record.feedbackProvided
                                      ? "✅ Feedback Given"
                                      : "⏳ Feedback Pending"}
                                  </div>
                                </div>

                                <div className={styles.recordDetails}>
                                  <div className={styles.recordDetail}>
                                    <span className={styles.detailLabel}>
                                      Blood Unit:
                                    </span>
                                    <span className={styles.detailValue}>
                                      {formatAddress(record.bloodUnit)}
                                      <button
                                        className={styles.copyButton}
                                        onClick={() =>
                                          copyToClipboard(
                                            record.bloodUnit,
                                            "Blood unit address"
                                          )
                                        }
                                        title="Copy full address"
                                      >
                                        📋
                                      </button>
                                    </span>
                                  </div>

                                  <div className={styles.recordDetail}>
                                    <span className={styles.detailLabel}>
                                      Volume:
                                    </span>
                                    <span className={styles.detailValue}>
                                      {record.volume} ml
                                    </span>
                                  </div>

                                  <div className={styles.recordDetail}>
                                    <span className={styles.detailLabel}>
                                      Hemoglobin:
                                    </span>
                                    <span className={styles.detailValue}>
                                      {(record.hemoglobinLevel / 10).toFixed(1)}{" "}
                                      g/dL
                                    </span>
                                  </div>

                                  <div className={styles.recordDetail}>
                                    <span className={styles.detailLabel}>
                                      Record Hash:
                                    </span>
                                    <span className={styles.detailValue}>
                                      {record.recordHash.slice(0, 10)}...
                                      {record.recordHash.slice(-8)}
                                      <button
                                        className={styles.copyButton}
                                        onClick={() =>
                                          copyToClipboard(
                                            record.recordHash,
                                            "Record hash"
                                          )
                                        }
                                        title="Copy full hash"
                                      >
                                        📋
                                      </button>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {donationHistory.length > recordsPerPage && (
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
                            <span className={styles.paginationInfo}>
                              Page {currentPage} of{" "}
                              {Math.ceil(
                                donationHistory.length / recordsPerPage
                              )}
                            </span>
                            <button
                              className={styles.paginationButton}
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(
                                    prev + 1,
                                    Math.ceil(
                                      donationHistory.length / recordsPerPage
                                    )
                                  )
                                )
                              }
                              disabled={
                                currentPage ===
                                Math.ceil(
                                  donationHistory.length / recordsPerPage
                                )
                              }
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Registration Popup */}
      {showRegistrationPopup && (
        <div
          className={styles.popupOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setShowRegistrationPopup(false);
            }
          }}
        >
          <div className={styles.popupContent}>
            <div className={styles.popupHeader}>
              <h2 className={styles.popupTitle}>Complete Your Registration</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowRegistrationPopup(false)}
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <div className={styles.popupBody}>
              <p className={styles.popupDescription}>
                Please provide your personal information to complete your donor
                registration. This information will be securely stored and used
                for donor verification.
              </p>

              <div className={styles.registrationForm}>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Full Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`${styles.input} ${
                        registrationErrors.name ? styles.inputError : ""
                      }`}
                      placeholder="Enter your full name"
                      value={registrationData.name}
                      onChange={(e) =>
                        handleRegistrationInputChange("name", e.target.value)
                      }
                      disabled={loading}
                    />
                    {registrationErrors.name && (
                      <span className={styles.errorMessage}>
                        {registrationErrors.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Email Address <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      className={`${styles.input} ${
                        registrationErrors.email ? styles.inputError : ""
                      }`}
                      placeholder="Enter your email address"
                      value={registrationData.email}
                      onChange={(e) =>
                        handleRegistrationInputChange("email", e.target.value)
                      }
                      disabled={loading}
                    />
                    {registrationErrors.email && (
                      <span className={styles.errorMessage}>
                        {registrationErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Phone Number <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="tel"
                      className={`${styles.input} ${
                        registrationErrors.phoneNumber ? styles.inputError : ""
                      }`}
                      placeholder="Enter your phone number"
                      value={registrationData.phoneNumber}
                      onChange={(e) =>
                        handleRegistrationInputChange(
                          "phoneNumber",
                          e.target.value
                        )
                      }
                      disabled={loading}
                    />
                    {registrationErrors.phoneNumber && (
                      <span className={styles.errorMessage}>
                        {registrationErrors.phoneNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Password</label>
                    <input
                      type="password"
                      className={`${styles.input} ${
                        registrationErrors.password ? styles.inputError : ""
                      }`}
                      placeholder="Enter your password"
                      value={registrationData.password}
                      onChange={(e) =>
                        handleRegistrationInputChange(
                          "password",
                          e.target.value
                        )
                      }
                      disabled={loading}
                    />
                    {registrationErrors.password && (
                      <span className={styles.errorMessage}>
                        {registrationErrors.password}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.selectedBloodType}>
                  <span className={styles.bloodTypeLabel}>
                    Selected Blood Type:
                  </span>
                  <span className={styles.bloodTypeValue}>{bloodType}</span>
                </div>
              </div>
            </div>

            <div className={styles.popupFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowRegistrationPopup(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={`${styles.submitButton} ${
                  loading ? styles.loading : ""
                }`}
                onClick={handleRegistrationSubmit}
                disabled={loading}
              >
                {loading ? "Processing..." : "Complete Registration"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Popup */}
      {showLoginPopup && (
        <div
          className={styles.popupOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) {
              setShowLoginPopup(false);
            }
          }}
        >
          <div className={styles.popupContent}>
            <div className={styles.popupHeader}>
              <h2 className={styles.popupTitle}>Welcome Back</h2>
              <button
                className={styles.closeButton}
                onClick={() => setShowLoginPopup(false)}
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <div className={styles.popupBody}>
              <p className={styles.popupDescription}>
                Please enter your credentials to access your donor account.
              </p>

              <div className={styles.registrationForm}>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Email Address <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      className={`${styles.input} ${
                        loginErrors.email ? styles.inputError : ""
                      }`}
                      placeholder="Enter your email address"
                      value={loginData.email}
                      onChange={(e) =>
                        handleLoginInputChange("email", e.target.value)
                      }
                      disabled={loading}
                    />
                    {loginErrors.email && (
                      <span className={styles.errorMessage}>
                        {loginErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Password</label>
                    <input
                      type="password"
                      className={`${styles.input} ${
                        loginErrors.password ? styles.inputError : ""
                      }`}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) =>
                        handleLoginInputChange("password", e.target.value)
                      }
                      disabled={loading}
                    />
                    {loginErrors.password && (
                      <span className={styles.errorMessage}>
                        {loginErrors.password}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.loginOptions}>
                  <button
                    className={styles.forgotPasswordButton}
                    onClick={() => {
                      toast("Password reset feature coming soon!", {
                        icon: "ℹ️",
                      });
                    }}
                    disabled={loading}
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.popupFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowLoginPopup(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={`${styles.submitButton} ${
                  loading ? styles.loading : ""
                }`}
                onClick={handleLoginSubmit}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>

            <div className={styles.popupFooterNote}>
              <p>
                Don&apos;t have an account?{" "}
                <button
                  className={styles.switchFormButton}
                  onClick={() => {
                    setShowLoginPopup(false);
                    setShowRegistrationPopup(true);
                  }}
                  disabled={loading}
                >
                  Register here
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reward Redemption Confirmation Modal */}
      {showRedemptionModal && selectedReward && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <div className={styles.popupHeader}>
              <h2 className={styles.popupTitle}>Confirm Redemption</h2>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setShowRedemptionModal(false);
                  setSelectedReward(null);
                }}
                disabled={loading}
              >
                ✕
              </button>
            </div>

            <div className={styles.popupBody}>
              <div className={styles.rewardPreview}>
                <div className={styles.rewardPreviewIcon}>
                  {selectedReward.icon}
                </div>
                <div className={styles.rewardPreviewInfo}>
                  <h3 className={styles.rewardPreviewName}>
                    {selectedReward.name}
                  </h3>
                  <p className={styles.rewardPreviewDescription}>
                    {selectedReward.description}
                  </p>
                  <div className={styles.rewardPreviewCost}>
                    <span className={styles.costLabel}>Cost:</span>
                    <span className={styles.costValue}>
                      {selectedReward.cost} BDT
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.confirmationDetails}>
                <p className={styles.confirmationText}>
                  Are you sure you want to redeem this reward? The tokens will
                  be transferred to the admin wallet and cannot be reversed.
                </p>
                <div className={styles.balanceInfo}>
                  <span>
                    Current Balance: {summary?.availableRewards || "0"} BDT
                  </span>
                  <span>
                    After Redemption:{" "}
                    {parseInt(summary?.availableRewards || "0") -
                      selectedReward.cost}{" "}
                    BDT
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.popupFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => {
                  setShowRedemptionModal(false);
                  setSelectedReward(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className={`${styles.submitButton} ${
                  loading ? styles.loading : ""
                }`}
                onClick={confirmRedemption}
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm Redemption"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
