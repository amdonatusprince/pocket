// src/actions/transfer.ts
import {
  elizaLogger as elizaLogger2,
  ModelClass,
  composeContext,
  generateObjectDeprecated
} from "@elizaos/core";
import {
  formatUnits as formatUnits2,
  parseEther,
  parseUnits,
  erc20Abi as erc20Abi2,
  createPublicClient as createPublicClient2,
  http as http2,
  createWalletClient as createWalletClient2
} from "viem";

// src/providers/wallet.ts
import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
  erc20Abi
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createWeb3Name } from "@web3-name-sdk/core";
import { elizaLogger } from "@elizaos/core";
var sonicMainnet = {
  id: 146,
  name: "Sonic",
  nativeCurrency: {
    name: "S",
    symbol: "S",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.soniclabs.com"]
    },
    public: {
      http: ["https://rpc.soniclabs.com"]
    }
  }
};
var sonicTestnet = {
  id: 57054,
  name: "Sonic Blaze Testnet",
  nativeCurrency: {
    name: "S",
    symbol: "S",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.blaze.soniclabs.com"]
    },
    public: {
      http: ["https://rpc.blaze.soniclabs.com"]
    }
  }
};
var WalletProvider = class _WalletProvider {
  currentChain = "sonic";
  chains = {
    sonic: sonicMainnet,
    "sonic-testnet": sonicTestnet
  };
  account;
  constructor(privateKey, chains) {
    elizaLogger.debug("Initializing WalletProvider");
    if (!privateKey || typeof privateKey !== "string") {
      elizaLogger.error("Invalid private key:", { privateKey: !!privateKey });
      throw new Error("Invalid private key provided");
    }
    this.setAccount(privateKey);
    elizaLogger.debug("Account created with address:", this.account?.address);
    this.setChains(chains);
    if (chains && Object.keys(chains).length > 0) {
      this.setCurrentChain(Object.keys(chains)[0]);
    }
    elizaLogger.debug("WalletProvider initialized successfully");
  }
  getAccount() {
    return this.account;
  }
  getAddress() {
    if (!this.account) {
      elizaLogger.error("Wallet not initialized");
      throw new Error("Wallet not initialized");
    }
    return this.account.address;
  }
  getCurrentChain() {
    return this.chains[this.currentChain];
  }
  getPublicClient(chainName) {
    elizaLogger.debug(`Creating public client for chain: ${chainName}`);
    const chain = this.chains[chainName];
    if (!chain) {
      elizaLogger.error(`Chain ${chainName} not configured`);
      throw new Error(`Chain ${chainName} not configured`);
    }
    return createPublicClient({
      chain,
      transport: http(chain.rpcUrls.default.http[0])
    });
  }
  getWalletClient(chainName) {
    if (!this.account) {
      throw new Error("Wallet not initialized");
    }
    const transport = this.createHttpTransport(chainName);
    return createWalletClient({
      chain: this.chains[chainName],
      transport,
      account: this.account
    });
  }
  async checkERC20Allowance(chain, token, owner, spender) {
    const publicClient = this.getPublicClient(chain);
    return await publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: "allowance",
      args: [owner, spender]
    });
  }
  async approveERC20(chain, token, spender, amount) {
    const publicClient = this.getPublicClient(chain);
    const walletClient = this.getWalletClient(chain);
    const { request } = await publicClient.simulateContract({
      account: this.account,
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amount]
    });
    return await walletClient.writeContract(request);
  }
  async transfer(chain, toAddress, amount, options) {
    const walletClient = this.getWalletClient(chain);
    const transactionRequest = {
      account: this.account,
      to: toAddress,
      value: amount,
      chain: this.chains[chain],
      // Only include data if it's provided and valid
      ...options?.data ? { data: options.data } : {},
      ...options?.gas ? { gas: options.gas } : {},
      ...options?.gasPrice ? { gasPrice: options.gasPrice } : {}
    };
    elizaLogger.debug("Transfer transaction request:", transactionRequest);
    return await walletClient.sendTransaction(transactionRequest);
  }
  async transferERC20(chain, tokenAddress, toAddress, amount, options) {
    const publicClient = this.getPublicClient(chain);
    const walletClient = this.getWalletClient(chain);
    const { request } = await publicClient.simulateContract({
      account: this.account,
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "transfer",
      args: [toAddress, amount],
      ...options
    });
    return await walletClient.writeContract(request);
  }
  async getBalance() {
    const client = this.getPublicClient(this.currentChain);
    const balance = await client.getBalance({
      address: this.account.address
    });
    return formatUnits(balance, 18);
  }
  addChain(chain) {
    this.setChains(chain);
  }
  switchChain(chainName, customRpcUrl) {
    if (!this.chains[chainName]) {
      const chain = _WalletProvider.genChainFromName(
        chainName,
        customRpcUrl
      );
      this.addChain({ [chainName]: chain });
    }
    this.setCurrentChain(chainName);
  }
  async formatAddress(address) {
    if (address.endsWith(".eth") || address.endsWith(".xyz")) {
      const resolvedAddress = await this.resolveWeb3Name(address);
      if (!resolvedAddress) {
        throw new Error(`Could not resolve address for ${address}`);
      }
      return resolvedAddress;
    }
    return address;
  }
  async resolveWeb3Name(name) {
    const nameService = createWeb3Name();
    return await nameService.getAddress(name);
  }
  setAccount(privateKey) {
    try {
      const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
      this.account = privateKeyToAccount(formattedKey);
      elizaLogger.debug("Account set successfully");
    } catch (error) {
      elizaLogger.error("Failed to set account:", error);
      throw new Error(`Invalid private key: ${error?.message || "Unknown error"}`);
    }
  }
  setChains = (chains) => {
    if (!chains) {
      return;
    }
    for (const chain of Object.keys(chains)) {
      this.chains[chain] = chains[chain];
    }
  };
  setCurrentChain = (chain) => {
    this.currentChain = chain;
  };
  createHttpTransport = (chainName) => {
    const chain = this.chains[chainName];
    if (!chain) {
      throw new Error(`Chain ${chainName} not configured`);
    }
    return http(chain.rpcUrls.default.http[0]);
  };
  static genChainFromName(chainName, customRpcUrl) {
    if (chainName === "sonic") return sonicMainnet;
    if (chainName === "sonic-testnet") return sonicTestnet;
    throw new Error("Unsupported chain name");
  }
  getChainConfigs(chainName) {
    return this.chains[chainName];
  }
};
var genChainsFromRuntime = (runtime) => {
  return {
    "sonic": sonicMainnet,
    "sonic-testnet": sonicTestnet
  };
};
var initWalletProvider = (runtime) => {
  elizaLogger.debug("Initializing wallet provider from runtime");
  const privateKey = process.env.SONIC_PRIVATE_KEY || runtime.getSetting("SONIC_PRIVATE_KEY");
  if (!privateKey) {
    elizaLogger.error("SONIC_PRIVATE_KEY not found");
    throw new Error("SONIC_PRIVATE_KEY not found");
  }
  elizaLogger.debug("Private key exists:", !!privateKey);
  const chains = genChainsFromRuntime(runtime);
  const provider = new WalletProvider(privateKey, chains);
  const address = provider.getAddress();
  elizaLogger.debug("Initialized wallet address:", address);
  return provider;
};
var sonicWalletProvider = {
  async get(runtime, _message, _state) {
    try {
      const walletProvider = initWalletProvider(runtime);
      const address = walletProvider.getAddress();
      const balance = await walletProvider.getBalance();
      const chain = walletProvider.getCurrentChain();
      return `Sonic Wallet Address: ${address}
Balance: ${balance} ${chain.nativeCurrency.symbol}
Chain ID: ${chain.id}, Name: ${chain.name}`;
    } catch (error) {
      console.error("Error in Sonic wallet provider:", error);
      return null;
    }
  }
};

