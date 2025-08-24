export const BloodDonorSystemABI = [
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "_daoGovernance",
                        "type": "address"
                  },
                  {
                        "internalType": "address",
                        "name": "_rewardToken",
                        "type": "address"
                  }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
      },
      {
            "inputs": [],
            "name": "AccessControlBadConfirmation",
            "type": "error"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                  },
                  {
                        "internalType": "bytes32",
                        "name": "neededRole",
                        "type": "bytes32"
                  }
            ],
            "name": "AccessControlUnauthorizedAccount",
            "type": "error"
      },
      {
            "inputs": [],
            "name": "ReentrancyGuardReentrantCall",
            "type": "error"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "newGovernance",
                        "type": "address"
                  }
            ],
            "name": "DAOGovernanceUpdated",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "donationIndex",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "rating",
                        "type": "uint256"
                  }
            ],
            "name": "DonationFeedbackProvided",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  },
                  {
                        "indexed": false,
                        "internalType": "bytes32",
                        "name": "recordHash",
                        "type": "bytes32"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "rewardAmount",
                        "type": "uint256"
                  }
            ],
            "name": "DonationRecorded",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  },
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "bloodType",
                        "type": "string"
                  }
            ],
            "name": "DonorRegistered",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newTier",
                        "type": "uint256"
                  }
            ],
            "name": "DonorTierUpgraded",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newBaseReward",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newConsistencyBonus",
                        "type": "uint256"
                  }
            ],
            "name": "IncentiveParametersUpdated",
            "type": "event"
      },
      // RESEARCH EVENT COMMENTED OUT
      // {
      //   "anonymous": false,
      //   "inputs": [
      //     {
      //       "indexed": true,
      //       "internalType": "bytes32",
      //       "name": "anonymousId",
      //       "type": "bytes32"
      //     },
      //     {
      //       "indexed": false,
      //       "internalType": "address",
      //       "name": "researchInstitution",
      //       "type": "address"
      //     },
      //     {
      //       "indexed": false,
      //       "internalType": "string",
      //       "name": "researchPurpose",
      //       "type": "string"
      //     }
      //   ],
      //   "name": "ResearchConsentGranted",
      //   "type": "event"
      // },
      // RESEARCH EVENT COMMENTED OUT
      // {
      //   "anonymous": false,
      //   "inputs": [
      //     {
      //       "indexed": true,
      //       "internalType": "bytes32",
      //       "name": "anonymousId",
      //       "type": "bytes32"
      //     },
      //     {
      //       "indexed": false,
      //       "internalType": "address",
      //       "name": "researchInstitution",
      //       "type": "address"
      //     }
      //   ],
      //   "name": "ResearchConsentRevoked",
      //   "type": "event"
      // },
      // RESEARCH EVENT COMMENTED OUT
      // {
      //   "anonymous": false,
      //   "inputs": [
      //     {
      //       "indexed": true,
      //       "internalType": "bytes32",
      //       "name": "anonymousId",
      //       "type": "bytes32"
      //     },
      //     {
      //       "indexed": false,
      //       "internalType": "address",
      //       "name": "researchInstitution",
      //       "type": "address"
      //     },
      //     {
      //       "indexed": false,
      //       "internalType": "bytes32",
      //       "name": "recordHash",
      //       "type": "bytes32"
      //     }
      //   ],
      //   "name": "ResearchDataAccessed",
      //   "type": "event"
      // },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  },
                  {
                        "indexed": false,
                        "internalType": "address",
                        "name": "donorAddress",
                        "type": "address"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                  }
            ],
            "name": "RewardsDistributed",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                  },
                  {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "previousAdminRole",
                        "type": "bytes32"
                  },
                  {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "newAdminRole",
                        "type": "bytes32"
                  }
            ],
            "name": "RoleAdminChanged",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                  }
            ],
            "name": "RoleGranted",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                  },
                  {
                        "indexed": true,
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                  }
            ],
            "name": "RoleRevoked",
            "type": "event"
      },
      {
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": true,
                        "internalType": "uint256",
                        "name": "tier",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newThreshold",
                        "type": "uint256"
                  }
            ],
            "name": "TierThresholdUpdated",
            "type": "event"
      },
      {
            "inputs": [],
            "name": "BLOOD_UNIT_ROLE",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "DEFAULT_ADMIN_ROLE",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      // RESEARCH FUNCTIONALITY COMMENTED OUT
      // {
      //   "inputs": [],
      //   "name": "VERIFIED_RESEARCHER",
      //   "outputs": [
      //     {
      //       "internalType": "bytes32",
      //       "name": "",
      //       "type": "bytes32"
      //     }
      //   ],
      //   "stateMutability": "view",
      //   "type": "function"
      // },
      // RESEARCH FUNCTION COMMENTED OUT
      // {
      //   "inputs": [
      //     {
      //       "internalType": "bytes32",
      //       "name": "anonymousId",
      //       "type": "bytes32"
      //     },
      //     {
      //       "internalType": "uint256",
      //       "name": "recordIndex",
      //       "type": "uint256"
      //     }
      //   ],
      //   "name": "accessResearchData",
      //   "outputs": [
      //     {
      //       "internalType": "bytes32",
      //       "name": "recordHash",
      //       "type": "bytes32"
      //     }
      //   ],
      //   "stateMutability": "nonpayable",
      //   "type": "function"
      // },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "activeConsents",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "addressToAnonymousId",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "bloodUnitDonationCount",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                  }
            ],
            "name": "bloodUnitReputation",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      // RESEARCH FUNCTION COMMENTED OUT
      // {
      //   "inputs": [
      //     {
      //       "internalType": "bytes32",
      //       "name": "anonymousId",
      //       "type": "bytes32"
      //     }
      //   ],
      //   "name": "completeResearchProfile",
      //   "outputs": [],
      //   "stateMutability": "nonpayable",
      //   "type": "function"
      // },
      {
            "inputs": [],
            "name": "daoGovernance",
            "outputs": [
                  {
                        "internalType": "contract IDAOGovernance",
                        "name": "",
                        "type": "address"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "donationRecords",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "recordHash",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "bloodUnit",
                        "type": "address"
                  },
                  {
                        "internalType": "bool",
                        "name": "feedbackProvided",
                        "type": "bool"
                  },
                  {
                        "internalType": "uint256",
                        "name": "hemoglobinLevel",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "volume",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                  }
            ],
            "name": "donors",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "string",
                        "name": "bloodType",
                        "type": "string"
                  },
                  {
                        "internalType": "uint256",
                        "name": "donationCount",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "firstDonationDate",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "lastDonationDate",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "consistencyScore",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "donorTier",
                        "type": "uint256"
                  },
                  {
                        "internalType": "bool",
                        "name": "hasCompleteResearchProfile",
                        "type": "bool"
                  },
                  {
                        "internalType": "bool",
                        "name": "isRegistered",
                        "type": "bool"
                  },
                  {
                        "internalType": "uint256",
                        "name": "totalRewardsEarned",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "rewardsRedeemed",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "salt",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "donorAddress",
                        "type": "address"
                  },
                  {
                        "internalType": "uint256",
                        "name": "salt",
                        "type": "uint256"
                  }
            ],
            "name": "generateAnonymousId",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                  }
            ],
            "stateMutability": "pure",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  }
            ],
            "name": "getAvailableRewards",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  }
            ],
            "name": "getDonationHistoryLength",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      // RESEARCH FUNCTION COMMENTED OUT
      // {
      //   "inputs": [
      //     {
      //       "internalType": "bytes32",
      //       "name": "anonymousId",
      //       "type": "bytes32"
      //     }
      //   ],
      //   "name": "getResearchConsents",
      //   "outputs": [
      //     {
      //       "components": [
      //         {
      //           "internalType": "address",
      //           "name": "researchInstitution",
      //           "type": "address"
      //         },
      //         {
      //           "internalType": "uint256",
      //           "name": "grantedDate",
      //           "type": "uint256"
      //         },
      //         {
      //           "internalType": "uint256",
      //           "name": "revokedDate",
      //           "type": "uint256"
      //         },
      //         {
      //           "internalType": "bool",
      //           "name": "isActive",
      //           "type": "bool"
      //         },
      //         {
      //           "internalType": "string",
      //           "name": "researchPurpose",
      //           "type": "string"
      //         }
      //       ],
      //       "internalType": "struct BloodDonorSystem.ResearchConsent[]",
      //       "name": "",
      //       "type": "tuple[]"
      //     }
      //   ],
      //   "stateMutability": "view",
      //   "type": "function"
      // },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                  }
            ],
            "name": "getRoleAdmin",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "",
                        "type": "bytes32"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      // RESEARCH FUNCTION COMMENTED OUT
      // {
      //   "inputs": [
      //     {
      //       "internalType": "address",
      //       "name": "researchInstitution",
      //       "type": "address"
      //     },
      //     {
      //       "internalType": "string",
      //       "name": "researchPurpose",
      //       "type": "string"
      //     }
      //   ],
      //   "name": "grantResearchConsent",
      //   "outputs": [],
      //   "stateMutability": "nonpayable",
      //   "type": "function"
      // },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                  }
            ],
            "name": "grantRole",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                  }
            ],
            "name": "hasRole",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "uint256",
                        "name": "donationIndex",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "rating",
                        "type": "uint256"
                  }
            ],
            "name": "provideDonationFeedback",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "bytes32",
                        "name": "recordHash",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "uint256",
                        "name": "hemoglobinLevel",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "volume",
                        "type": "uint256"
                  },
                  {
                        "internalType": "address",
                        "name": "donorAddress",
                        "type": "address"
                  }
            ],
            "name": "recordDonation",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                  }
            ],
            "name": "redeemRewards",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                  },
                  {
                        "internalType": "string",
                        "name": "email",
                        "type": "string"
                  },
                  {
                        "internalType": "string",
                        "name": "phone",
                        "type": "string"
                  },
                  {
                        "internalType": "string",
                        "name": "password",
                        "type": "string"
                  },
                  {
                        "internalType": "string",
                        "name": "bloodType",
                        "type": "string"
                  },
                  {
                        "internalType": "uint256",
                        "name": "salt",
                        "type": "uint256"
                  }
            ],
            "name": "registerDonor",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "string",
                        "name": "email",
                        "type": "string"
                  },
                  {
                        "internalType": "string",
                        "name": "password",
                        "type": "string"
                  }
            ],
            "name": "loginDonor",
            "outputs": [
                  {
                        "internalType": "bytes32",
                        "name": "anonymousId",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "bool",
                        "name": "success",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "address",
                        "name": "callerConfirmation",
                        "type": "address"
                  }
            ],
            "name": "renounceRole",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      // RESEARCH FUNCTION COMMENTED OUT
      // {
      //   "inputs": [
      //     {
      //       "internalType": "bytes32",
      //       "name": "",
      //       "type": "bytes32"
      //     },
      //     {
      //       "internalType": "uint256",
      //       "name": "",
      //       "type": "uint256"
      //     }
      //   ],
      //   "name": "researchConsents",
      //   "outputs": [
      //     {
      //       "internalType": "address",
      //       "name": "researchInstitution",
      //       "type": "address"
      //     },
      //     {
      //       "internalType": "uint256",
      //       "name": "grantedDate",
      //       "type": "uint256"
      //     },
      //     {
      //       "internalType": "uint256",
      //       "name": "revokedDate",
      //       "type": "uint256"
      //     },
      //     {
      //       "internalType": "bool",
      //       "name": "isActive",
      //       "type": "bool"
      //     },
      //     {
      //       "internalType": "string",
      //       "name": "researchPurpose",
      //       "type": "string"
      //     }
      //   ],
      //   "stateMutability": "view",
      //   "type": "function"
      // },
      // RESEARCH FUNCTION COMMENTED OUT
      // {
      //   "inputs": [
      //     {
      //       "internalType": "address",
      //       "name": "researchInstitution",
      //       "type": "address"
      //     }
      //   ],
      //   "name": "revokeResearchConsent",
      //   "outputs": [],
      //   "stateMutability": "nonpayable",
      //   "type": "function"
      // },
      {
            "inputs": [
                  {
                        "internalType": "bytes32",
                        "name": "role",
                        "type": "bytes32"
                  },
                  {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                  }
            ],
            "name": "revokeRole",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [],
            "name": "rewardToken",
            "outputs": [
                  {
                        "internalType": "contract BloodDonorToken",
                        "name": "",
                        "type": "address"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "address",
                        "name": "_daoGovernance",
                        "type": "address"
                  }
            ],
            "name": "setDAOGovernance",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "bytes4",
                        "name": "interfaceId",
                        "type": "bytes4"
                  }
            ],
            "name": "supportsInterface",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "name": "tierThresholds",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "tier",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "threshold",
                        "type": "uint256"
                  }
            ],
            "name": "updateTierThreshold",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                  }
            ],
            "name": "validBloodTypes",
            "outputs": [
                  {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                  }
            ],
            "stateMutability": "view",
            "type": "function"
      }
];

export default BloodDonorSystemABI;
