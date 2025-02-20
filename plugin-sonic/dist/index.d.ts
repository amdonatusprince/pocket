import { IAgentRuntime, Provider, Action, Plugin } from '@elizaos/core';
import { Address, Hash, Chain, PrivateKeyAccount, PublicClient, HttpTransport, WalletClient, Hex } from 'viem';

type SupportedChain = "sonic" | "sonic-testnet";
type StakeAction = "deposit" | "withdraw" | "claim" | "earned" | "info";
interface GetBalanceParams {
    chain: SupportedChain;
    address?: Address;
    token?: string;
}
interface TransferParams {
    chain: SupportedChain;
    token?: string;
    amount?: string;
    toAddress: Address;
    data?: `0x${string}`;
}
interface SwapParams {
    chain: SupportedChain;
    action: 'swapNativeForToken' | 'swapTokenForNative' | 'getRate';
    fromToken: string;
    toToken: string;
    amount: string;
}
interface BridgeParams {
    fromChain: SupportedChain;
    toChain: SupportedChain;
    fromToken?: Address;
    toToken?: Address;
    amount: string;
    toAddress?: Address;
}
interface StakeParams {
    chain: SupportedChain;
    action: StakeAction;
    amount?: string;
}
interface FaucetParams {
    token?: string;
    toAddress?: Address;
}
interface GetBalanceResponse {
    chain: SupportedChain;
    address: string;
    balance?: {
        token: string;
        amount: string;
        tokenName?: string;
    };
}
interface TransferResponse {
    chain: SupportedChain;
    txHash: Hash;
    recipient: Address;
    amount: string;
    token: string;
    data?: `0x${string}`;
}
interface SwapResponse {
    chain: SupportedChain;
    txHash: `0x${string}`;
    fromToken: string;
    toToken: string;
    amount: string;
    rate?: string;
}
interface BridgeResponse {
    fromChain: SupportedChain;
    toChain: SupportedChain;
    txHash: Hash;
    recipient: Address;
    fromToken: string;
    toToken: string;
    amount: string;
}
interface StakeResponse {
    response: string;
    hash: `0x${string}`;
    walletInfo?: string;
}
interface IDeployERC20Params {
    chain: SupportedChain;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
}
interface IDeployERC721Params {
    chain: SupportedChain;
    name: string;
    symbol: string;
    baseURI: string;
}
interface IDeployERC1155Params {
    chain: SupportedChain;
    name: string;
    baseURI: string;
}
declare const PocketFiStakingAbi: readonly [{
    readonly inputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "constructor";
}, {
    readonly inputs: readonly [];
    readonly name: "EnforcedPause";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "ExpectedPause";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "owner";
        readonly type: "address";
    }];
    readonly name: "OwnableInvalidOwner";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "account";
        readonly type: "address";
    }];
    readonly name: "OwnableUnauthorizedAccount";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "ReentrancyGuardReentrantCall";
    readonly type: "error";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "previousOwner";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "newOwner";
        readonly type: "address";
    }];
    readonly name: "OwnershipTransferred";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "account";
        readonly type: "address";
    }];
    readonly name: "Paused";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "uint256";
        readonly name: "reward";
        readonly type: "uint256";
    }];
    readonly name: "RewardPaid";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "uint256";
        readonly name: "newRate";
        readonly type: "uint256";
    }];
    readonly name: "RewardRateUpdated";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "uint256";
        readonly name: "newMin";
        readonly type: "uint256";
    }, {
        readonly indexed: false;
        readonly internalType: "uint256";
        readonly name: "newMax";
        readonly type: "uint256";
    }];
    readonly name: "StakeLimitsUpdated";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "uint256";
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "Staked";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "account";
        readonly type: "address";
    }];
    readonly name: "Unpaused";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "uint256";
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "Withdrawn";
    readonly type: "event";
}, {
    readonly inputs: readonly [];
    readonly name: "YEAR_IN_SECONDS";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "claimReward";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "account";
        readonly type: "address";
    }];
    readonly name: "earned";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "getAPR";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "user";
        readonly type: "address";
    }];
    readonly name: "getRewardDebugInfo";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "currentBalance";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "timeSinceLastReward";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "annualRewardRate";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "pendingRewards";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "totalUserRewards";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "user";
        readonly type: "address";
    }];
    readonly name: "getSPocketBalance";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "user";
        readonly type: "address";
    }];
    readonly name: "getUserStakeInfo";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "stakedAmount";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "pendingRewards";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "stakeTimestamp";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "lastRewardTime";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly name: "lastRewardCalculationTime";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "lastUpdateTime";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "maxStakeAmount";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "minStakeAmount";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "owner";
    readonly outputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "pause";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "paused";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "renounceOwnership";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "rewardPerToken";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "rewardPerTokenStored";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "rewardRate";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly name: "rewards";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "sPocket";
    readonly outputs: readonly [{
        readonly internalType: "contract SPocketToken";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "_rewardRate";
        readonly type: "uint256";
    }];
    readonly name: "setRewardRate";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "_minAmount";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "_maxAmount";
        readonly type: "uint256";
    }];
    readonly name: "setStakeLimits";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "stake";
    readonly outputs: readonly [];
    readonly stateMutability: "payable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalRewardsDistributed";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "totalStaked";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "newOwner";
        readonly type: "address";
    }];
    readonly name: "transferOwnership";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "unpause";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly name: "userRewardPerTokenPaid";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly name: "userStakeTime";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "withdraw";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly stateMutability: "payable";
    readonly type: "receive";
}];
declare const PocketFiSwapAbi: readonly [{
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "initialOwner";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "constructor";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "owner";
        readonly type: "address";
    }];
    readonly name: "OwnableInvalidOwner";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "account";
        readonly type: "address";
    }];
    readonly name: "OwnableUnauthorizedAccount";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "ReentrancyGuardReentrantCall";
    readonly type: "error";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "previousOwner";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "newOwner";
        readonly type: "address";
    }];
    readonly name: "OwnershipTransferred";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "uint256";
        readonly name: "nativeAmount";
        readonly type: "uint256";
    }, {
        readonly indexed: false;
        readonly internalType: "uint256";
        readonly name: "tokenAmount";
        readonly type: "uint256";
    }];
    readonly name: "SwapNativeForToken";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "user";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "uint256";
        readonly name: "tokenAmount";
        readonly type: "uint256";
    }, {
        readonly indexed: false;
        readonly internalType: "uint256";
        readonly name: "nativeAmount";
        readonly type: "uint256";
    }];
    readonly name: "SwapTokenForNative";
    readonly type: "event";
}, {
    readonly stateMutability: "payable";
    readonly type: "fallback";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_token";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_swapRate";
        readonly type: "uint256";
    }];
    readonly name: "addToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "emergencyWithdraw";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "owner";
    readonly outputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "renounceOwnership";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "tokenAddress";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_newRate";
        readonly type: "uint256";
    }];
    readonly name: "setSwapRate";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly name: "supportedTokens";
    readonly outputs: readonly [{
        readonly internalType: "contract IERC20";
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "swapRate";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "tokenAddress";
        readonly type: "address";
    }];
    readonly name: "swapNativeForToken";
    readonly outputs: readonly [];
    readonly stateMutability: "payable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "tokenAddress";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "tokenAmount";
        readonly type: "uint256";
    }];
    readonly name: "swapTokenForNative";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly name: "tokenAddresses";
    readonly outputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "newOwner";
        readonly type: "address";
    }];
    readonly name: "transferOwnership";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "withdrawNative";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "tokenAddress";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly name: "withdrawToken";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly stateMutability: "payable";
    readonly type: "receive";
}];