// src/templates/index.ts
var getBalanceTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested check balance:
- Chain to execute on. Must be one of ["sonic", "sonic-testnet"]. Default is "sonic".
- Address to check balance for. Optional, must be a valid Ethereum address starting with "0x" or a web3 domain name. If not provided, use the Sonic chain Wallet Address.
- Token symbol or address. Could be a token symbol or address. If the address is provided, it must be a valid Ethereum address starting with "0x". Default is "S".
If any field is not provided, use the default value. If no default value is specified, use null.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "chain": SUPPORTED_CHAINS,
    "address": string | null,
    "token": string
}
\`\`\`
`;
var transferTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- Chain to execute on. Must be one of ["sonic", "sonic-testnet"]. Default is "sonic".
- Token symbol or address(string starting with "0x"). Optional.
- Amount to transfer. Optional. Must be a string representing the amount in ether (only number without coin symbol, e.g., "0.1").
- Recipient address. Must be a valid Ethereum address starting with "0x" or a web3 domain name.
- Data. Optional, data to be included in the transaction.
If any field is not provided, use the default value. If no default value is specified, use null.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "chain": SUPPORTED_CHAINS,
    "token": string | null,
    "amount": string | null,
    "toAddress": string,
    "data": string | null
}
\`\`\`
`;
var swapTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested token swap:
- Chain to execute on. Must be one of ["sonic", "sonic-testnet"]. Default is "sonic".
- Input token symbol or address(string starting with "0x").
- Output token symbol or address(string starting with "0x").
- Amount to swap. Must be a string representing the amount in ether (only number without coin symbol, e.g., "0.1").
- Slippage. Optional, expressed as decimal proportion, 0.03 represents 3%.
If any field is not provided, use the default value. If no default value is specified, use null.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "chain": SUPPORTED_CHAINS,
    "inputToken": string | null,
    "outputToken": string | null,
    "amount": string | null,
    "slippage": number | null
}
\`\`\`
`;
var stakeTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested PocketFi stake action:
- Chain to execute on. Must be "sonic" (only Sonic testnet is supported).
- Action to execute. Must be one of:
  - deposit: Stake S tokens to receive sPOCKET tokens
  - withdraw: Unstake sPOCKET tokens to receive S tokens back
  - claim: Claim staking rewards in S tokens
  - getBalance: Check sPOCKET token balance
  - getRewards: Check pending rewards
  - getInfo: Get detailed staking information
- Amount to execute. Optional, must be a string representing the amount in S tokens (e.g., "0.1").
  Required only for "deposit" and "withdraw" actions.

If any field is not provided, use the default value. If no default value is specified, use null.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "chain": "sonic-testnet",
    "action": "deposit" | "withdraw" | "claim" | "getBalance" | "getRewards" | "getInfo",
    "amount": string | null
}
\`\`\`
`;
var ercContractTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

When user wants to deploy any type of token contract (ERC20/721/1155), this will trigger the DEPLOY_TOKEN action.

Extract the following details for deploying a token contract:
- Chain to execute on. Must be one of ["sonic", "sonic-testnet"]. Default is "sonic".
- contractType: The type of token contract to deploy
  - For ERC20: Extract name, symbol, decimals, totalSupply
  - For ERC721: Extract name, symbol, baseURI
  - For ERC1155: Extract name, baseURI
- name: The name of the token.
- symbol: The token symbol (only for ERC20/721).
- decimals: Token decimals (only for ERC20). Default is 18.
- totalSupply: Total supply with decimals (only for ERC20). Default is "1000000000000000000".
- baseURI: Base URI for token metadata (only for ERC721/1155).
If any field is not provided, use the default value. If no default value is provided, use empty string.

Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:

\`\`\`json
{
    "chain": SUPPORTED_CHAINS,
    "contractType": "ERC20" | "ERC721" | "ERC1155",
    "name": string,
    "symbol": string | null,
    "decimals": number | null,
    "totalSupply": string | null,
    "baseURI": string | null
}
\`\`\`
`;
var perplexityTemplate = `
# Task: Analyze the user's financial query and provide professional advice
About the task:
- Provide detailed financial analysis and advice
- Explain complex concepts clearly
- Include market insights and trends
- Consider both short and long-term implications
- Support analysis with data when available

# Recent conversation
{{recentMessages}}

# Current request
{{request}}
`;

// src/actions/transfer.ts
var TransferAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async transfer(params) {
    elizaLogger2.debug("Transfer params:", params);
    if (params.chain !== "sonic" && params.chain !== "sonic-testnet") {
      throw new Error('Unsupported chain. Must be either "sonic" or "sonic-testnet"');
    }
    await this.validateAndNormalizeParams(params);
    elizaLogger2.debug("Normalized transfer params:", params);
    const chainConfig = params.chain === "sonic" ? sonicMainnet : sonicTestnet;
    const nativeToken = chainConfig.nativeCurrency.symbol;
    const publicClient = createPublicClient2({
      chain: chainConfig,
      transport: http2(chainConfig.rpcUrls.default.http[0])
    });
    const walletClient = createWalletClient2({
      chain: chainConfig,
      transport: http2(chainConfig.rpcUrls.default.http[0])
    });
    const account = this.walletProvider.getAccount();
    const resp = {
      chain: params.chain,
      txHash: "0x",
      recipient: params.toAddress,
      amount: "",
      token: params.token ?? nativeToken
    };
    if (!params.token || params.token === nativeToken) {
      try {
        const value = parseEther(params.amount || "0");
        const hash = await walletClient.sendTransaction({
          account,
          to: params.toAddress,
          value
        });
        resp.txHash = hash;
        resp.amount = params.amount || "0";
        await publicClient.waitForTransactionReceipt({ hash });
        return resp;
      } catch (error) {
        elizaLogger2.error("Transfer failed:", error);
        throw new Error(`Transfer failed: ${error.message}`);
      }
    } else {
      if (!params.token) throw new Error("Token address is required");
      if (!params.token.startsWith("0x")) {
        throw new Error("Token address must start with 0x");
      }
      const decimals = await publicClient.readContract({
        address: params.token,
        abi: erc20Abi2,
        functionName: "decimals"
      });
      let value;
      if (!params.amount) {
        value = await publicClient.readContract({
          address: params.token,
          abi: erc20Abi2,
          functionName: "balanceOf",
          args: [account.address]
        });
      } else {
        value = parseUnits(params.amount, decimals);
      }
      resp.amount = formatUnits2(value, decimals);
      resp.txHash = await this.walletProvider.transferERC20(
        params.chain,
        params.token,
        params.toAddress,
        value
      );
    }
    if (!resp.txHash || resp.txHash === "0x") {
      throw new Error("Get transaction hash failed");
    }
    await publicClient.waitForTransactionReceipt({
      hash: resp.txHash
    });
    return resp;
  }
  async validateAndNormalizeParams(params) {
    if (!params.toAddress) {
      throw new Error("To address is required");
    }
    params.toAddress = await this.walletProvider.formatAddress(params.toAddress);
    if (!params.toAddress || params.toAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error("Invalid recipient address");
    }
  }
};
var transferAction = {
  name: "transfer",
  description: "Transfer tokens on Sonic networks. Supports both native S token and ERC20 tokens.",
  handler: async (runtime, message, state, options, callback) => {
    if (!state) return false;
    elizaLogger2.log("Starting transfer action...");
    const walletInfo = await sonicWalletProvider.get(runtime, message, state);
    if (!walletInfo) {
      callback?.({
        text: "Wallet not available. Please check your configuration.",
        content: { error: "Wallet initialization failed" }
      });
      return false;
    }
    if (!(message.content.source === "direct")) {
      callback?.({
        text: "I can't do that for you.",
        content: { error: "Transfer not allowed" }
      });
      return false;
    }
    try {
      const walletProvider = initWalletProvider(runtime);
      const action = new TransferAction(walletProvider);
      const context = composeContext({
        state,
        template: transferTemplate
      });
      const content = await generateObjectDeprecated({
        runtime,
        context,
        modelClass: ModelClass.LARGE
      });
      const paramOptions = {
        chain: content.chain,
        token: content.token,
        amount: content.amount,
        toAddress: content.toAddress,
        data: content.data
      };
      const transferResp = await action.transfer(paramOptions);
      callback?.({
        text: `Successfully transferred ${transferResp.amount} ${transferResp.token} to ${transferResp.recipient}
Transaction Hash: ${transferResp.txHash}`,
        content: { ...transferResp }
      });
      return true;
    } catch (error) {
      elizaLogger2.error("Error during transfer:", error.message);
      callback?.({
        text: `Transfer failed: ${error.message}`,
        content: { error: error.message }
      });
      return false;
    }
  },
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("SONIC_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Transfer 1 S to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you transfer 1 S to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e on Sonic",
          action: "TRANSFER",
          content: {
            chain: "sonic",
            token: "S",
            amount: "1",
            toAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
          }
        }
      }
    ]
  ],
  similes: ["TRANSFER", "SEND"]
};

