// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title Research-Driven Blood Donor Management System (FIXED VERSION)
 * @notice A privacy-focused, research-oriented system for managing blood donations
 * with dynamic incentives and explicit research consent mechanisms
 */

// Interface for the DAO governance
interface IDAOGovernance {
    function isVerifiedResearchInstitution(
        address institution
    ) external view returns (bool);

    function getBloodTypeMultiplier(
        string calldata bloodType
    ) external view returns (uint256);

    function getIncentiveParameters()
        external
        view
        returns (
            uint256 baseReward,
            uint256 consistencyBonus,
            uint256 dataCompletenessBonus,
            uint256 postDonationFeedbackBonus
        );

    function getTierMultiplier(uint256 tier) external view returns (uint256);
}

// Reward Token Contract
contract BloodDonorToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("BloodDonorToken", "BDT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(from, amount);
    }
}

// Main System Contract - FIXED VERSION
contract BloodDonorSystem is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;

    bytes32 public constant BLOOD_UNIT_ROLE = keccak256("BLOOD_UNIT_ROLE");
    bytes32 public constant VERIFIED_RESEARCHER =
        keccak256("VERIFIED_RESEARCHER");

    IDAOGovernance public daoGovernance;
    BloodDonorToken public rewardToken;

    // Donor structure with personal data
    struct Donor {
        bytes32 anonymousId;
        string name;
        string email;
        string phoneNumber;
        bytes32 passwordHash;
        string bloodType;
        uint256 donationCount;
        uint256 firstDonationDate;
        uint256 lastDonationDate;
        uint256 consistencyScore;
        uint256 donorTier;
        bool hasCompleteResearchProfile;
        bool isRegistered;
        uint256 totalRewardsEarned;
        uint256 rewardsRedeemed;
        uint256 salt; // FIXED: Store salt for consistent ID generation
    }

    struct DonationRecord {
        bytes32 recordHash;
        uint256 timestamp;
        address bloodUnit;
        bool feedbackProvided;
        uint256 hemoglobinLevel;
        uint256 volume;
    }

    struct ResearchConsent {
        address researchInstitution;
        uint256 grantedDate;
        uint256 revokedDate;
        bool isActive;
        string researchPurpose;
    }

    // Mappings
    mapping(bytes32 => Donor) public donors;
    mapping(bytes32 => DonationRecord[]) public donationRecords;
    mapping(bytes32 => ResearchConsent[]) public researchConsents;
    mapping(bytes32 => mapping(address => bool)) public activeConsents;
    mapping(address => uint256) public bloodUnitReputation;
    mapping(address => uint256) public bloodUnitDonationCount;
    mapping(uint256 => uint256) public tierThresholds;
    mapping(address => bytes32) public addressToAnonymousId; // FIXED: Track address to ID mapping

    // Constants
    uint256 private constant CONSISTENCY_THRESHOLD = 2;
    uint256 private constant YEAR_SECONDS = 31536000;
    uint256 private constant MAX_CONSISTENCY_SCORE = 100;

    // Valid blood types
    mapping(string => bool) public validBloodTypes; // FIXED: Add validation

    // Events
    event DonorRegistered(bytes32 indexed anonymousId, string bloodType);
    event DonationRecorded(
        bytes32 indexed anonymousId,
        bytes32 recordHash,
        uint256 rewardAmount
    );
    event ResearchConsentGranted(
        bytes32 indexed anonymousId,
        address researchInstitution,
        string researchPurpose
    );
    event ResearchConsentRevoked(
        bytes32 indexed anonymousId,
        address researchInstitution
    );
    event ResearchDataAccessed(
        bytes32 indexed anonymousId,
        address researchInstitution,
        bytes32 recordHash
    );
    event IncentiveParametersUpdated(
        uint256 newBaseReward,
        uint256 newConsistencyBonus
    );
    event RewardsDistributed(
        bytes32 indexed anonymousId,
        address donorAddress,
        uint256 amount
    );
    event DonationFeedbackProvided(
        bytes32 indexed anonymousId,
        uint256 donationIndex,
        uint256 rating
    );
    event DonorTierUpgraded(bytes32 indexed anonymousId, uint256 newTier);
    event TierThresholdUpdated(uint256 indexed tier, uint256 newThreshold); // FIXED: Add missing event
    event DAOGovernanceUpdated(address indexed newGovernance); // FIXED: Add missing event

    // Modifiers
    modifier onlyRegisteredDonor(bytes32 anonymousId) {
        require(donors[anonymousId].isRegistered, "Not a registered donor");
        // FIXED: Verify the caller is the actual donor
        require(
            addressToAnonymousId[msg.sender] == anonymousId,
            "Not authorized for this donor ID"
        );
        _;
    }

    modifier onlyVerifiedResearchInstitution() {
        require(
            daoGovernance.isVerifiedResearchInstitution(msg.sender),
            "Not a verified research institution"
        );
        _;
    }

    modifier onlyBloodUnit() {
        require(hasRole(BLOOD_UNIT_ROLE, msg.sender), "Not a blood unit");
        _;
    }

    constructor(address _daoGovernance, address _rewardToken) {
        // FIXED: Add zero address checks
        require(_daoGovernance != address(0), "Invalid DAO governance address");
        require(_rewardToken != address(0), "Invalid reward token address");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BLOOD_UNIT_ROLE, msg.sender);

        daoGovernance = IDAOGovernance(_daoGovernance);
        rewardToken = BloodDonorToken(_rewardToken);

        // Initialize tier thresholds
        tierThresholds[1] = 5; // Bronze tier after 5 donations
        tierThresholds[2] = 15; // Silver tier after 15 donations
        tierThresholds[3] = 30; // Gold tier after 30 donations
        tierThresholds[4] = 50; // Platinum tier after 50 donations

        // FIXED: Initialize valid blood types
        validBloodTypes["O+"] = true;
        validBloodTypes["O-"] = true;
        validBloodTypes["A+"] = true;
        validBloodTypes["A-"] = true;
        validBloodTypes["B+"] = true;
        validBloodTypes["B-"] = true;
        validBloodTypes["AB+"] = true;
        validBloodTypes["AB-"] = true;
    }

    /**
     * @dev Registers a new donor with privacy protection
     */
    function registerDonor(
        string calldata name,
        string calldata email,
        string calldata phoneNumber,
        string calldata password,
        string calldata bloodType,
        uint256 salt
    ) external returns (bytes32 anonymousId) {
        // Validate input data
        require(bytes(name).length > 0, "Name is required");
        require(bytes(email).length > 0, "Email is required");
        require(bytes(phoneNumber).length > 0, "Phone number is required");
        require(
            bytes(password).length >= 8,
            "Password must be at least 8 characters"
        );
        require(validBloodTypes[bloodType], "Invalid blood type");
        require(
            addressToAnonymousId[msg.sender] == bytes32(0),
            "Address already registered"
        );

        anonymousId = generateAnonymousId(msg.sender, salt);
        require(!donors[anonymousId].isRegistered, "Donor already registered");

        // Hash password for security
        bytes32 passwordHash = keccak256(abi.encodePacked(password, salt));

        donors[anonymousId] = Donor({
            anonymousId: anonymousId,
            name: name,
            email: email,
            phoneNumber: phoneNumber,
            passwordHash: passwordHash,
            bloodType: bloodType,
            donationCount: 0,
            firstDonationDate: 0,
            lastDonationDate: 0,
            consistencyScore: 0,
            donorTier: 0,
            hasCompleteResearchProfile: false,
            isRegistered: true,
            totalRewardsEarned: 0,
            rewardsRedeemed: 0,
            salt: salt // FIXED: Store salt
        });

        addressToAnonymousId[msg.sender] = anonymousId; // FIXED: Track mapping

        emit DonorRegistered(anonymousId, bloodType);
        return anonymousId;
    }

    /**
     * @dev Login donor with email and password
     */
    function loginDonor(
        string calldata email,
        string calldata password
    ) external view returns (bytes32 anonymousId, bool success) {
        // Get anonymous ID for this address
        anonymousId = addressToAnonymousId[msg.sender];

        if (anonymousId == bytes32(0)) {
            return (bytes32(0), false); // Not registered
        }

        Donor memory donor = donors[anonymousId];
        if (!donor.isRegistered) {
            return (bytes32(0), false); // Not registered
        }

        // Check email matches
        if (keccak256(bytes(donor.email)) != keccak256(bytes(email))) {
            return (bytes32(0), false); // Email doesn't match
        }

        // Check password hash
        bytes32 passwordHash = keccak256(
            abi.encodePacked(password, donor.salt)
        );
        if (donor.passwordHash != passwordHash) {
            return (bytes32(0), false); // Password doesn't match
        }

        return (anonymousId, true); // Login successful
    }

    /**
     * @dev Get donor profile information (for logged in users)
     */
    function getDonorProfile(
        bytes32 anonymousId
    )
        external
        view
        returns (
            string memory name,
            string memory email,
            string memory phoneNumber,
            string memory bloodType,
            uint256 donationCount,
            uint256 donorTier,
            uint256 totalRewardsEarned,
            uint256 rewardsRedeemed
        )
    {
        require(
            addressToAnonymousId[msg.sender] == anonymousId,
            "Can only view your own profile"
        );

        Donor memory donor = donors[anonymousId];
        require(donor.isRegistered, "Donor not registered");

        return (
            donor.name,
            donor.email,
            donor.phoneNumber,
            donor.bloodType,
            donor.donationCount,
            donor.donorTier,
            donor.totalRewardsEarned,
            donor.rewardsRedeemed
        );
    }

    /**
     * @dev Records a donation with rich off-chain data
     */
    function recordDonation(
        address donorAddress,
        uint256 hemoglobinLevel,
        uint256 volume,
        bytes32 recordHash
    ) external onlyBloodUnit {
        // FIXED: Add input validation
        require(
            hemoglobinLevel > 0 && hemoglobinLevel <= 200,
            "Invalid hemoglobin level"
        ); // g/L range
        require(volume > 0 && volume <= 500, "Invalid donation volume"); // mL range
        require(donorAddress != address(0), "Invalid donor address");

        // Get anonymous ID from donor address
        bytes32 anonymousId = addressToAnonymousId[donorAddress];
        require(anonymousId != bytes32(0), "Donor not registered");

        Donor storage donor = donors[anonymousId];

        // Update donation records
        donationRecords[anonymousId].push(
            DonationRecord({
                recordHash: recordHash,
                timestamp: block.timestamp,
                bloodUnit: msg.sender,
                feedbackProvided: false,
                hemoglobinLevel: hemoglobinLevel,
                volume: volume
            })
        );

        // Update donor stats
        donor.donationCount++;

        // Set first donation date if this is the first donation
        if (donor.firstDonationDate == 0) {
            donor.firstDonationDate = block.timestamp;
        }

        // Calculate consistency score
        updateConsistencyScore(donor);

        // Check for tier upgrade
        checkAndUpgradeTier(donor);

        donor.lastDonationDate = block.timestamp;

        // Calculate and distribute dynamic reward
        uint256 rewardAmount = calculateDynamicReward(donor);
        distributeReward(donorAddress, rewardAmount);

        // Update donor's total rewards
        donor.totalRewardsEarned += rewardAmount;

        // Update blood unit reputation and count
        bloodUnitReputation[msg.sender] += rewardAmount;
        bloodUnitDonationCount[msg.sender] += 1;

        emit DonationRecorded(anonymousId, recordHash, rewardAmount);
    }

    /**
     * @dev Updates donor's consistency score
     */
    function updateConsistencyScore(Donor storage donor) internal {
        if (donor.firstDonationDate > 0 && donor.donationCount > 1) {
            uint256 timeSinceFirstDonation = block.timestamp -
                donor.firstDonationDate;
            uint256 expectedDonations = (timeSinceFirstDonation *
                CONSISTENCY_THRESHOLD) / YEAR_SECONDS;

            // FIXED: Prevent division by zero
            if (expectedDonations > 0) {
                donor.consistencyScore =
                    (donor.donationCount * 100) /
                    expectedDonations;

                // Cap consistency score at maximum
                if (donor.consistencyScore > MAX_CONSISTENCY_SCORE) {
                    donor.consistencyScore = MAX_CONSISTENCY_SCORE;
                }
            } else {
                donor.consistencyScore = MAX_CONSISTENCY_SCORE; // Perfect score for very recent donors
            }
        }
    }

    // ... (continuing with other functions - the rest would follow similar patterns)

    /**
     * @dev FIXED: Redeems rewards by burning tokens instead of transferring
     */
    function redeemRewards(uint256 amount) external nonReentrant {
        bytes32 anonymousId = addressToAnonymousId[msg.sender]; // FIXED: Use consistent mapping
        require(anonymousId != bytes32(0), "Not a registered donor");

        uint256 availableRewards = donors[anonymousId].totalRewardsEarned -
            donors[anonymousId].rewardsRedeemed;
        require(amount <= availableRewards, "Insufficient rewards");
        require(
            rewardToken.balanceOf(msg.sender) >= amount,
            "Insufficient token balance"
        );

        // Update redeemed rewards
        donors[anonymousId].rewardsRedeemed += amount;

        // FIXED: Burn tokens instead of transfer
        rewardToken.burn(msg.sender, amount);
    }

    /**
     * @dev FIXED: Updates tier thresholds with event emission
     */
    function updateTierThreshold(
        uint256 tier,
        uint256 threshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(tier > 0 && tier <= 4, "Invalid tier");
        require(threshold > 0, "Invalid threshold");

        tierThresholds[tier] = threshold;
        emit TierThresholdUpdated(tier, threshold); // FIXED: Add event
    }

    /**
     * @dev FIXED: Sets the DAO governance contract address with validation
     */
    function setDAOGovernance(
        address _daoGovernance
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_daoGovernance != address(0), "Invalid governance address");
        daoGovernance = IDAOGovernance(_daoGovernance);
        emit DAOGovernanceUpdated(_daoGovernance); // FIXED: Add event
    }

    /**
     * @dev Generates a pseudo-anonymous ID for privacy protection
     */
    function generateAnonymousId(
        address donorAddress,
        uint256 salt
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(donorAddress, salt));
    }

    /**
     * @dev Checks and upgrades donor tier based on donation count
     */
    function checkAndUpgradeTier(Donor storage donor) internal {
        uint256 newTier = donor.donorTier;

        // Check if donor qualifies for a higher tier
        for (uint256 i = donor.donorTier + 1; i <= 4; i++) {
            if (donor.donationCount >= tierThresholds[i]) {
                newTier = i;
            } else {
                break;
            }
        }

        // Upgrade tier if applicable
        if (newTier > donor.donorTier) {
            donor.donorTier = newTier;
            emit DonorTierUpgraded(donor.anonymousId, newTier);
        }
    }

    /**
     * @dev FIXED: Provides feedback for a donation with proper access control
     */
    function provideDonationFeedback(
        bytes32 anonymousId,
        uint256 donationIndex,
        uint256 rating // 1-5 scale
    ) external onlyRegisteredDonor(anonymousId) {
        require(
            donationIndex < donationRecords[anonymousId].length,
            "Invalid donation index"
        );
        require(rating >= 1 && rating <= 5, "Rating must be between 1-5");

        DonationRecord storage record = donationRecords[anonymousId][
            donationIndex
        ];
        require(!record.feedbackProvided, "Feedback already provided");

        record.feedbackProvided = true;

        // Apply bonus for providing feedback (proportional to rating)
        (, , , uint256 feedbackBonus) = daoGovernance.getIncentiveParameters();
        uint256 bonusAmount = (feedbackBonus * rating) / 5;

        // Distribute bonus rewards
        distributeReward(msg.sender, bonusAmount);

        donors[anonymousId].totalRewardsEarned += bonusAmount;

        emit DonationFeedbackProvided(anonymousId, donationIndex, rating);
    }

    /**
     * @dev FIXED: Grants consent for research use with consistent ID generation
     */
    function grantResearchConsent(
        address researchInstitution,
        string calldata researchPurpose
    ) external {
        bytes32 anonymousId = addressToAnonymousId[msg.sender];
        require(anonymousId != bytes32(0), "Not a registered donor");
        require(
            daoGovernance.isVerifiedResearchInstitution(researchInstitution),
            "Not a verified research institution"
        );
        require(
            !activeConsents[anonymousId][researchInstitution],
            "Consent already granted"
        );

        ResearchConsent memory newConsent = ResearchConsent({
            researchInstitution: researchInstitution,
            grantedDate: block.timestamp,
            revokedDate: 0,
            isActive: true,
            researchPurpose: researchPurpose
        });

        researchConsents[anonymousId].push(newConsent);
        activeConsents[anonymousId][researchInstitution] = true;

        emit ResearchConsentGranted(
            anonymousId,
            researchInstitution,
            researchPurpose
        );
    }

    /**
     * @dev FIXED: Revokes research consent with consistent ID generation
     */
    function revokeResearchConsent(address researchInstitution) external {
        bytes32 anonymousId = addressToAnonymousId[msg.sender];
        require(anonymousId != bytes32(0), "Not a registered donor");
        require(
            activeConsents[anonymousId][researchInstitution],
            "No active consent for this institution"
        );

        // Find and update the consent
        for (uint256 i = 0; i < researchConsents[anonymousId].length; i++) {
            if (
                researchConsents[anonymousId][i].researchInstitution ==
                researchInstitution &&
                researchConsents[anonymousId][i].isActive
            ) {
                researchConsents[anonymousId][i].isActive = false;
                researchConsents[anonymousId][i].revokedDate = block.timestamp;
                break;
            }
        }

        activeConsents[anonymousId][researchInstitution] = false;

        emit ResearchConsentRevoked(anonymousId, researchInstitution);
    }

    /**
     * @dev Allows verified researchers to access donation data with consent
     */
    function accessResearchData(
        bytes32 anonymousId,
        uint256 recordIndex
    ) external onlyVerifiedResearchInstitution returns (bytes32 recordHash) {
        require(
            activeConsents[anonymousId][msg.sender],
            "No active research consent"
        );
        require(
            recordIndex < donationRecords[anonymousId].length,
            "Invalid record index"
        );

        recordHash = donationRecords[anonymousId][recordIndex].recordHash;

        emit ResearchDataAccessed(anonymousId, msg.sender, recordHash);
    }

    /**
     * @dev Marks a donor's research profile as complete
     */
    function completeResearchProfile(
        bytes32 anonymousId
    ) external onlyBloodUnit onlyRegisteredDonor(anonymousId) {
        donors[anonymousId].hasCompleteResearchProfile = true;
    }

    /**
     * @dev Calculates dynamic reward based on multiple factors
     */
    function calculateDynamicReward(
        Donor memory donor
    ) internal view returns (uint256) {
        (
            uint256 baseReward,
            uint256 consistencyBonus,
            uint256 dataCompletenessBonus,

        ) = daoGovernance.getIncentiveParameters();

        uint256 bloodTypeMultiplier = daoGovernance.getBloodTypeMultiplier(
            donor.bloodType
        );
        uint256 tierMultiplier = daoGovernance.getTierMultiplier(
            donor.donorTier
        );

        uint256 reward = baseReward;

        // Apply blood type multiplier (rare blood types get higher rewards)
        reward = (reward * bloodTypeMultiplier) / 100;

        // Apply tier multiplier (higher tiers get more rewards)
        reward = (reward * tierMultiplier) / 100;

        // Apply consistency bonus for regular donors
        if (donor.consistencyScore >= 80) {
            reward += consistencyBonus;
        }

        // Apply data completeness bonus
        if (donor.hasCompleteResearchProfile) {
            reward += dataCompletenessBonus;
        }

        return reward;
    }

    /**
     * @dev Distributes rewards to donors
     */
    function distributeReward(address donorAddress, uint256 amount) internal {
        rewardToken.mint(donorAddress, amount);
        emit RewardsDistributed(
            addressToAnonymousId[donorAddress],
            donorAddress,
            amount
        );
    }

    /**
     * @dev Gets a donor's donation history length
     */
    function getDonationHistoryLength(
        bytes32 anonymousId
    ) external view returns (uint256) {
        return donationRecords[anonymousId].length;
    }

    /**
     * @dev Gets a donor's active research consents
     */
    function getResearchConsents(
        bytes32 anonymousId
    ) external view returns (ResearchConsent[] memory) {
        return researchConsents[anonymousId];
    }

    /**
     * @dev Gets a donor's available rewards
     */
    function getAvailableRewards(
        bytes32 anonymousId
    ) external view returns (uint256) {
        if (!donors[anonymousId].isRegistered) return 0;
        return
            donors[anonymousId].totalRewardsEarned -
            donors[anonymousId].rewardsRedeemed;
    }
}

