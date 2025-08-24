// "use client";

// import { useState, useEffect } from "react";
// import { useWallet } from "@/contexts/WalletContext";
// import { getBrowserProvider, getPublicProvider, getContract } from "@/lib/eth";
// import DonorDAOGovernanceABI from "@/lib/abis/DonorDAOGovernance";
// import BloodDonorSystemABI from "@/lib/abis/BloodDonorSystem";
// import { ENV } from "@/lib/env";
// import styles from "./page.module.css";

// RESEARCH FUNCTIONALITY COMMENTED OUT
export default function ResearchPage() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Research Portal</h1>
      <p>Research functionality is currently disabled.</p>
      <p>This feature is temporarily unavailable.</p>
    </main>
  );
}

/*
// ORIGINAL RESEARCH PAGE FUNCTIONALITY - ALL COMMENTED OUT
function OriginalResearchPage() {
  const { address, switchToAddress } = useWallet();

  // Institution verification
  const [institution, setInstitution] = useState<string>("");
  const [verified, setVerified] = useState<string>("");

  // Research consent management
  const [researchInstitution, setResearchInstitution] = useState<string>("");
  const [researchPurpose, setResearchPurpose] = useState<string>("");
  const [revokeInstitution, setRevokeInstitution] = useState<string>("");

  // Data access
  const [anonymousId, setAnonymousId] = useState<string>("");
  const [recordIndex, setRecordIndex] = useState<string>("0");
  const [profileAnonymousId, setProfileAnonymousId] = useState<string>("");

  // Research consents display
  const [consentsAnonymousId, setConsentsAnonymousId] = useState<string>("");
  const [consentsData, setConsentsData] = useState<
    {
      researchInstitution: string;
      researchPurpose: string;
      grantedDate: bigint;
      revokedDate: bigint;
      isActive: boolean;
    }[]
  >([]);

  // Access control
  const [isVerifiedResearcher, setIsVerifiedResearcher] = useState(false);
  const [isInstitutionVerified, setIsInstitutionVerified] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Check access permissions on mount
  useEffect(() => {
    if (address) {
      checkAccessPermissions();
    } else {
      setIsVerifiedResearcher(false);
      setIsInstitutionVerified(false);
      setCheckingAccess(false);
    }
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkAccessPermissions = async () => {
    if (!address) {
      setIsVerifiedResearcher(false);
      setIsInstitutionVerified(false);
      setCheckingAccess(false);
      return;
    }

    // Known admin wallet address (has all permissions)
    const KNOWN_ADMIN_WALLET = "0xFB42A0d228609942ccd685E0D9ceF1825F26Cb78";

    // Quick check for known admin wallet
    if (address.toLowerCase() === KNOWN_ADMIN_WALLET.toLowerCase()) {
      console.log("✅ Recognized admin wallet, granting full research access");
      setIsVerifiedResearcher(true);
      setIsInstitutionVerified(true);
      setStatus("✅ Admin wallet recognized - Full research access granted!");
      setCheckingAccess(false);
      return;
    }

    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS || !ENV.DAO_GOVERNANCE_ADDRESS) {
      console.error("Contract addresses not configured");
      setStatus(
        "Contract addresses not configured. Please check environment variables."
      );
      setIsVerifiedResearcher(false);
      setIsInstitutionVerified(false);
      setCheckingAccess(false);
      return;
    }

    setCheckingAccess(true);
    console.log("Checking research access for address:", address);
    console.log("Blood Donor System Address:", ENV.BLOOD_DONOR_SYSTEM_ADDRESS);
    console.log("DAO Governance Address:", ENV.DAO_GOVERNANCE_ADDRESS);

    try {
      const provider = await getBrowserProvider();
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.chainId.toString());

      // Verify we're on BSC Mainnet
      if (network.chainId.toString() !== "56") {
        setStatus(
          `⚠️ Wrong network! Please switch to BSC Mainnet (Chain ID: 56). Current: ${network.chainId}`
        );
        setIsVerifiedResearcher(false);
        setIsInstitutionVerified(false);
        return;
      }

      // Test basic contract connectivity first
      const sysCode = await provider.getCode(ENV.BLOOD_DONOR_SYSTEM_ADDRESS);
      const govCode = await provider.getCode(ENV.DAO_GOVERNANCE_ADDRESS);

      console.log("System contract code exists:", sysCode !== "0x");
      console.log("Governance contract code exists:", govCode !== "0x");

      if (sysCode === "0x" && govCode === "0x") {
        setStatus(
          "⚠️ No contracts found at specified addresses. Please verify contract deployment."
        );
        setIsVerifiedResearcher(false);
        setIsInstitutionVerified(false);
        return;
      }

      // Standard OpenZeppelin VERIFIED_RESEARCHER role
      const VERIFIED_RESEARCHER =
        "0x7b765e0e932d348852a6f810bfa1ab891e259123f02db8cdcde614c570223357";
      console.log("Using VERIFIED_RESEARCHER role:", VERIFIED_RESEARCHER);

      let hasResearcherRole = false;
      let isInstitution = false;
      let sysError = null;
      let govError = null;

      // Try System contract for researcher role
      if (sysCode !== "0x") {
        try {
          const sys = getContract(
            ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
            BloodDonorSystemABI,
            provider
          );
          hasResearcherRole = await sys.hasRole(VERIFIED_RESEARCHER, address);
          console.log(
            "Has VERIFIED_RESEARCHER role on System contract:",
            hasResearcherRole
          );
        } catch (error) {
          sysError = error;
          console.error("Error checking System contract:", error);
        }
      }

      // Try Governance contract for institution verification
      if (govCode !== "0x") {
        try {
          const gov = getContract(
            ENV.DAO_GOVERNANCE_ADDRESS,
            DonorDAOGovernanceABI,
            provider
          );
          isInstitution = await gov.isVerifiedResearchInstitution(address);
          console.log(
            "Is verified institution on Governance contract:",
            isInstitution
          );
        } catch (error) {
          govError = error;
          console.error("Error checking Governance contract:", error);
        }
      }

      console.log("Final research access status:", {
        hasResearcherRole,
        isInstitution,
      });

      setIsVerifiedResearcher(hasResearcherRole);
      setIsInstitutionVerified(isInstitution);

      if (hasResearcherRole || isInstitution) {
        setStatus("Research access verified successfully! 🎉");
      } else if (sysError && govError) {
        setStatus(
          `⚠️ Could not verify research status on either contract. System error: ${
            sysError instanceof Error ? sysError.message : "Unknown"
          }. Governance error: ${
            govError instanceof Error ? govError.message : "Unknown"
          }.`
        );
      } else if (sysError || govError) {
        const error = sysError || govError;
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        setStatus(
          `⚠️ Partial check completed. One contract failed: ${errorMsg}. Research status: ${
            hasResearcherRole || isInstitution ? "GRANTED" : "LIMITED"
          }.`
        );
      } else {
        setStatus("⚠️ Limited access - No research privileges found.");
      }
    } catch (error) {
      console.error("Failed to check research access:", error);
      setStatus(
        `Error checking research access: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setIsVerifiedResearcher(false);
      setIsInstitutionVerified(false);
    } finally {
      setCheckingAccess(false);
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
      return signer;
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setStatus("❌ Failed to connect to wallet");
      return null;
    }
  };

  const check = async () => {
    if (!ENV.DAO_GOVERNANCE_ADDRESS) {
      setVerified("Governance contract not configured");
      return;
    }

    setLoading(true);
    try {
      setVerified("Checking verification status...");
      const provider = getPublicProvider();
      const gov = getContract(
        ENV.DAO_GOVERNANCE_ADDRESS,
        DonorDAOGovernanceABI,
        provider
      );
      const isVerified = await gov.isVerifiedResearchInstitution(institution);
      setVerified(
        isVerified
          ? "✅ Verified research institution"
          : "❌ Institution not verified"
      );
    } catch (e: unknown) {
      setVerified(
        e instanceof Error
          ? `Error: ${e.message}`
          : "Failed to check verification"
      );
    } finally {
      setLoading(false);
    }
  };

  const grantResearchConsent = async () => {
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS) {
      setStatus("Blood donor system not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const signer = await getValidatedSigner();
      if (!signer) {
        setLoading(false);
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
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Research consent granted successfully! 🎉");
      setResearchInstitution("");
      setResearchPurpose("");
    } catch (e: unknown) {
      setStatus(
        e instanceof Error ? e.message : "Failed to grant research consent"
      );
    } finally {
      setLoading(false);
    }
  };

  const revokeResearchConsent = async () => {
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS) {
      setStatus("Blood donor system not configured");
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const signer = await getValidatedSigner();
      if (!signer) {
        setLoading(false);
        return;
      }

      const sys = getContract(
        ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
        BloodDonorSystemABI,
        signer
      );

      const tx = await sys.revokeResearchConsent(revokeInstitution);
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Research consent revoked successfully! 🎉");
      setRevokeInstitution("");
    } catch (e: unknown) {
      setStatus(
        e instanceof Error ? e.message : "Failed to revoke research consent"
      );
    } finally {
      setLoading(false);
    }
  };

  const accessResearchData = async () => {
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS) {
      setStatus("Blood donor system not configured");
      return;
    }

    if (!isVerifiedResearcher && !isInstitutionVerified) {
      setStatus(
        "❌ Access denied: You must be a verified researcher or institution"
      );
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const signer = await getValidatedSigner();
      if (!signer) {
        setLoading(false);
        return;
      }

      const sys = getContract(
        ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
        BloodDonorSystemABI,
        signer
      );

      const tx = await sys.accessResearchData(anonymousId, BigInt(recordIndex));
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Research data accessed successfully! 🎉");
    } catch (e: unknown) {
      setStatus(
        e instanceof Error ? e.message : "Failed to access research data"
      );
    } finally {
      setLoading(false);
    }
  };

  const completeResearchProfile = async () => {
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS) {
      setStatus("Blood donor system not configured");
      return;
    }

    if (!isVerifiedResearcher && !isInstitutionVerified) {
      setStatus(
        "❌ Access denied: You must be a verified researcher or institution"
      );
      return;
    }

    setLoading(true);
    try {
      setStatus("Requesting signature...");
      const signer = await getValidatedSigner();
      if (!signer) {
        setLoading(false);
        return;
      }

      const sys = getContract(
        ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
        BloodDonorSystemABI,
        signer
      );

      const tx = await sys.completeResearchProfile(profileAnonymousId);
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Research profile completed successfully! 🎉");
      setProfileAnonymousId("");
    } catch (e: unknown) {
      setStatus(
        e instanceof Error ? e.message : "Failed to complete research profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadResearchConsents = async () => {
    if (!ENV.BLOOD_DONOR_SYSTEM_ADDRESS || !consentsAnonymousId) {
      setStatus("Please enter an anonymous ID");
      return;
    }

    setLoading(true);
    try {
      const provider = getPublicProvider();
      const sys = getContract(
        ENV.BLOOD_DONOR_SYSTEM_ADDRESS,
        BloodDonorSystemABI,
        provider
      );

      const consents = await sys.getResearchConsents(consentsAnonymousId);
      setConsentsData(consents);
      setStatus(`Loaded ${consents.length} research consents`);
    } catch (e: unknown) {
      setStatus(
        e instanceof Error ? e.message : "Failed to load research consents"
      );
      setConsentsData([]);
    } finally {
      setLoading(false);
    }
  };

// ORIGINAL RESEARCH COMPONENT COMMENTED OUT - ALL FUNCTIONALITY DISABLED

// return (
//   <main className={styles.container}>
//     <div className={styles.hero}>
//       <h1 className={styles.title}>Research Portal</h1>
//       <p className={styles.subtitle}>
//         Verify research institutions and access anonymized blood donation data
//         for medical research
//       </p>
//     </div>

//     {!address ? (
//       <div className={styles.connectWrapper}>
//         <div className={styles.connectMessage}>
//           <h3>Connect Your Wallet</h3>
//           <p>
//             Please connect your wallet using the button in the header to
//             access the research portal.
//           </p>
//         </div>
//       </div>
//     ) : checkingAccess ? (
//       <div className={styles.connectWrapper}>
//         <div className={styles.connectMessage}>
//           <h3>Verifying Research Access...</h3>
//           <p>Checking your research permissions...</p>
//         </div>
//       </div>
//     ) : (
//       <div className={styles.stack}>
//         // Access Status
//         <div className={styles.card}>
//           <div className={styles.adminStatus}>
//             <span
//               className={`${styles.adminBadge} ${
//                 isVerifiedResearcher || isInstitutionVerified
//                   ? styles.success
//                   : styles.warning
//               }`}
//             >
//               {isVerifiedResearcher
//                 ? "✅ Verified Researcher"
//                 : isInstitutionVerified
//                 ? "✅ Verified Institution"
//                 : "⚠️ Limited Access"}
//             </span>
//             <span className={styles.adminAddress}>
//               Connected as: {address}
//             </span>
//           </div>
//         </div>

//         // Institution Verification
//         <div className={styles.card}>
//           <h2 className={styles.cardTitle}>
//             <span className={styles.cardIcon}>🔬</span>
//             Institution Verification
//           </h2>
//           <p className={styles.description}>
//             Check if a research institution is verified to access anonymized
//             donor data.
//           </p>
//           <div className={styles.formGrid}>
//             <div className={styles.formField}>
//               <label className={styles.label}>Institution Address</label>
//               <input
//                 className={styles.input}
//                 value={institution}
//                 onChange={(e) => setInstitution(e.target.value)}
//                 placeholder="0x..."
//               />
//             </div>
//           </div>
//           <div className={styles.actionButtons}>
//             <button
//               className={`${styles.primaryButton} ${
//                 loading ? styles.loading : ""
//               }`}
//               onClick={check}
//               disabled={loading || !institution}
//             >
//               {loading ? "Checking..." : "Check Verification"}
//             </button>
//           </div>
//           {verified && (
//             <div
//               className={`${styles.status} ${
//                 verified.includes("✅")
//                   ? styles.success
//                   : verified.includes("❌")
//                   ? styles.error
//                   : ""
//               }`}
//             >
//               {verified}
//             </div>
//           )}
//         </div>

//         // Research Consent Management - For Donors
//         <div className={styles.card}>
//           <h2 className={styles.cardTitle}>
//             <span className={styles.cardIcon}>📋</span>
//             Research Consent Management
//           </h2>
//           <p className={styles.description}>
//             Grant or revoke consent for research institutions to access your
//             anonymized data.
//           </p>

//           <div className={styles.subSection}>
//             <h3>Grant Research Consent</h3>
//             <div className={styles.formGrid}>
//               <div className={styles.formField}>
//                 <label className={styles.label}>
//                   Research Institution Address
//                 </label>
//                 <input
//                   className={styles.input}
//                   value={researchInstitution}
//                   onChange={(e) => setResearchInstitution(e.target.value)}
//                   placeholder="0x..."
//                 />
//               </div>
//               <div className={styles.formField}>
//                 <label className={styles.label}>Research Purpose</label>
//                 <textarea
//                   className={styles.input}
//                   value={researchPurpose}
//                   onChange={(e) => setResearchPurpose(e.target.value)}
//                   placeholder="Describe the research purpose..."
//                   rows={3}
//                 />
//               </div>
//             </div>
//             <div className={styles.actionButtons}>
//               <button
//                 className={`${styles.primaryButton} ${
//                   loading ? styles.loading : ""
//                 }`}
//                 onClick={grantResearchConsent}
//                 disabled={loading || !researchInstitution || !researchPurpose}
//               >
//                 {loading ? "Processing..." : "Grant Consent"}
//               </button>
//             </div>
//           </div>

//           <div className={styles.subSection}>
//             <h3>Revoke Research Consent</h3>
//             <div className={styles.formGrid}>
//               <div className={styles.formField}>
//                 <label className={styles.label}>
//                   Institution Address to Revoke
//                 </label>
//                 <input
//                   className={styles.input}
//                   value={revokeInstitution}
//                   onChange={(e) => setRevokeInstitution(e.target.value)}
//                   placeholder="0x..."
//                 />
//               </div>
//             </div>
//             <div className={styles.actionButtons}>
//               <button
//                 className={`${styles.button} ${
//                   loading ? styles.loading : ""
//                 }`}
//                 onClick={revokeResearchConsent}
//                 disabled={loading || !revokeInstitution}
//               >
//                 {loading ? "Processing..." : "Revoke Consent"}
//               </button>
//             </div>
//           </div>
//         </div>

//         // Research Data Access - For Verified Researchers
//         {(isVerifiedResearcher || isInstitutionVerified) && (
//           <div className={styles.card}>
//             <h2 className={styles.cardTitle}>
//               <span className={styles.cardIcon}>📊</span>
//               Research Data Access
//             </h2>
//             <p className={styles.description}>
//               Access anonymized blood donation data for approved research
//               purposes.
//             </p>

//             <div className={styles.subSection}>
//               <h3>Access Research Data</h3>
//               <div className={styles.formGrid}>
//                 <div className={styles.formField}>
//                   <label className={styles.label}>Anonymous ID</label>
//                   <input
//                     className={styles.input}
//                     value={anonymousId}
//                     onChange={(e) => setAnonymousId(e.target.value)}
//                     placeholder="0x..."
//                   />
//                 </div>
//                 <div className={styles.formField}>
//                   <label className={styles.label}>Record Index</label>
//                   <input
//                     className={styles.input}
//                     type="number"
//                     value={recordIndex}
//                     onChange={(e) => setRecordIndex(e.target.value)}
//                     placeholder="0"
//                   />
//                 </div>
//               </div>
//               <div className={styles.actionButtons}>
//                 <button
//                   className={`${styles.primaryButton} ${
//                     loading ? styles.loading : ""
//                   }`}
//                   onClick={accessResearchData}
//                   disabled={loading || !anonymousId}
//                 >
//                   {loading ? "Processing..." : "Access Data"}
//                 </button>
//               </div>
//             </div>

//             <div className={styles.subSection}>
//               <h3>Complete Research Profile</h3>
//               <div className={styles.formGrid}>
//                 <div className={styles.formField}>
//                   <label className={styles.label}>Anonymous ID</label>
//                   <input
//                     className={styles.input}
//                     value={profileAnonymousId}
//                     onChange={(e) => setProfileAnonymousId(e.target.value)}
//                     placeholder="0x..."
//                   />
//                 </div>
//               </div>
//               <div className={styles.actionButtons}>
//                 <button
//                   className={`${styles.button} ${
//                     loading ? styles.loading : ""
//                   }`}
//                   onClick={completeResearchProfile}
//                   disabled={loading || !profileAnonymousId}
//                 >
//                   {loading ? "Processing..." : "Complete Profile"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         // Research Consents Viewer
//         <div className={styles.card}>
//           <h2 className={styles.cardTitle}>
//             <span className={styles.cardIcon}>👁️</span>
//             View Research Consents
//           </h2>
//           <p className={styles.description}>
//             View all research consents for a specific anonymous ID.
//           </p>
//           <div className={styles.formGrid}>
//             <div className={styles.formField}>
//               <label className={styles.label}>Anonymous ID</label>
//               <input
//                 className={styles.input}
//                 value={consentsAnonymousId}
//                 onChange={(e) => setConsentsAnonymousId(e.target.value)}
//                 placeholder="0x..."
//               />
//             </div>
//           </div>
//           <div className={styles.actionButtons}>
//             <button
//               className={`${styles.primaryButton} ${
//                 loading ? styles.loading : ""
//               }`}
//               onClick={loadResearchConsents}
//               disabled={loading || !consentsAnonymousId}
//             >
//               {loading ? "Loading..." : "Load Consents"}
//             </button>
//           </div>

//           {consentsData.length > 0 && (
//             <div className={styles.consentsGrid}>
//               <h3>Research Consents ({consentsData.length})</h3>
//               {consentsData.map((consent, index) => (
//                 <div key={index} className={styles.consentCard}>
//                   <div className={styles.consentHeader}>
//                     <span
//                       className={`${styles.consentStatus} ${
//                         consent.isActive ? styles.active : styles.inactive
//                       }`}
//                     >
//                       {consent.isActive ? "🟢 Active" : "🔴 Inactive"}
//                     </span>
//                     <span className={styles.consentIndex}>#{index}</span>
//                   </div>
//                   <div className={styles.consentDetails}>
//                     <p>
//                       <strong>Institution:</strong>{" "}
//                       {consent.researchInstitution}
//                     </p>
//                     <p>
//                       <strong>Purpose:</strong> {consent.researchPurpose}
//                     </p>
//                     <p>
//                       <strong>Granted:</strong>{" "}
//                       {new Date(
//                         Number(consent.grantedDate) * 1000
//                       ).toLocaleDateString()}
//                     </p>
//                     {consent.revokedDate > 0 && (
//                       <p>
//                         <strong>Revoked:</strong>{" "}
//                         {new Date(
//                           Number(consent.revokedDate) * 1000
//                         ).toLocaleDateString()}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         // Restricted Access Notice
//         {!isVerifiedResearcher && !isInstitutionVerified && (
//           <div className={styles.card}>
//             <h2 className={styles.cardTitle}>
//               <span className={styles.cardIcon}>🔒</span>
//               Restricted Access
//             </h2>
//             <p className={styles.description}>
//               Some research functions require verified researcher status or
//               verified institution status. Contact the system administrator to
//               request research access permissions.
//             </p>
//             <div
//               style={{
//                 margin: "1rem 0",
//                 padding: "1rem",
//                 background: "rgba(255,255,255,0.1)",
//                 borderRadius: "8px",
//                 fontSize: "0.9rem",
//               }}
//             >
//               <strong>Debug Info:</strong>
//               <br />
//               Connected Address: {address}
//               <br />
//               System Contract: {ENV.BLOOD_DONOR_SYSTEM_ADDRESS}
//               <br />
//               Governance Contract: {ENV.DAO_GOVERNANCE_ADDRESS}
//               <br />
//               Status: {status}
//             </div>
//             <div className={styles.featureGrid}>
//               <div className={styles.featureCard}>
//                 <h3>🔬 Verified Researcher</h3>
//                 <p>Access research data and complete profiles</p>
//               </div>
//               <div className={styles.featureCard}>
//                 <h3>🏛️ Verified Institution</h3>
//                 <p>Institutional access to anonymized data</p>
//               </div>
//             </div>
//             <div className={styles.actionButtons}>
//               <button
//                 className={styles.button}
//                 onClick={checkAccessPermissions}
//                 disabled={checkingAccess}
//               >
//                 {checkingAccess ? "Checking..." : "Retry Access Check"}
//               </button>
//               <button
//                 className={styles.button}
//                 onClick={() => {
//                   setIsVerifiedResearcher(true);
//                   setIsInstitutionVerified(true);
//                   setStatus(
//                     "⚠️ TEMPORARY BYPASS ENABLED - For testing only!"
//                   );
//                 }}
//                 style={{ backgroundColor: "#dc2626" }}
//               >
//                 🚨 Bypass for Testing
//               </button>
//             </div>
//           </div>
//         )}

//         {status && (
//           <div
//             className={`${styles.status} ${
//               status.includes("🎉")
//                 ? styles.success
//                 : status.includes("❌") ||
//                   status.includes("Error") ||
//                   status.includes("Failed")
//                 ? styles.error
//                 : ""
//             }`}
//           >
//             {status}
//           </div>
//         )}
//       </div>
//     )}
//   </main>
// );
// }
*/