// src/types/index.ts
var PocketFiStakingAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
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
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      }
    ],
    "name": "RewardPaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newRate",
        "type": "uint256"
      }
    ],
    "name": "RewardRateUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newMin",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newMax",
        "type": "uint256"
      }
    ],
    "name": "StakeLimitsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Staked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "YEAR_IN_SECONDS",
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
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "earned",
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
    "name": "getAPR",
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
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getRewardDebugInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "currentBalance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timeSinceLastReward",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "annualRewardRate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pendingRewards",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalUserRewards",
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
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getSPocketBalance",
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
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserStakeInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "stakedAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pendingRewards",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "stakeTimestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "lastRewardTime",
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
    "name": "lastRewardCalculationTime",
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
    "name": "lastUpdateTime",
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
    "name": "maxStakeAmount",
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
    "name": "minStakeAmount",
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
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
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
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardPerToken",
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
    "name": "rewardPerTokenStored",
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
    "name": "rewardRate",
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
    "name": "rewards",
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
    "name": "sPocket",
    "outputs": [
      {
        "internalType": "contract SPocketToken",
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
        "internalType": "uint256",
        "name": "_rewardRate",
        "type": "uint256"
      }
    ],
    "name": "setRewardRate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_minAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_maxAmount",
        "type": "uint256"
      }
    ],
    "name": "setStakeLimits",
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
    "name": "stake",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRewardsDistributed",
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
    "name": "totalStaked",
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
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "userRewardPerTokenPaid",
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
    "name": "userStakeTime",
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
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];
var PocketFiSwapAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "initialOwner",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
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
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nativeAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenAmount",
        "type": "uint256"
      }
    ],
    "name": "SwapNativeForToken",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenAmount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "nativeAmount",
        "type": "uint256"
      }
    ],
    "name": "SwapTokenForNative",
    "type": "event"
  },
  {
    "stateMutability": "payable",
    "type": "fallback"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_swapRate",
        "type": "uint256"
      }
    ],
    "name": "addToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_newRate",
        "type": "uint256"
      }
    ],
    "name": "setSwapRate",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "supportedTokens",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "swapRate",
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
        "name": "tokenAddress",
        "type": "address"
      }
    ],
    "name": "swapNativeForToken",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenAmount",
        "type": "uint256"
      }
    ],
    "name": "swapTokenForNative",
    "outputs": [],
    "stateMutability": "nonpayable",
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
    "name": "tokenAddresses",
    "outputs": [
      {
        "internalType": "address",
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
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
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
    "name": "withdrawNative",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

// src/actions/swap.ts
import {
  composeContext as composeContext2,
  elizaLogger as elizaLogger3,
  generateObjectDeprecated as generateObjectDeprecated2,
  ModelClass as ModelClass2
} from "@elizaos/core";
import {
  createPublicClient as createPublicClient3,
  createWalletClient as createWalletClient3,
  http as http3,
  formatEther,
  parseEther as parseEther2,
  encodeFunctionData,
  erc20Abi as erc20Abi3
} from "viem";
var PocketFiSwapAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  SWAP_CONTRACT = "0x787b42FA61F11cE130C40D489A00c56a8f5d335f";
  SUPPORTED_TOKENS = {
    "POCKET": "0x7a114662911183125B1b5ce893bcA1d59151b5D5",
    "DIAMOND": "0x30BF3761147Ef0c86E2f84c3784FBD89E7954670",
    "CORAL": "0xAF93888cbD250300470A1618206e036E11470149"
  };
  async swap(params) {
    elizaLogger3.debug("PocketFi swap params:", params);
    if (params.chain !== "sonic-testnet") {
      throw new Error("Only Sonic testnet is supported for swapping");
    }
    const account = this.walletProvider.getAccount();
    elizaLogger3.debug("Using account address:", account.address);
    elizaLogger3.debug("Using swap contract:", this.SWAP_CONTRACT);
    const publicClient = createPublicClient3({
      chain: sonicTestnet,
      transport: http3(sonicTestnet.rpcUrls.default.http[0])
    });
    const walletClient = createWalletClient3({
      account,
      chain: sonicTestnet,
      transport: http3(sonicTestnet.rpcUrls.default.http[0])
    });
    try {
      const tokenAddress = params.action === "swapTokenForNative" ? this.resolveTokenAddress(params.fromToken) : this.resolveTokenAddress(params.toToken);
      elizaLogger3.debug("Resolved token address:", tokenAddress);
      const [_, swapRate] = await publicClient.readContract({
        address: this.SWAP_CONTRACT,
        abi: PocketFiSwapAbi,
        functionName: "supportedTokens",
        args: [tokenAddress]
      });
      if (swapRate === 0n) {
        throw new Error(`Token ${params.toToken} is not supported on PocketSwap`);
      }
      const nativeAmount = parseEther2(params.amount);
      const expectedTokens = nativeAmount * BigInt(1e18) / swapRate;
      elizaLogger3.debug(`Expected tokens: ${formatEther(expectedTokens)}`);
      if (params.action === "getRate") {
        const oneNativeInTokens = BigInt(1e18) * BigInt(1e18) / swapRate;
        return {
          chain: params.chain,
          txHash: "0x0",
          fromToken: "S",
          toToken: params.toToken,
          amount: params.amount,
          rate: `1 S = ${formatEther(oneNativeInTokens)} ${params.toToken}`
        };
      }
      if (params.action === "swapNativeForToken") {
        const hash = await walletClient.sendTransaction({
          account,
          chain: sonicTestnet,
          to: this.SWAP_CONTRACT,
          data: encodeFunctionData({
            abi: PocketFiSwapAbi,
            functionName: "swapNativeForToken",
            args: [tokenAddress]
          }),
          value: nativeAmount
        });
        await publicClient.waitForTransactionReceipt({ hash });
        return {
          chain: params.chain,
          txHash: hash,
          fromToken: "S",
          toToken: params.toToken,
          amount: params.amount
        };
      }
      if (params.action === "swapTokenForNative") {
        const approveHash = await walletClient.writeContract({
          address: tokenAddress,
          abi: erc20Abi3,
          functionName: "approve",
          args: [this.SWAP_CONTRACT, nativeAmount]
        });
        await publicClient.waitForTransactionReceipt({ hash: approveHash });
        const hash = await walletClient.writeContract({
          address: this.SWAP_CONTRACT,
          abi: PocketFiSwapAbi,
          functionName: "swapTokenForNative",
          args: [tokenAddress, nativeAmount]
        });
        await publicClient.waitForTransactionReceipt({ hash });
        return {
          chain: params.chain,
          txHash: hash,
          fromToken: params.toToken,
          toToken: "S",
          amount: params.amount
        };
      }
      throw new Error(`Invalid swap action: ${params.action}`);
    } catch (error) {
      elizaLogger3.error("Swap error:", error);
      throw new Error(`Failed to ${params.action}: ${error.message}`);
    }
  }
  resolveTokenAddress(token) {
    const upperToken = token.toUpperCase();
    if (upperToken in this.SUPPORTED_TOKENS) {
      return this.SUPPORTED_TOKENS[upperToken];
    }
    if (token.startsWith("0x")) {
      return token;
    }
    throw new Error(`Token ${token} is not supported`);
  }
};
var pocketFiSwapAction = {
  name: "pocketfi-swap",
  description: "Swap tokens using PocketFi Swap on Sonic testnet",
  handler: async (runtime, message, state, _options, callback) => {
    if (!state) return false;
    elizaLogger3.log("Starting PocketFi swap action...");
    try {
      const walletProvider = initWalletProvider(runtime);
      elizaLogger3.debug("Wallet provider initialized");
      const action = new PocketFiSwapAction(walletProvider);
      const context = composeContext2({
        state,
        template: swapTemplate
      });
      const content = await generateObjectDeprecated2({
        runtime,
        context,
        modelClass: ModelClass2.LARGE
      });
      const swapResp = await action.swap({
        chain: "sonic-testnet",
        action: content.action || "swapNativeForToken",
        fromToken: content.fromToken || "S",
        toToken: content.toToken,
        amount: content.amount
      });
      let responseText = swapResp.rate || `Successfully swapped ${swapResp.amount} ${swapResp.fromToken} for ${swapResp.toToken}`;
      if (swapResp.txHash !== "0x0") {
        responseText += `
Transaction Hash: ${swapResp.txHash}`;
      }
      callback?.({
        text: responseText,
        content: swapResp
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      elizaLogger3.error("Error during PocketFi swap:", errorMessage);
      callback?.({
        text: `PocketFi swap failed: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Swap 10 S for CORAL tokens"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you swap 10 S for CORAL tokens on PocketFi",
          action: "pocketfi-swap",
          content: {
            action: "swapNativeForToken",
            toToken: "CORAL",
            amount: "10"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "What's the exchange rate for DIAMOND tokens?"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll check the current swap rate for DIAMOND tokens",
          action: "pocketfi-swap",
          content: {
            action: "getRate",
            toToken: "DIAMOND",
            amount: "1"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Swap my POCKET tokens back to S"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you swap your POCKET tokens back to S",
          action: "pocketfi-swap",
          content: {
            action: "swapTokenForNative",
            fromToken: "POCKET",
            toToken: "S",
            amount: "10"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Swap 5 DIAMOND for S token"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you swap 5 DIAMOND tokens for S on PocketFi",
          action: "pocketfi-swap",
          content: {
            action: "swapTokenForNative",
            fromToken: "DIAMOND",
            toToken: "S",
            amount: "5"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Exchange 2 CORAL to S"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you exchange 2 CORAL tokens for S on PocketFi",
          action: "pocketfi-swap",
          content: {
            action: "swapTokenForNative",
            fromToken: "CORAL",
            toToken: "S",
            amount: "2"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I want to swap 1 S token to 0x7a114662911183125B1b5ce893bcA1d59151b5D5 on sonic testnet on pocketSwap"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you swap 1 S for POCKET tokens (0x7a11...5D5) on PocketFi",
          action: "pocketfi-swap",
          content: {
            action: "swapNativeForToken",
            toToken: "0x7a114662911183125B1b5ce893bcA1d59151b5D5",
            amount: "1"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "swap 2 S to token address 0x30BF3761147Ef0c86E2f84c3784FBD89E7954670"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you swap 2 S for DIAMOND tokens (0x30BF...4670) on PocketFi",
          action: "pocketfi-swap",
          content: {
            action: "swapNativeForToken",
            toToken: "0x30BF3761147Ef0c86E2f84c3784FBD89E7954670",
            amount: "2"
          }
        }
      }
    ]
  ],
  similes: [
    "SWAP",
    "EXCHANGE",
    "TRADE",
    "GET_RATE",
    "SWAP_RATE",
    "EXCHANGE_RATE",
    "CONVERT",
    "SWAP_TO",
    "SWAP_FOR",
    "EXCHANGE_TO",
    "EXCHANGE_FOR",
    "TRADE_FOR",
    "SWAP_TOKEN",
    "EXCHANGE_TOKEN",
    "SWAP_ON_POCKETSWAP",
    "EXCHANGE_ON_POCKETFI",
    "POCKETFI_SWAP",
    "POCKETSWAP"
  ],
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("SONIC_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  }
};

// src/actions/perplexity.ts
import {
  composeContext as composeContext3,
  elizaLogger as elizaLogger4,
  generateObjectDeprecated as generateObjectDeprecated3,
  ModelClass as ModelClass3
} from "@elizaos/core";
var PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
var PerplexityAction = class {
  async getFinancialInfo(query) {
    try {
      const systemPrompt = `You are an experienced Chief Financial Officer and Financial Advisor with expertise in both traditional finance and cryptocurrency markets.`;
      const response = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
          ],
          temperature: 0.7,
          max_tokens: 1e3,
          top_p: 1
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Perplexity API error: ${JSON.stringify(error)}`);
      }
      const result = await response.json();
      return {
        status: "success",
        message: result.choices[0].message.content
      };
    } catch (error) {
      elizaLogger4.error("Perplexity API error:", error);
      return {
        status: "error",
        message: `Failed to get financial analysis: ${error.message}`
      };
    }
  }
};
var perplexityAction = {
  name: "GET_FINANCIAL_INFO",
  description: "Get professional financial analysis and advice",
  handler: async (runtime, message, state, options, callback) => {
    if (!state) return false;
    elizaLogger4.log("Starting financial analysis action...");
    let currentState = state;
    if (!currentState) {
      currentState = await runtime.composeState(message);
    } else {
      currentState = await runtime.updateRecentMessageState(currentState);
    }
    const context = composeContext3({
      state: currentState,
      template: perplexityTemplate
    });
    const content = await generateObjectDeprecated3({
      runtime,
      context,
      modelClass: ModelClass3.LARGE
    });
    const action = new PerplexityAction();
    try {
      const result = await action.getFinancialInfo(content.query);
      callback?.({
        text: result.message,
        content: { status: result.status }
      });
      return true;
    } catch (error) {
      elizaLogger4.error("Error during financial analysis:", error.message);
      callback?.({
        text: `Analysis failed: ${error.message}`,
        content: { error: error.message }
      });
      return false;
    }
  },
  validate: async (_runtime) => {
    return !!process.env.PERPLEXITY_API_KEY;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "What's the current market sentiment for Bitcoin?"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "Let me analyze the current Bitcoin market sentiment for you.",
          action: "GET_FINANCIAL_INFO",
          content: {
            query: "What's the current market sentiment for Bitcoin?"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you explain the tokenomics of $SOL?"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll analyze Solana's tokenomics for you.",
          action: "GET_FINANCIAL_INFO",
          content: {
            query: "Can you explain the tokenomics of $SOL?"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "What are the key factors affecting DeFi yields right now?"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll analyze the current DeFi yield landscape for you.",
          action: "GET_FINANCIAL_INFO",
          content: {
            query: "What are the key factors affecting DeFi yields right now?"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "How does staking work in Proof of Stake networks?"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll explain the concept of staking in PoS networks.",
          action: "GET_FINANCIAL_INFO",
          content: {
            query: "How does staking work in Proof of Stake networks?"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "What's your analysis on the current crypto market conditions?"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll provide a comprehensive analysis of current crypto market conditions.",
          action: "GET_FINANCIAL_INFO",
          content: {
            query: "What's your analysis on the current crypto market conditions?"
          }
        }
      }
    ]
  ],
  similes: [
    "analyze token performance",
    "check market trends",
    "get investment advice",
    "explain financial terms",
    "provide risk assessment",
    "evaluate market conditions",
    "analyze crypto trends",
    "explain DeFi concepts",
    "assess investment opportunities",
    "review token fundamentals",
    "examine market dynamics",
    "study price movements",
    "research crypto projects",
    "investigate market sentiment",
    "explore trading strategies"
  ]
};

// src/actions/getBalance.ts
import {
  composeContext as composeContext4,
  elizaLogger as elizaLogger5,
  generateObjectDeprecated as generateObjectDeprecated4,
  ModelClass as ModelClass4
} from "@elizaos/core";
import {
  erc20Abi as erc20Abi4,
  formatEther as formatEther2,
  formatUnits as formatUnits3,
  createPublicClient as createPublicClient4,
  http as http4
} from "viem";
var GetBalanceAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async getBalance(params) {
    elizaLogger5.debug("Get balance params:", params);
    if (params.chain !== "sonic" && params.chain !== "sonic-testnet") {
      throw new Error('Unsupported chain. Must be either "sonic" or "sonic-testnet"');
    }
    const chainConfig = params.chain === "sonic" ? sonicMainnet : sonicTestnet;
    elizaLogger5.debug("Using chain:", chainConfig.name);
    let address = params.address;
    if (!address) {
      address = this.walletProvider.getAddress();
      elizaLogger5.debug("Using wallet address:", address);
    }
    if (!address || address === "0x0000000000000000000000000000000000000000") {
      elizaLogger5.error("Invalid address:", address);
      throw new Error("Invalid or missing address");
    }
    const publicClient = createPublicClient4({
      chain: chainConfig,
      transport: http4(chainConfig.rpcUrls.default.http[0])
    });
    try {
      const formattedAddress = address;
      elizaLogger5.debug("Querying balance for address:", formattedAddress);
      if (!params.token || params.token.toLowerCase() === chainConfig.nativeCurrency.symbol.toLowerCase()) {
        const nativeBalance = await publicClient.getBalance({
          address: formattedAddress
        });
        return {
          chain: params.chain,
          address: formattedAddress,
          balance: {
            token: chainConfig.nativeCurrency.symbol,
            amount: formatEther2(nativeBalance)
          }
        };
      } else {
        const tokenAddress = params.token;
        const [balance, decimals, symbol, name] = await Promise.all([
          publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi4,
            functionName: "balanceOf",
            args: [formattedAddress]
          }),
          publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi4,
            functionName: "decimals"
          }),
          publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi4,
            functionName: "symbol"
          }),
          publicClient.readContract({
            address: tokenAddress,
            abi: erc20Abi4,
            functionName: "name"
          })
        ]);
        return {
          chain: params.chain,
          address: formattedAddress,
          balance: {
            token: symbol,
            amount: formatUnits3(balance, decimals),
            tokenName: name
          }
        };
      }
    } catch (error) {
      elizaLogger5.error("Get balance error:", error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }
  async getWalletInfo(chain) {
    const address = this.walletProvider.getAddress();
    if (!address) {
      throw new Error("No wallet address available");
    }
    const chainConfig = chain === "sonic" ? sonicMainnet : sonicTestnet;
    elizaLogger5.debug("Getting wallet info for chain:", chainConfig.name);
    const publicClient = createPublicClient4({
      chain: chainConfig,
      transport: http4(chainConfig.rpcUrls.default.http[0])
    });
    try {
      const nativeBalance = await publicClient.getBalance({
        address
      });
      return [
        `Wallet Address: ${address}`,
        `Chain: ${chainConfig.name}`,
        `Native Balance: ${formatEther2(nativeBalance)} ${chainConfig.nativeCurrency.symbol}`
      ].join("\n");
    } catch (error) {
      elizaLogger5.error("Error getting wallet info:", error);
      throw new Error(`Failed to get wallet info: ${error.message}`);
    }
  }
};
var getBalanceAction = {
  name: "getBalance",
  description: "Get wallet information and token balances on Sonic networks. Supports both native S token and ERC20 tokens.",
  handler: async (runtime, message, state, _options, callback) => {
    if (!state) return false;
    elizaLogger5.log("Starting getBalance action...");
    try {
      const walletProvider = initWalletProvider(runtime);
      elizaLogger5.debug("Wallet provider initialized");
      const address = walletProvider.getAddress();
      if (!address) {
        throw new Error("No wallet address available");
      }
      elizaLogger5.debug("Using wallet address:", address);
      const action = new GetBalanceAction(walletProvider);
      const context = composeContext4({
        state,
        template: getBalanceTemplate
      });
      const content = await generateObjectDeprecated4({
        runtime,
        context,
        modelClass: ModelClass4.LARGE
      });
      const getBalanceResp = await action.getBalance({
        chain: content.chain || "sonic-testnet",
        // Default to testnet if not specified
        address: content.address || address,
        token: content.token
        // Keep token from content
      });
      elizaLogger5.debug("Balance response:", getBalanceResp);
      if (callback) {
        const walletInfo = await action.getWalletInfo(getBalanceResp.chain);
        let text = walletInfo + "\n\n";
        if (getBalanceResp.balance) {
          const tokenName = getBalanceResp.balance.tokenName ? ` (${getBalanceResp.balance.tokenName})` : "";
          text += `Token Balance: ${getBalanceResp.balance.amount} ${getBalanceResp.balance.token}${tokenName}`;
        }
        callback({
          text,
          content: getBalanceResp
        });
      }
      return true;
    } catch (error) {
      elizaLogger5.error("Error during get balance:", error.message);
      callback?.({
        text: `Get balance failed: ${error.message}`,
        content: { error: error.message }
      });
      return false;
    }
  },
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("SONIC_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Show my wallet info and S token balance"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you check your wallet information and S token balance",
          action: "GET_BALANCE",
          content: {
            chain: "sonic",
            token: "S"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Check my balance of token 0x1234 on testnet"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you check your balance of token 0x1234 on Sonic testnet",
          action: "GET_BALANCE",
          content: {
            chain: "sonic-testnet",
            token: "0x1234"
          }
        }
      }
    ]
  ],
  similes: [
    "GET_BALANCE",
    "CHECK_BALANCE",
    "WALLET_INFO",
    "CHECK_WALLET",
    "SHOW_BALANCE",
    "VIEW_BALANCE"
  ]
};