// Governance Contract
contract DonorDAOGovernance is AccessControl, IDAOGovernance {
    mapping(address => bool) public verifiedResearchInstitutions;
    mapping(string => uint256) public bloodTypeMultipliers;
    mapping(uint256 => uint256) public tierMultipliers;

    uint256 public baseReward = 100 * 10 ** 18;
    uint256 public consistencyBonus = 50 * 10 ** 18;
    uint256 public dataCompletenessBonus = 25 * 10 ** 18;
    uint256 public postDonationFeedbackBonus = 20 * 10 ** 18;

    event ResearchInstitutionAdded(address institution);
    event ResearchInstitutionRemoved(address institution);
    event IncentiveParametersChanged(
        uint256 newBaseReward,
        uint256 newConsistencyBonus,
        uint256 newDataCompletenessBonus,
        uint256 newFeedbackBonus
    );
    event BloodTypeMultiplierSet(string bloodType, uint256 multiplier);
    event TierMultiplierSet(uint256 tier, uint256 multiplier);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Initialize default blood type multipliers
        bloodTypeMultipliers["O-"] = 230; // Universal donor - highest multiplier
        bloodTypeMultipliers["AB-"] = 250;
        bloodTypeMultipliers["B-"] = 200;
        bloodTypeMultipliers["A-"] = 150;
        //   bloodTypeMultipliers["A+"] = 120;
        //   bloodTypeMultipliers["O+"] = 130;
        //   bloodTypeMultipliers["B+"] = 140;
        //   bloodTypeMultipliers["AB+"] = 100;

        // Initialize tier multipliers
        tierMultipliers[0] = 100; // No tier
        tierMultipliers[1] = 110; // Bronze
        tierMultipliers[2] = 125; // Silver
        tierMultipliers[3] = 150; // Gold
        tierMultipliers[4] = 200; // Platinum
    }

    function addResearchInstitution(
        address institution
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verifiedResearchInstitutions[institution] = true;
        emit ResearchInstitutionAdded(institution);
    }

    function removeResearchInstitution(
        address institution
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verifiedResearchInstitutions[institution] = false;
        emit ResearchInstitutionRemoved(institution);
    }

    function setBloodTypeMultiplier(
        string calldata bloodType,
        uint256 multiplier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bloodTypeMultipliers[bloodType] = multiplier;
        emit BloodTypeMultiplierSet(bloodType, multiplier);
    }

    function setTierMultiplier(
        uint256 tier,
        uint256 multiplier
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        tierMultipliers[tier] = multiplier;
        emit TierMultiplierSet(tier, multiplier);
    }

    function setIncentiveParameters(
        uint256 newBaseReward,
        uint256 newConsistencyBonus,
        uint256 newDataCompletenessBonus,
        uint256 newFeedbackBonus
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseReward = newBaseReward;
        consistencyBonus = newConsistencyBonus;
        dataCompletenessBonus = newDataCompletenessBonus;
        postDonationFeedbackBonus = newFeedbackBonus;
        emit IncentiveParametersChanged(
            newBaseReward,
            newConsistencyBonus,
            newDataCompletenessBonus,
            newFeedbackBonus
        );
    }

    function isVerifiedResearchInstitution(
        address institution
    ) external view override returns (bool) {
        return verifiedResearchInstitutions[institution];
    }

    function getBloodTypeMultiplier(
        string calldata bloodType
    ) external view override returns (uint256) {
        return bloodTypeMultipliers[bloodType];
    }

    function getIncentiveParameters()
        external
        view
        override
        returns (uint256, uint256, uint256, uint256)
    {
        return (
            baseReward,
            consistencyBonus,
            dataCompletenessBonus,
            postDonationFeedbackBonus
        );
    }

    function getTierMultiplier(
        uint256 tier
    ) external view override returns (uint256) {
        return tierMultipliers[tier];
    }
}
