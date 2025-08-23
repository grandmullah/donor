"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { getBrowserProvider, getContract } from "@/lib/eth";
import BloodDonorSystemABI from "@/lib/abis/BloodDonorSystem";
import { ENV } from "@/lib/env";
import toast from "react-hot-toast";
import styles from "./page.module.css";

type DonorInfo = {
  bloodType: string;
  donationCount: number;
  donorTier: number;
  consistencyScore: number;
  hasCompleteResearchProfile: boolean;
  isRegistered: boolean;
  totalRewardsEarned: string;
  rewardsRedeemed: string;
  firstDonationDate: number;
  lastDonationDate: number;
};

type ResearchConsent = {
  researchInstitution: string;
  grantedDate: number;
  revokedDate: number;
  isActive: boolean;
  researchPurpose: string;
};

type DonorSummary = {
  anonymousId: string;
  donor: DonorInfo;
  historyLength: number;
  availableRewards: string;
  consents: ResearchConsent[];
} | null;

export default function DonorPage() {
  const { address, switchToAddress } = useWallet();
  const [bloodType, setBloodType] = useState("O+");
  const [salt] = useState<string>("0"); // Fixed to default value 0
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Feedback form states
  const [feedbackDonationIndex, setFeedbackDonationIndex] =
    useState<string>("");
  const [feedbackRating, setFeedbackRating] = useState<string>("5");
  const [feedbackHash, setFeedbackHash] = useState<string>("");

  // Research consent states
  const [researchInstitution, setResearchInstitution] = useState<string>("");
  const [researchPurpose, setResearchPurpose] = useState<string>("");

  const [summary, setSummary] = useState<DonorSummary>(null);

  const anonId = useMemo(
    () => summary?.anonymousId as string | undefined,
    [summary]
  );

  const tierNames = ["Unranked", "Bronze", "Silver", "Gold", "Platinum"];
  const tierColors = ["#6b7280", "#cd7f32", "#c0c0c0", "#ffd700", "#e5e4e2"];

  useEffect(() => {
    const load = async () => {
      if (!address) return;
      try {
        const url = `/api/donor/summary?address=${address}&salt=${salt || "0"}`;
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) setSummary(data);
      } catch {}
    };
    load();
  }, [address, salt]);

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
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS) {
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
        ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
        BloodDonorSystemABI,
        signer
      );
      const tx = await sys.registerDonor(bloodType, BigInt(salt || "0"));

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
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS || !anonId) return;

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
        ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
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

  const handleRedeem = async () => {
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS || !summary) return;

    setLoading(true);
    const toastId = toast.loading("Redeeming rewards...");

    try {
      const provider = await getBrowserProvider();
      const signer = await provider.getSigner();
      const sys = getContract(
        ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
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

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard! 📋`);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Rare Blood Donor Portal</h1>
        <p className={styles.subtitle}>
          Manage your blood donations, track rewards, and contribute to
          life-saving research
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
                {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((t) => (
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
              onClick={handleRegister}
              disabled={!bloodType || loading}
            >
              {loading ? "Processing..." : "Register as Donor"}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.stack}>
          {/* Tab Navigation */}
          <div className={styles.tabNav}>
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "feedback", label: "Feedback", icon: "⭐" },
              { id: "consent", label: "Research Consent", icon: "🔬" },
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
                  <div className={styles.statCard}>
                    <span className={styles.statValue}>
                      {summary.consents.length}
                    </span>
                    <span className={styles.statLabel}>Research Consents</span>
                  </div>
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

          {/* Research Consent Tab */}
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

          {/* History Tab */}
          {activeTab === "history" && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>
                <span className={styles.cardIcon}>📈</span>
                Donation History
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
                  <span className={styles.historyStatLabel}>Current Tier</span>
                </div>
              </div>
              {summary.historyLength === 0 ? (
                <div className={styles.emptyState}>
                  <p>
                    No donations recorded yet. Visit a blood unit to make your
                    first donation!
                  </p>
                </div>
              ) : (
                <div className={styles.historyInfo}>
                  <p className={styles.description}>
                    You have {summary.historyLength} donation
                    {summary.historyLength !== 1 ? "s" : ""} on record. Detailed
                    donation records are available through the blood unit portal
                    where your donations were processed.
                  </p>
                  <div className={styles.actionButtons}>
                    <button className={styles.button}>
                      View Detailed History
                    </button>
                    <button className={styles.button}>Export Data</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