// src/actions/stake.ts
import {
  composeContext as composeContext5,
  elizaLogger as elizaLogger6,
  generateObjectDeprecated as generateObjectDeprecated5,
  ModelClass as ModelClass5
} from "@elizaos/core";
import {
  formatEther as formatEther3,
  parseEther as parseEther3,
  encodeFunctionData as encodeFunctionData2,
  walletActions,
  createPublicClient as createPublicClient5,
  createWalletClient as createWalletClient4,
  http as http5
} from "viem";
var PocketFiStakeAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  POCKET_FI_STAKING = "0x404Bf459100f97644d1Fd1dc591eE4A8BC8B5F65";
  async stake(params) {
    elizaLogger6.debug("PocketFi stake params:", params);
    if (params.chain !== "sonic-testnet") {
      throw new Error("Only Sonic testnet is supported for staking");
    }
    const account = this.walletProvider.getAccount();
    elizaLogger6.debug("Using account address:", account.address);
    elizaLogger6.debug("Using contract address:", this.POCKET_FI_STAKING);
    elizaLogger6.debug("Using chain:", sonicTestnet.name);
    const publicClient = createPublicClient5({
      chain: sonicTestnet,
      transport: http5(sonicTestnet.rpcUrls.default.http[0])
    });
    const walletClient = createWalletClient4({
      account,
      chain: sonicTestnet,
      transport: http5(sonicTestnet.rpcUrls.default.http[0])
    }).extend(walletActions);
    const balance = await publicClient.getBalance({ address: account.address });
    elizaLogger6.debug("Account balance:", formatEther3(balance), "S");
    try {
      const stakeInfo = await this.getUserStakeInfo(account.address);
      elizaLogger6.debug("Current stake info:", {
        stakedAmount: stakeInfo.stakedAmount,
        pendingRewards: stakeInfo.pendingRewards,
        stakeTimestamp: Number(stakeInfo.stakeTimestamp)
      });
      switch (params.action) {
        case "deposit": {
          if (!params.amount) throw new Error("Amount is required for deposit");
          const value = parseEther3(params.amount);
          if (balance < value) {
            throw new Error(`Insufficient balance. You have ${formatEther3(balance)} S but trying to stake ${params.amount} S`);
          }
          const hash = await walletClient.sendTransaction({
            account,
            chain: sonicTestnet,
            to: this.POCKET_FI_STAKING,
            data: encodeFunctionData2({
              abi: PocketFiStakingAbi,
              functionName: "stake",
              args: [value]
            }),
            value
          });
          await publicClient.waitForTransactionReceipt({ hash });
          return {
            response: `Successfully staked ${params.amount} S. Current staked balance: ${stakeInfo.stakedAmount} sPOCKET
Transaction Hash: ${hash}`,
            hash
          };
        }
        case "withdraw": {
          if (!params.amount) throw new Error("Amount is required for withdraw");
          const value = parseEther3(params.amount);
          if (parseEther3(stakeInfo.stakedAmount) < value) {
            throw new Error(`Insufficient staked balance. You have ${stakeInfo.stakedAmount} sPOCKET but trying to withdraw ${params.amount} S`);
          }
          const hash = await walletClient.sendTransaction({
            account,
            chain: sonicTestnet,
            to: this.POCKET_FI_STAKING,
            data: encodeFunctionData2({
              abi: PocketFiStakingAbi,
              functionName: "withdraw",
              args: [value]
            })
          });
          await publicClient.waitForTransactionReceipt({ hash });
          const newStakeInfo = await this.getUserStakeInfo(account.address);
          return {
            response: `Successfully withdrawn ${params.amount} S. Remaining staked balance: ${newStakeInfo.stakedAmount} sPOCKET
Transaction Hash: ${hash}`,
            hash
          };
        }
        case "claim": {
          const earned = await this.getEarned(account.address);
          if (parseEther3(earned) <= 0n) {
            throw new Error("No rewards available to claim");
          }
          const hash = await walletClient.sendTransaction({
            account,
            chain: sonicTestnet,
            to: this.POCKET_FI_STAKING,
            data: encodeFunctionData2({
              abi: PocketFiStakingAbi,
              functionName: "claimReward"
            })
          });
          await publicClient.waitForTransactionReceipt({ hash });
          return {
            response: `Successfully claimed ${earned} S in rewards
Transaction Hash: ${hash}`,
            hash
          };
        }
        case "earned": {
          const earned = await this.getEarned(account.address);
          return {
            response: `Your pending rewards: ${earned} S`,
            hash: "0x0"
          };
        }
        case "info": {
          const info = await this.getUserStakeInfo(account.address);
          return {
            response: `Staked Amount: ${info.stakedAmount} sPOCKET
Pending Rewards: ${info.pendingRewards} S
Stake Time: ${new Date(Number(info.stakeTimestamp) * 1e3).toLocaleString()}`,
            hash: "0x0"
          };
        }
        default:
          throw new Error(`Invalid action: ${params.action}`);
      }
    } catch (error) {
      elizaLogger6.error("Stake error:", error);
      throw new Error(`Failed to ${params.action}: ${error.message}`);
    }
  }
  async getEarned(address) {
    const publicClient = createPublicClient5({
      chain: sonicTestnet,
      transport: http5(sonicTestnet.rpcUrls.default.http[0])
    });
    try {
      elizaLogger6.debug("Getting earned rewards for address:", address);
      const earned = await publicClient.readContract({
        address: this.POCKET_FI_STAKING,
        abi: PocketFiStakingAbi,
        functionName: "earned",
        args: [address]
      });
      elizaLogger6.debug("Raw earned response:", earned);
      return formatEther3(earned);
    } catch (error) {
      elizaLogger6.error("Error getting earned rewards:", {
        error: error.message,
        code: error.code,
        details: error.details
      });
      throw error;
    }
  }
  async getUserStakeInfo(address) {
    const publicClient = createPublicClient5({
      chain: sonicTestnet,
      transport: http5(sonicTestnet.rpcUrls.default.http[0])
    });
    try {
      elizaLogger6.debug("Getting stake info for address:", address);
      const info = await publicClient.readContract({
        address: this.POCKET_FI_STAKING,
        abi: PocketFiStakingAbi,
        functionName: "getUserStakeInfo",
        args: [address]
      });
      elizaLogger6.debug("Raw stake info response:", info);
      return {
        stakedAmount: formatEther3(info[0]),
        pendingRewards: formatEther3(info[1]),
        stakeTimestamp: info[2],
        lastRewardTime: info[3]
      };
    } catch (error) {
      elizaLogger6.error("Error getting stake info:", {
        error: error.message,
        code: error.code,
        details: error.details
      });
      throw error;
    }
  }
  async getStakeWalletInfo() {
    const address = this.walletProvider.getAddress();
    if (!address) {
      throw new Error("No wallet address available");
    }
    const publicClient = createPublicClient5({
      chain: sonicTestnet,
      transport: http5(sonicTestnet.rpcUrls.default.http[0])
    });
    try {
      elizaLogger6.debug("Getting wallet info for address:", address);
      const [nativeBalance, stakeInfo, apr] = await Promise.all([
        publicClient.getBalance({ address }),
        this.getUserStakeInfo(address),
        publicClient.readContract({
          address: this.POCKET_FI_STAKING,
          abi: PocketFiStakingAbi,
          functionName: "getAPR"
        })
      ]);
      elizaLogger6.debug("Wallet info response:", {
        balance: formatEther3(nativeBalance),
        stakeInfo,
        apr: Number(apr) / 100
      });
      return [
        `Wallet Address: ${address}`,
        `Chain: ${sonicTestnet.name}`,
        `Native Balance: ${formatEther3(nativeBalance)} ${sonicTestnet.nativeCurrency.symbol}`,
        `Staked Amount: ${stakeInfo.stakedAmount} sPOCKET`,
        `Pending Rewards: ${stakeInfo.pendingRewards} S`,
        `Current APR: ${Number(apr) / 100}%`,
        `Stake Time: ${new Date(Number(stakeInfo.stakeTimestamp) * 1e3).toLocaleString()}`
      ].join("\n");
    } catch (error) {
      elizaLogger6.error("Error getting wallet info:", {
        error: error.message,
        code: error.code,
        details: error.details
      });
      throw error;
    }
  }
};
var pocketFiStakeAction = {
  name: "pocketfi-stake",
  description: "Stake, unstake, and claim rewards through PocketFi Staking on Sonic network",
  handler: async (runtime, message, state, _options, callback) => {
    if (!state) return false;
    elizaLogger6.log("Starting PocketFi stake action...");
    try {
      const walletProvider = initWalletProvider(runtime);
      elizaLogger6.debug("Wallet provider initialized");
      elizaLogger6.debug("Wallet address:", walletProvider.getAddress());
      elizaLogger6.debug("Chain:", sonicTestnet.name);
      const action = new PocketFiStakeAction(walletProvider);
      const context = composeContext5({
        state,
        template: stakeTemplate
      });
      const content = await generateObjectDeprecated5({
        runtime,
        context,
        modelClass: ModelClass5.LARGE
      });
      const stakeResp = await action.stake({
        chain: "sonic-testnet",
        action: content.action,
        amount: content.amount
      });
      const walletInfo = await action.getStakeWalletInfo();
      callback?.({
        text: `${stakeResp.response}

${walletInfo}`,
        content: {
          ...stakeResp,
          walletInfo
        }
      });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      elizaLogger6.error("Error during PocketFi stake:", errorMessage);
      callback?.({
        text: `PocketFi stake failed: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Stake 1 S to earn rewards"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you stake 1 S on PocketFi",
          action: "pocketfi-stake",
          content: {
            action: "deposit",
            amount: "1"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Withdraw 0.5 S from staking"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you withdraw 0.5 S from PocketFi staking",
          action: "pocketfi-stake",
          content: {
            action: "withdraw",
            amount: "0.5"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Claim my staking rewards"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you claim your PocketFi staking rewards",
          action: "pocketfi-stake",
          content: {
            action: "claim"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Check my staking rewards"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll check your PocketFi staking rewards",
          action: "pocketfi-stake",
          content: {
            action: "earned"
          }
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Show my staking info"
        }
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll show your PocketFi staking information",
          action: "pocketfi-stake",
          content: {
            action: "info"
          }
        }
      }
    ]
  ],
  similes: ["STAKE", "UNSTAKE", "WITHDRAW", "CLAIM_REWARDS", "CHECK_STAKE", "GET_REWARDS"],
  validate: async (runtime) => {
    const privateKey = runtime.getSetting("SONIC_PRIVATE_KEY");
    return typeof privateKey === "string" && privateKey.startsWith("0x");
  }
};

// src/actions/deploy.ts
import {
  composeContext as composeContext6,
  elizaLogger as elizaLogger8,
  generateObjectDeprecated as generateObjectDeprecated6,
  ModelClass as ModelClass6
} from "@elizaos/core";
import solc2 from "solc";
import { parseUnits as parseUnits2 } from "viem";

// src/utils/contracts.ts
import { elizaLogger as elizaLogger7 } from "@elizaos/core";
import solc from "solc";
function findImports(importPath) {
  const sources = {
    "@openzeppelin/contracts/utils/Context.sol": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}`,
    "@openzeppelin/contracts/token/ERC20/IERC20.sol": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}`,
    "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../IERC20.sol";

interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}`,
    "@openzeppelin/contracts/access/Ownable.sol": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../utils/Context.sol";

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}`,
    "@openzeppelin/contracts/token/ERC20/ERC20.sol": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";
import "./extensions/IERC20Metadata.sol";
import "../../utils/Context.sol";

contract ERC20 is Context, IERC20, IERC20Metadata {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        _beforeTokenTransfer(from, to, amount);
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
            _balances[to] += amount;
        }
        emit Transfer(from, to, amount);
        _afterTokenTransfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");
        _beforeTokenTransfer(address(0), account, amount);
        _totalSupply += amount;
        unchecked {
            _balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);
        _afterTokenTransfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");
        _beforeTokenTransfer(account, address(0), amount);
        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
            _totalSupply -= amount;
        }
        emit Transfer(account, address(0), amount);
        _afterTokenTransfer(account, address(0), amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual {}
    function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual {}
}`
  };
  if (importPath in sources) {
    return { contents: sources[importPath] };
  }
  return { error: `File not found: ${importPath}` };
}
var ERC20_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Erc20Contract is ERC20, Ownable {
    uint8 private immutable _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalsValue,
        uint256 initialSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimalsValue;
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}`;
async function compileSolidity(contractName) {
  try {
    if (contractName !== "Erc20Contract") {
      throw new Error("Only ERC20 contracts are supported");
    }
    const input = {
      language: "Solidity",
      sources: {
        [contractName]: {
          content: ERC20_SOURCE
        }
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"]
          }
        },
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    };
    elizaLogger7.debug(`Compiling ${contractName}...`);
    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
    if (output.errors) {
      const errors = output.errors.filter((e) => e.severity === "error");
      if (errors.length > 0) {
        throw new Error(`Compilation errors: ${JSON.stringify(errors, null, 2)}`);
      }
      output.errors.forEach((e) => {
        if (e.severity === "warning") {
          elizaLogger7.warn(`Compilation warning: ${e.message}`);
        }
      });
    }
    const contract = output.contracts[contractName][contractName];
    if (!contract) {
      throw new Error(`No compiled contract found for ${contractName}`);
    }
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object
    };
  } catch (error) {
    elizaLogger7.error("Compilation failed:", error.message);
    throw error;
  }
}

// src/actions/deploy.ts
var DeployAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async compileSolidity(contractName, source) {
    const solName = `${contractName}.sol`;
    const input = {
      language: "Solidity",
      sources: {
        [solName]: {
          content: source
        }
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"]
          }
        }
      }
    };
    elizaLogger8.debug("Compiling contract...");
    const output = JSON.parse(solc2.compile(JSON.stringify(input)));
    if (output.errors) {
      const hasError = output.errors.some(
        (error) => error.type === "Error"
      );
      if (hasError) {
        elizaLogger8.error(
          `Compilation errors: ${JSON.stringify(output.errors, null, 2)}`
        );
      }
    }
    const contract = output.contracts[solName][contractName];
    if (!contract) {
      elizaLogger8.error("Compilation result is empty");
    }
    elizaLogger8.debug("Contract compiled successfully");
    return {
      abi: contract.abi,
      bytecode: contract.evm.bytecode.object
    };
  }
  async deployERC20(deployTokenParams) {
    elizaLogger8.debug("deployTokenParams", deployTokenParams);
    const { name, symbol, decimals, totalSupply, chain } = deployTokenParams;
    if (!name || name === "") {
      throw new Error("Token name is required");
    }
    if (!symbol || symbol === "") {
      throw new Error("Token symbol is required");
    }
    if (!decimals || decimals === 0) {
      throw new Error("Token decimals is required");
    }
    if (!totalSupply || totalSupply === "") {
      throw new Error("Token total supply is required");
    }
    try {
      const totalSupplyWithDecimals = parseUnits2(totalSupply, decimals);
      const args = [name, symbol, decimals, totalSupplyWithDecimals];
      const contractAddress = await this.deployContract(
        chain,
        "ERC20Contract",
        args
      );
      return {
        address: contractAddress
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      elizaLogger8.error("Deploy ERC20 failed:", errorMessage);
      throw error;
    }
  }
  async deployERC721(deployNftParams) {
    elizaLogger8.debug("deployNftParams", deployNftParams);
    const { baseURI, name, symbol, chain } = deployNftParams;
    if (!name || name === "") {
      throw new Error("Token name is required");
    }
    if (!symbol || symbol === "") {
      throw new Error("Token symbol is required");
    }
    if (!baseURI || baseURI === "") {
      throw new Error("Token baseURI is required");
    }
    try {
      const args = [name, symbol, baseURI];
      const contractAddress = await this.deployContract(
        chain,
        "ERC721Contract",
        args
      );
      return {
        address: contractAddress
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      elizaLogger8.error("Deploy ERC721 failed:", errorMessage);
      throw error;
    }
  }
  async deployERC1155(deploy1155Params) {
    elizaLogger8.debug("deploy1155Params", deploy1155Params);
    const { baseURI, name, chain } = deploy1155Params;
    if (!name || name === "") {
      throw new Error("Token name is required");
    }
    if (!baseURI || baseURI === "") {
      throw new Error("Token baseURI is required");
    }
    try {
      const args = [name, baseURI];
      const contractAddress = await this.deployContract(
        chain,
        "ERC1155Contract",
        args
      );
      return {
        address: contractAddress
      };
    } catch (error) {
      elizaLogger8.error("Deploy ERC1155 failed:", error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  async deployContract(chain, contractName, args) {
    try {
      const contractMap = {
        "ERC20Contract": "Erc20Contract",
        "ERC721Contract": "Erc721Contract",
        "ERC1155Contract": "Erc1155Contract"
      };
      const mappedName = contractMap[contractName] || contractName;
      elizaLogger8.debug(`Compiling contract: ${mappedName}`);
      const { abi, bytecode } = await compileSolidity(mappedName);
      if (!bytecode) {
        throw new Error("Bytecode is empty after compilation");
      }
      this.walletProvider.switchChain(chain);
      const chainConfig = this.walletProvider.getChainConfigs(chain);
      const walletClient = this.walletProvider.getWalletClient(chain);
      const hash = await walletClient.deployContract({
        account: this.walletProvider.getAccount(),
        abi,
        bytecode,
        args,
        chain: chainConfig
      });
      elizaLogger8.debug("Waiting for deployment transaction...", hash);
      const publicClient = this.walletProvider.getPublicClient(chain);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash
      });
      elizaLogger8.debug("Contract deployed successfully!");
      return receipt.contractAddress;
    } catch (error) {
      elizaLogger8.error(`Failed to deploy contract:`, error);
      throw error;
    }
  }
};
var deployAction = {
  name: "DEPLOY_TOKEN",
  description: "Deploy token contracts (ERC20/721/1155) based on user specifications",
  handler: async (runtime, message, state, options, callback) => {
    if (!state) return false;
    elizaLogger8.log("Starting deploy action...");
    try {
      let currentState = state;
      if (!currentState) {
        currentState = await runtime.composeState(message);
      } else {
        currentState = await runtime.updateRecentMessageState(currentState);
      }
      state.walletInfo = await sonicWalletProvider.get(runtime, message, currentState);
      const context = composeContext6({
        state: currentState,
        template: ercContractTemplate
      });
      const content = await generateObjectDeprecated6({
        runtime,
        context,
        modelClass: ModelClass6.LARGE
      });
      const walletProvider = initWalletProvider(runtime);
      const action = new DeployAction(walletProvider);
      const contractType = content.contractType;
      let result;
      switch (contractType.toLocaleLowerCase()) {
        case "erc20":
          result = await action.deployERC20({
            chain: content.chain,
            decimals: content.decimals,
            symbol: content.symbol,
            name: content.name,
            totalSupply: content.totalSupply
          });
          break;
        case "erc721":
          result = await action.deployERC721({
            chain: content.chain,
            name: content.name,
            symbol: content.symbol,
            baseURI: content.baseURI
          });
          break;
        case "erc1155":
          result = await action.deployERC1155({
            chain: content.chain,
            name: content.name,
            baseURI: content.baseURI
          });
          break;
      }
      if (result) {
        callback?.({
          text: `Successfully create contract - ${result?.address}`,
          content: { ...result }
        });
      } else {
        callback?.({
          text: "Unsuccessfully create contract",
          content: { ...result }
        });
      }
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      elizaLogger8.error("Error during deploy:", errorMessage);
      callback?.({
        text: `Deploy failed: ${errorMessage}`,
        content: { error: errorMessage }
      });
      return false;
    }
  },
  validate: async (runtime) => {
    return true;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "deploy an ERC20 token with name 'MyToken', symbol 'MTK', decimals 18, total supply 10000",
          action: "DEPLOY_TOKEN"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Deploy an ERC721 NFT contract with name 'MyNFT', symbol 'MNFT', baseURI 'https://my-nft-base-uri.com'",
          action: "DEPLOY_TOKEN"
        }
      }
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Deploy an ERC1155 contract with name 'My1155', baseURI 'https://my-1155-base-uri.com'",
          action: "DEPLOY_TOKEN"
        }
      }
    ]
  ],
  similes: [
    "DEPLOY_ERC20",
    "DEPLOY_ERC721",
    "DEPLOY_ERC1155",
    "CREATE_TOKEN",
    "CREATE_NFT",
    "CREATE_1155"
  ]
};

// src/index.ts
var PocketFinanceSonicPlugin = {
  name: "pocket-finance",
  description: "Pocket Finance integration plugin that allows users to complete onchain actions on the Sonic blockchain, including invoicing, transferring, swapping, staking, bridging, token deployments, and financial analysis",
  providers: [sonicWalletProvider],
  evaluators: [],
  services: [],
  actions: [
    getBalanceAction,
    pocketFiSwapAction,
    transferAction,
    perplexityAction,
    pocketFiStakeAction,
    deployAction
  ]
};
var index_default = PocketFinanceSonicPlugin;
export {
  PocketFiStakingAbi,
  PocketFiSwapAbi,
  PocketFinanceSonicPlugin,
  TransferAction,
  WalletProvider,
  index_default as default,
  initWalletProvider,
  sonicMainnet,
  sonicTestnet,
  sonicWalletProvider,
  transferAction,
  transferTemplate
};
//# sourceMappingURL=index.js.map