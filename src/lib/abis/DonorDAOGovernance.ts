export const DonorDAOGovernanceABI = [
      {
            "inputs": [],
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
            "anonymous": false,
            "inputs": [
                  {
                        "indexed": false,
                        "internalType": "string",
                        "name": "bloodType",
                        "type": "string"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "multiplier",
                        "type": "uint256"
                  }
            ],
            "name": "BloodTypeMultiplierSet",
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
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newDataCompletenessBonus",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "newFeedbackBonus",
                        "type": "uint256"
                  }
            ],
            "name": "IncentiveParametersChanged",
            "type": "event"
      },
      // RESEARCH EVENTS COMMENTED OUT
      // {
      //   "anonymous": false,
      //   "inputs": [
      //     {
      //       "indexed": false,
      //       "internalType": "address",
      //       "name": "institution",
      //       "type": "address"
      //     }
      //   ],
      //   "name": "ResearchInstitutionAdded",
      //   "type": "event"
      // },
      // {
      //   "anonymous": false,
      //   "inputs": [
      //     {
      //       "indexed": false,
      //       "internalType": "address",
      //       "name": "institution",
      //       "type": "address"
      //     }
      //   ],
      //   "name": "ResearchInstitutionRemoved",
      //   "type": "event"
      // },
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
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "tier",
                        "type": "uint256"
                  },
                  {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "multiplier",
                        "type": "uint256"
                  }
            ],
            "name": "TierMultiplierSet",
            "type": "event"
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
      // RESEARCH FUNCTION COMMENTED OUT
      // {
      //   "inputs": [
      //     {
      //       "internalType": "address",
      //       "name": "institution",
      //       "type": "address"
      //     }
      //   ],
      //   "name": "addResearchInstitution",
      //   "outputs": [],
      //   "stateMutability": "nonpayable",
      //   "type": "function"
      // },
      {
            "inputs": [],
            "name": "baseReward",
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
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                  }
            ],
            "name": "bloodTypeMultipliers",
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
            "inputs": [],
            "name": "consistencyBonus",
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
            "inputs": [],
            "name": "dataCompletenessBonus",
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
                        "internalType": "string",
                        "name": "bloodType",
                        "type": "string"
                  }
            ],
            "name": "getBloodTypeMultiplier",
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
            "inputs": [],
            "name": "getIncentiveParameters",
            "outputs": [
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                  },
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
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "tier",
                        "type": "uint256"
                  }
            ],
            "name": "getTierMultiplier",
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
      // RESEARCH FUNCTION COMMENTED OUT
      // {
      //   "inputs": [
      //     {
      //       "internalType": "address",
      //       "name": "institution",
      //       "type": "address"
      //     }
      //   ],
      //   "name": "isVerifiedResearchInstitution",
      //   "outputs": [
      //     {
      //       "internalType": "bool",
      //       "name": "",
      //       "type": "bool"
      //     }
      //   ],
      //   "stateMutability": "view",
      //   "type": "function"
      // },
      {
            "inputs": [],
            "name": "postDonationFeedbackBonus",
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
      //       "internalType": "address",
      //       "name": "institution",
      //       "type": "address"
      //     }
      //   ],
      //   "name": "removeResearchInstitution",
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
                        "name": "callerConfirmation",
                        "type": "address"
                  }
            ],
            "name": "renounceRole",
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
            "name": "revokeRole",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "string",
                        "name": "bloodType",
                        "type": "string"
                  },
                  {
                        "internalType": "uint256",
                        "name": "multiplier",
                        "type": "uint256"
                  }
            ],
            "name": "setBloodTypeMultiplier",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
      },
      {
            "inputs": [
                  {
                        "internalType": "uint256",
                        "name": "newBaseReward",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "newConsistencyBonus",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "newDataCompletenessBonus",
                        "type": "uint256"
                  },
                  {
                        "internalType": "uint256",
                        "name": "newFeedbackBonus",
                        "type": "uint256"
                  }
            ],
            "name": "setIncentiveParameters",
            "outputs": [],
            "stateMutability": "nonpayable",
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
                        "name": "multiplier",
                        "type": "uint256"
                  }
            ],
            "name": "setTierMultiplier",
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
            "name": "tierMultipliers",
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
      //       "internalType": "address",
      //       "name": "",
      //       "type": "address"
      //     }
      //   ],
      //   "name": "verifiedResearchInstitutions",
      //   "outputs": [
      //     {
      //       "internalType": "bool",
      //       "name": "",
      //       "type": "bool"
      //     }
      //   ],
      //   "stateMutability": "view",
      //   "type": "function"
      // }
];

export default DonorDAOGovernanceABI;
