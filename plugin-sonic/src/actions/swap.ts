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
    createPublicClient,
    createWalletClient,
    http,
    formatEther,
    parseEther,
    encodeFunctionData,
    type Address,
    erc20Abi
} from "viem";

import {
    initWalletProvider,
    type WalletProvider,
    sonicTestnet,
} from "../providers/wallet.js";
import { swapTemplate } from "../templates/index.js";
import { PocketFiSwapAbi, type SwapParams, type SwapResponse } from "../types/index.js";

export { swapTemplate };

export class PocketFiSwapAction {
    private readonly SWAP_CONTRACT = '0x787b42FA61F11cE130C40D489A00c56a8f5d335f' as const;
    private readonly SUPPORTED_TOKENS = {
        'POCKET': '0x7a114662911183125B1b5ce893bcA1d59151b5D5',
        'DIAMOND': '0x30BF3761147Ef0c86E2f84c3784FBD89E7954670',
        'CORAL': '0xAF93888cbD250300470A1618206e036E11470149'
    } as const;

    constructor(private walletProvider: WalletProvider) {}

    async swap(params: SwapParams): Promise<SwapResponse> {
        elizaLogger.debug("PocketFi swap params:", params);
        
        if (params.chain !== 'sonic-testnet') {
            throw new Error('Only Sonic testnet is supported for swapping');
        }

        const account = this.walletProvider.getAccount();
        elizaLogger.debug("Using account address:", account.address);
        elizaLogger.debug("Using swap contract:", this.SWAP_CONTRACT);

        // Initialize clients
        const publicClient = createPublicClient({
            chain: sonicTestnet,
            transport: http(sonicTestnet.rpcUrls.default.http[0])
        });

        const walletClient = createWalletClient({
            account,
            chain: sonicTestnet,
            transport: http(sonicTestnet.rpcUrls.default.http[0])
        });

        try {
            // Resolve token address (now handles fromToken for swapTokenForNative)
            const tokenAddress = params.action === 'swapTokenForNative' 
                ? this.resolveTokenAddress(params.fromToken)
                : this.resolveTokenAddress(params.toToken);
            
            elizaLogger.debug("Resolved token address:", tokenAddress);

            // Get swap rate
            const [_, swapRate] = await publicClient.readContract({
                address: this.SWAP_CONTRACT,
                abi: PocketFiSwapAbi,
                functionName: 'supportedTokens',
                args: [tokenAddress],
            });

            if (swapRate === 0n) {
                throw new Error(`Token ${params.toToken} is not supported on PocketSwap`);
            }

            // Calculate expected amounts
            const nativeAmount = parseEther(params.amount);
            const expectedTokens = (nativeAmount * BigInt(1e18)) / swapRate;
            elizaLogger.debug(`Expected tokens: ${formatEther(expectedTokens)}`);

            if (params.action === 'getRate') {
                const oneNativeInTokens = (BigInt(1e18) * BigInt(1e18)) / swapRate;
                return {
                    chain: params.chain,
                    txHash: '0x0',
                    fromToken: 'S',
                    toToken: params.toToken,
                    amount: params.amount,
                    rate: `1 S = ${formatEther(oneNativeInTokens)} ${params.toToken}`
                };
            }

            if (params.action === 'swapNativeForToken') {
                const hash = await walletClient.sendTransaction({
                    account,
                    chain: sonicTestnet,
                    to: this.SWAP_CONTRACT,
                    data: encodeFunctionData({
                        abi: PocketFiSwapAbi,
                        functionName: 'swapNativeForToken',
                        args: [tokenAddress]
                    }),
                    value: nativeAmount
                });

                await publicClient.waitForTransactionReceipt({ hash });

                return {
                    chain: params.chain,
                    txHash: hash,
                    fromToken: 'S',
                    toToken: params.toToken,
                    amount: params.amount,
                };
            }

            if (params.action === 'swapTokenForNative') {
                // Approve tokens first
                const approveHash = await walletClient.writeContract({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [this.SWAP_CONTRACT, nativeAmount]
                });
                await publicClient.waitForTransactionReceipt({ hash: approveHash });

                // Execute swap
                const hash = await walletClient.writeContract({
                    address: this.SWAP_CONTRACT,
                    abi: PocketFiSwapAbi,
                    functionName: 'swapTokenForNative',
                    args: [tokenAddress, nativeAmount]
                });

                await publicClient.waitForTransactionReceipt({ hash });

                return {
                    chain: params.chain,
                    txHash: hash,
                    fromToken: params.toToken,
                    toToken: 'S',
                    amount: params.amount,
                };
            }

            throw new Error(`Invalid swap action: ${params.action}`);

        } catch (error: any) {
            elizaLogger.error("Swap error:", error);
            throw new Error(`Failed to ${params.action}: ${error.message}`);
        }
    }

