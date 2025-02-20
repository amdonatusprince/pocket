import {
    composeContext,
    elizaLogger,
    generateObjectDeprecated,
    type HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
    Action,
} from "@elizaos/core";
import {
    type Address,
    formatEther,
    parseEther,
    encodeFunctionData,
    walletActions,
    createPublicClient,
    createWalletClient,
    http
} from "viem";

import {
    sonicWalletProvider,
    initWalletProvider,
    type WalletProvider,
    sonicTestnet,
} from "../providers/wallet.js";
import { stakeTemplate } from "../templates/index.js";
import { PocketFiStakingAbi, type StakeParams, type StakeResponse } from "../types/index.js";

export { stakeTemplate };

export class PocketFiStakeAction {
    private readonly POCKET_FI_STAKING = 
        "0x404Bf459100f97644d1Fd1dc591eE4A8BC8B5F65" as const;

    constructor(private walletProvider: WalletProvider) {}

    async stake(params: StakeParams): Promise<StakeResponse> {
        elizaLogger.debug("PocketFi stake params:", params);
        
        if (params.chain !== 'sonic-testnet') {
            throw new Error('Only Sonic testnet is supported for staking');
        }

        const account = this.walletProvider.getAccount();
        elizaLogger.debug("Using account address:", account.address);
        elizaLogger.debug("Using contract address:", this.POCKET_FI_STAKING);
        elizaLogger.debug("Using chain:", sonicTestnet.name);

        // Explicitly create clients with sonicTestnet chain
        const publicClient = createPublicClient({
            chain: sonicTestnet,
            transport: http(sonicTestnet.rpcUrls.default.http[0])
        });

        const walletClient = createWalletClient({
            account,
            chain: sonicTestnet,
            transport: http(sonicTestnet.rpcUrls.default.http[0])
        }).extend(walletActions);

        const balance = await publicClient.getBalance({ address: account.address });
        elizaLogger.debug("Account balance:", formatEther(balance), "S");

        try {
            const stakeInfo = await this.getUserStakeInfo(account.address);
            elizaLogger.debug("Current stake info:", {
                stakedAmount: stakeInfo.stakedAmount,
                pendingRewards: stakeInfo.pendingRewards,
                stakeTimestamp: Number(stakeInfo.stakeTimestamp),
            });

            switch (params.action) {
                case 'deposit': {
                    if (!params.amount) throw new Error("Amount is required for deposit");
                    const value = parseEther(params.amount);
                    
                    if (balance < value) {
                        throw new Error(`Insufficient balance. You have ${formatEther(balance)} S but trying to stake ${params.amount} S`);
                    }

                    const hash = await walletClient.sendTransaction({
                        account,
                        chain: sonicTestnet,
                        to: this.POCKET_FI_STAKING,
                        data: encodeFunctionData({
                            abi: PocketFiStakingAbi,
                            functionName: 'stake',
                            args: [value]
                        }),
                        value
                    });

                    await publicClient.waitForTransactionReceipt({ hash });
                    return { 
                        response: `Successfully staked ${params.amount} S. Current staked balance: ${stakeInfo.stakedAmount} sPOCKET\nTransaction Hash: ${hash}`,
                        hash
                    };
                }

                case 'withdraw': {
                    if (!params.amount) throw new Error("Amount is required for withdraw");
                    const value = parseEther(params.amount);
                    
                    if (parseEther(stakeInfo.stakedAmount) < value) {
                        throw new Error(`Insufficient staked balance. You have ${stakeInfo.stakedAmount} sPOCKET but trying to withdraw ${params.amount} S`);
                    }

                    const hash = await walletClient.sendTransaction({
                        account,
                        chain: sonicTestnet,
                        to: this.POCKET_FI_STAKING,
                        data: encodeFunctionData({
                            abi: PocketFiStakingAbi,
                            functionName: 'withdraw',
                            args: [value]
                        })
                    });

                    await publicClient.waitForTransactionReceipt({ hash });
                    const newStakeInfo = await this.getUserStakeInfo(account.address);
                    return { 
                        response: `Successfully withdrawn ${params.amount} S. Remaining staked balance: ${newStakeInfo.stakedAmount} sPOCKET\nTransaction Hash: ${hash}`,
                        hash
                    };
                }

                case 'claim': {
                    const earned = await this.getEarned(account.address);
                    if (parseEther(earned) <= 0n) {
                        throw new Error("No rewards available to claim");
                    }

                    const hash = await walletClient.sendTransaction({
                        account,
                        chain: sonicTestnet,
                        to: this.POCKET_FI_STAKING,
                        data: encodeFunctionData({
                            abi: PocketFiStakingAbi,
                            functionName: 'claimReward'
                        })
                    });

                    await publicClient.waitForTransactionReceipt({ hash });
                    return { 
                        response: `Successfully claimed ${earned} S in rewards\nTransaction Hash: ${hash}`,
                        hash
                    };
                }

                case 'earned': {
                    const earned = await this.getEarned(account.address);
                    return {
                        response: `Your pending rewards: ${earned} S`,
                        hash: '0x0' as `0x${string}`
                    };
                }

                case 'info': {
                    const info = await this.getUserStakeInfo(account.address);
                    return {
                        response: `Staked Amount: ${info.stakedAmount} sPOCKET\nPending Rewards: ${info.pendingRewards} S\nStake Time: ${new Date(Number(info.stakeTimestamp) * 1000).toLocaleString()}`,
                        hash: '0x0' as `0x${string}`
                    };
                }

                default:
                    throw new Error(`Invalid action: ${params.action}`);
            }
        } catch (error: any) {
            elizaLogger.error("Stake error:", error);
            throw new Error(`Failed to ${params.action}: ${error.message}`);
        }
    }