declare const sonicMainnet: Chain;
declare const sonicTestnet: Chain;
declare class WalletProvider {
    private currentChain;
    chains: Record<string, Chain>;
    private account;
    constructor(privateKey: `0x${string}`, chains?: Record<string, Chain>);
    getAccount(): PrivateKeyAccount;
    getAddress(): Address;
    getCurrentChain(): Chain;
    getPublicClient(chainName: SupportedChain): PublicClient<HttpTransport, Chain>;
    getWalletClient(chainName: SupportedChain): WalletClient;
    checkERC20Allowance(chain: SupportedChain, token: Address, owner: Address, spender: Address): Promise<bigint>;
    approveERC20(chain: SupportedChain, token: Address, spender: Address, amount: bigint): Promise<Hex>;
    transfer(chain: SupportedChain, toAddress: Address, amount: bigint, options?: {
        gas?: bigint;
        gasPrice?: bigint;
        data?: Hex;
    }): Promise<Hex>;
    transferERC20(chain: SupportedChain, tokenAddress: Address, toAddress: Address, amount: bigint, options?: {
        gas?: bigint;
        gasPrice?: bigint;
    }): Promise<Hex>;
    getBalance(): Promise<string>;
    addChain(chain: Record<string, Chain>): void;
    switchChain(chainName: SupportedChain, customRpcUrl?: string): void;
    formatAddress(address: string): Promise<Address>;
    resolveWeb3Name(name: string): Promise<string | null>;
    private setAccount;
    private setChains;
    private setCurrentChain;
    private createHttpTransport;
    static genChainFromName(chainName: string, customRpcUrl?: string | null): Chain;
    getChainConfigs(chainName: SupportedChain): Chain;
}
declare const initWalletProvider: (runtime: IAgentRuntime) => WalletProvider;
declare const sonicWalletProvider: Provider;

declare const transferTemplate = "Given the recent messages and wallet information below:\n\n{{recentMessages}}\n\n{{walletInfo}}\n\nExtract the following information about the requested transfer:\n- Chain to execute on. Must be one of [\"sonic\", \"sonic-testnet\"]. Default is \"sonic\".\n- Token symbol or address(string starting with \"0x\"). Optional.\n- Amount to transfer. Optional. Must be a string representing the amount in ether (only number without coin symbol, e.g., \"0.1\").\n- Recipient address. Must be a valid Ethereum address starting with \"0x\" or a web3 domain name.\n- Data. Optional, data to be included in the transaction.\nIf any field is not provided, use the default value. If no default value is specified, use null.\n\nRespond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined:\n\n```json\n{\n    \"chain\": SUPPORTED_CHAINS,\n    \"token\": string | null,\n    \"amount\": string | null,\n    \"toAddress\": string,\n    \"data\": string | null\n}\n```\n";

declare class TransferAction {
    private walletProvider;
    constructor(walletProvider: WalletProvider);
    transfer(params: TransferParams): Promise<TransferResponse>;
    private validateAndNormalizeParams;
}
declare const transferAction: Action;

declare const PocketFinanceSonicPlugin: Plugin;

export { type BridgeParams, type BridgeResponse, type FaucetParams, type GetBalanceParams, type GetBalanceResponse, type IDeployERC1155Params, type IDeployERC20Params, type IDeployERC721Params, PocketFiStakingAbi, PocketFiSwapAbi, PocketFinanceSonicPlugin, type StakeAction, type StakeParams, type StakeResponse, type SupportedChain, type SwapParams, type SwapResponse, TransferAction, type TransferParams, type TransferResponse, WalletProvider, PocketFinanceSonicPlugin as default, initWalletProvider, sonicMainnet, sonicTestnet, sonicWalletProvider, transferAction, transferTemplate };