    private resolveTokenAddress(token: string): Address {
        const upperToken = token.toUpperCase();
        if (upperToken in this.SUPPORTED_TOKENS) {
            return this.SUPPORTED_TOKENS[upperToken as keyof typeof this.SUPPORTED_TOKENS];
        }
        if (token.startsWith('0x')) {
            return token as Address;
        }
        throw new Error(`Token ${token} is not supported`);
    }
}

export const pocketFiSwapAction: Action = {
    name: "pocketfi-swap",
    description: "Swap tokens using PocketFi Swap on Sonic testnet",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<unknown> => {
        if (!state) return false;
        elizaLogger.log("Starting PocketFi swap action...");

        try {
            const walletProvider = initWalletProvider(runtime);
            elizaLogger.debug("Wallet provider initialized");

            const action = new PocketFiSwapAction(walletProvider);
            
            const context = composeContext({
                state,
                template: swapTemplate,
            });
            
            const content = await generateObjectDeprecated({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
            });

            const swapResp = await action.swap({
                chain: "sonic-testnet",
                action: content.action || 'swapNativeForToken',
                fromToken: content.fromToken || 'S',
                toToken: content.toToken,
                amount: content.amount,
            });

            let responseText = swapResp.rate || 
                `Successfully swapped ${swapResp.amount} ${swapResp.fromToken} for ${swapResp.toToken}`;
            
            if (swapResp.txHash !== '0x0') {
                responseText += `\nTransaction Hash: ${swapResp.txHash}`;
            }

            callback?.({
                text: responseText,
                content: swapResp,
            });
            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            elizaLogger.error("Error during PocketFi swap:", errorMessage);
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
                    text: "Swap 10 S for CORAL tokens",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you swap 10 S for CORAL tokens on PocketFi",
                    action: "pocketfi-swap",
                    content: {
                        action: "swapNativeForToken",
                        toToken: "CORAL",
                        amount: "10",
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's the exchange rate for DIAMOND tokens?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check the current swap rate for DIAMOND tokens",
                    action: "pocketfi-swap",
                    content: {
                        action: "getRate",
                        toToken: "DIAMOND",
                        amount: "1",
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap my POCKET tokens back to S",
                },
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
                        amount: "10",
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap 5 DIAMOND for S token",
                },
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
                        amount: "5",
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Exchange 2 CORAL to S",
                },
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
                        amount: "2",
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to swap 1 S token to 0x7a114662911183125B1b5ce893bcA1d59151b5D5 on sonic testnet on pocketSwap",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you swap 1 S for POCKET tokens (0x7a11...5D5) on PocketFi",
                    action: "pocketfi-swap",
                    content: {
                        action: "swapNativeForToken",
                        toToken: "0x7a114662911183125B1b5ce893bcA1d59151b5D5",
                        amount: "1",
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "swap 2 S to token address 0x30BF3761147Ef0c86E2f84c3784FBD89E7954670",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you swap 2 S for DIAMOND tokens (0x30BF...4670) on PocketFi",
                    action: "pocketfi-swap",
                    content: {
                        action: "swapNativeForToken",
                        toToken: "0x30BF3761147Ef0c86E2f84c3784FBD89E7954670",
                        amount: "2",
                    },
                },
            },
        ],
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
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("SONIC_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    }
};