    async getEarned(address: Address): Promise<string> {
        const publicClient = createPublicClient({
            chain: sonicTestnet,
            transport: http(sonicTestnet.rpcUrls.default.http[0])
        });
        
        try {
            elizaLogger.debug("Getting earned rewards for address:", address);
            const earned = await publicClient.readContract({
                address: this.POCKET_FI_STAKING,
                abi: PocketFiStakingAbi,
                functionName: 'earned',
                args: [address],
            });
            elizaLogger.debug("Raw earned response:", earned);
            return formatEther(earned);
        } catch (error: any) {
            elizaLogger.error("Error getting earned rewards:", {
                error: error.message,
                code: error.code,
                details: error.details,
            });
            throw error;
        }
    }

    async getUserStakeInfo(address: Address): Promise<{
        stakedAmount: string;
        pendingRewards: string;
        stakeTimestamp: bigint;
        lastRewardTime: bigint;
    }> {
        const publicClient = createPublicClient({
            chain: sonicTestnet,
            transport: http(sonicTestnet.rpcUrls.default.http[0])
        });
        
        try {
            elizaLogger.debug("Getting stake info for address:", address);
            const info = await publicClient.readContract({
                address: this.POCKET_FI_STAKING,
                abi: PocketFiStakingAbi,
                functionName: 'getUserStakeInfo',
                args: [address],
            });
            elizaLogger.debug("Raw stake info response:", info);
            
            return {
                stakedAmount: formatEther(info[0]),
                pendingRewards: formatEther(info[1]),
                stakeTimestamp: info[2],
                lastRewardTime: info[3],
            };
        } catch (error: any) {
            elizaLogger.error("Error getting stake info:", {
                error: error.message,
                code: error.code,
                details: error.details,
            });
            throw error;
        }
    }

