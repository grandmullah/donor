import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Revolutionizing Blood Donation</h1>
          <p className={styles.heroSubtitle}>
            A blockchain-powered platform that rewards donors, enables research,
            and saves lives through transparent, privacy-focused blood donation
            management.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/donor" className={styles.ctaPrimary}>
              Start Donating
            </Link>
            <Link href="/research" className={styles.ctaButton}>
              For Researchers
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <h2 className={styles.featuresTitle}>Why Choose Betzone?</h2>
          <p className={styles.featuresSubtitle}>
            Experience the future of blood donation with our innovative
            Web3-powered platform
          </p>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎁</div>
              <h3 className={styles.featureTitle}>Earn Rewards</h3>
              <p className={styles.featureDescription}>
                Get BDT tokens for every donation. Rare blood types and
                consistent donors earn bonus rewards.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3 className={styles.featureTitle}>Privacy Protected</h3>
              <p className={styles.featureDescription}>
                Your data is anonymized and secured. You control what research
                institutions can access.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔬</div>
              <h3 className={styles.featureTitle}>Enable Research</h3>
              <p className={styles.featureDescription}>
                Help advance medical research while maintaining full control
                over your data sharing preferences.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3 className={styles.featureTitle}>Track Impact</h3>
              <p className={styles.featureDescription}>
                Monitor your donation history, tier progress, and total impact
                on the community.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🏆</div>
              <h3 className={styles.featureTitle}>Tier System</h3>
              <p className={styles.featureDescription}>
                Progress through Bronze, Silver, Gold, and Platinum tiers with
                increasing rewards.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🌐</div>
              <h3 className={styles.featureTitle}>Decentralized</h3>
              <p className={styles.featureDescription}>
                Built on blockchain for transparency, trust, and global
                accessibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statsContainer}>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>10K+</div>
              <div className={styles.statLabel}>Registered Donors</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>50K+</div>
              <div className={styles.statLabel}>Donations Recorded</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>25+</div>
              <div className={styles.statLabel}>Research Partners</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>1M+</div>
              <div className={styles.statLabel}>Lives Impacted</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.howItWorksContainer}>
          <h2 className={styles.howItWorksTitle}>How It Works</h2>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Register as Donor</h3>
              <p className={styles.stepDescription}>
                Connect your wallet and register with your blood type. Your
                identity remains anonymous and secure.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>Donate Blood</h3>
              <p className={styles.stepDescription}>
                Visit participating blood units. Your donation is recorded
                on-chain with medical data.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Earn Rewards</h3>
              <p className={styles.stepDescription}>
                Receive BDT tokens automatically. Consistent donors and rare
                blood types get bonus rewards.
              </p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>4</div>
              <h3 className={styles.stepTitle}>Enable Research</h3>
              <p className={styles.stepDescription}>
                Optionally grant research institutions access to your anonymized
                data to advance medical science.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