    async getStakeWalletInfo(): Promise<string> {
        const address = this.walletProvider.getAddress();
        if (!address) {
            throw new Error("No wallet address available");
        }

        // Create public client with explicit sonic testnet config
        const publicClient = createPublicClient({
            chain: sonicTestnet,
            transport: http(sonicTestnet.rpcUrls.default.http[0])
        });

        try {
            elizaLogger.debug("Getting wallet info for address:", address);
            const [nativeBalance, stakeInfo, apr] = await Promise.all([
                publicClient.getBalance({ address }),
                this.getUserStakeInfo(address),
                publicClient.readContract({
                    address: this.POCKET_FI_STAKING,
                    abi: PocketFiStakingAbi,
                    functionName: 'getAPR'
                })
            ]);
            
            elizaLogger.debug("Wallet info response:", {
                balance: formatEther(nativeBalance),
                stakeInfo,
                apr: Number(apr) / 100
            });

            return [
                `Wallet Address: ${address}`,
                `Chain: ${sonicTestnet.name}`,
                `Native Balance: ${formatEther(nativeBalance)} ${sonicTestnet.nativeCurrency.symbol}`,
                `Staked Amount: ${stakeInfo.stakedAmount} sPOCKET`,
                `Pending Rewards: ${stakeInfo.pendingRewards} S`,
                `Current APR: ${Number(apr) / 100}%`,
                `Stake Time: ${new Date(Number(stakeInfo.stakeTimestamp) * 1000).toLocaleString()}`,
            ].join('\n');
        } catch (error: any) {
            elizaLogger.error("Error getting wallet info:", {
                error: error.message,
                code: error.code,
                details: error.details,
            });
            throw error;
        }
    }
}

export const pocketFiStakeAction: Action = {
    name: "pocketfi-stake",
    description: "Stake, unstake, and claim rewards through PocketFi Staking on Sonic network",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<unknown> => {
        if (!state) return false;
        elizaLogger.log("Starting PocketFi stake action...");

        try {
            const walletProvider = initWalletProvider(runtime);
            elizaLogger.debug("Wallet provider initialized");
            elizaLogger.debug("Wallet address:", walletProvider.getAddress());
            elizaLogger.debug("Chain:", sonicTestnet.name);

            const action = new PocketFiStakeAction(walletProvider);
            
            const context = composeContext({
                state,
                template: stakeTemplate,
            });
            
            const content = await generateObjectDeprecated({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
            });

            const stakeResp = await action.stake({
                chain: "sonic-testnet",
                action: content.action,
                amount: content.amount,
            });

            const walletInfo = await action.getStakeWalletInfo();
            callback?.({
                text: `${stakeResp.response}\n\n${walletInfo}`,
                content: { 
                    ...stakeResp,
                    walletInfo 
                },
            });
            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            elizaLogger.error("Error during PocketFi stake:", errorMessage);
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
                    text: "Stake 1 S to earn rewards",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you stake 1 S on PocketFi",
                    action: "pocketfi-stake",
                    content: {
                        action: "deposit",
                        amount: "1",
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Withdraw 0.5 S from staking",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you withdraw 0.5 S from PocketFi staking",
                    action: "pocketfi-stake",
                    content: {
                        action: "withdraw",
                        amount: "0.5",
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Claim my staking rewards",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you claim your PocketFi staking rewards",
                    action: "pocketfi-stake",
                    content: {
                        action: "claim",
                    },
                },
            },
        ],
        [
        {
            user: "{{user1}}",
            content: {
                text: "Check my staking rewards",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "I'll check your PocketFi staking rewards",
                action: "pocketfi-stake",
                content: {
                    action: "earned",
                },
            },
        },
    ],
    [
        {
            user: "{{user1}}",
            content: {
                text: "Show my staking info",
            },
        },
        {
            user: "{{agent}}",
            content: {
                text: "I'll show your PocketFi staking information",
                action: "pocketfi-stake",
                content: {
                    action: "info",
                },
            },
        },
    ],
    ],
    similes: ["STAKE", "UNSTAKE", "WITHDRAW", "CLAIM_REWARDS", "CHECK_STAKE", "GET_REWARDS"],
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("SONIC_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    }
};
