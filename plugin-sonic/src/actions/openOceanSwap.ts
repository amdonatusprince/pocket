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
import { OpenoceanSdk } from '@openocean.finance/openocean-sdk';
import { erc20Abi } from "viem";

import {
    sonicWalletProvider,
    initWalletProvider,
    type WalletProvider,
} from "../providers/wallet.js";
import { swapTemplate } from "../templates/index.js";
import type { SwapParams, SwapResponse } from "../types/index.js";

export { swapTemplate };

const openOcean = new OpenoceanSdk();
const { api, swapSdk } = openOcean;

export class SwapAction {
    constructor(private walletProvider: WalletProvider) {}

    async swap(params: SwapParams): Promise<SwapResponse> {
        elizaLogger.debug("Swap params:", params);
        await this.validateAndNormalizeParams(params);
        elizaLogger.debug("Normalized swap params:", params);

        const fromAddress = this.walletProvider.getAddress();
        this.walletProvider.switchChain(params.chain);

        const resp: SwapResponse = {
            chain: params.chain,
            txHash: "0x",
            fromToken: params.fromToken,
            toToken: params.toToken,
            amount: params.amount,
        };

        // Get exchange data for approval
        const { data: exchangeData } = await api.exchange({
            chain: params.chain
        });

        // Check and handle token approval if needed
        const allowance = await swapSdk.getAllowance({
            chain: params.chain,
            tokenAddress: params.fromToken,
            approveContract: exchangeData.approveContract,
            account: fromAddress,
            decimals: 18 // Default for most tokens
        });

        if (parseFloat(allowance) < parseFloat(params.amount)) {
            const approveResponse = await swapSdk.approve({
                chain: params.chain,
                tokenAddress: params.fromToken,
                approveContract: exchangeData.approveContract,
                amount: params.amount,
                decimals: 18,
                tokenAbi: erc20Abi,
                gasPrice: (await this.getGasPrice(params.chain)).toString()
            });

            // Wait for approval transaction
            await new Promise((resolve, reject) => {
                approveResponse
                    .on('error', reject)
                    .on('success', resolve);
            });
        }

        // Get swap quote
        const quoteResponse = await swapSdk.swapQuote({
            chain: params.chain,
            inTokenAddress: params.fromToken,
            outTokenAddress: params.toToken,
            amount: Number(params.amount),
            gasPrice: (await this.getGasPrice(params.chain)).toString(),
            slippage: params.slippage || 1, // Default 1%
            account: fromAddress,
            referrer: "0x0000000000000000000000000000000000000000",
            referrerFee: 0
        });

        if (quoteResponse.code !== 200) {
            throw new Error(`Quote failed: ${quoteResponse.message}`);
        }

        // Execute swap
        const swapResult = await new Promise((resolve, reject) => {
            swapSdk.swap(quoteResponse.data)
                .on('error', reject)
                .on('transactionHash', (hash: string) => {
                    resp.txHash = hash as `0x${string}`;
                })
                .on('success', resolve);
        });

        return resp;
    }

    private async getGasPrice(chain: string): Promise<number> {
        const gasPrice = await api.getGasPrice({
            chain: chain,
        });
        return Number(gasPrice);
    }

    private async validateAndNormalizeParams(params: SwapParams): Promise<void> {
        if (!params.fromToken || !params.toToken) {
            throw new Error("Both fromToken and toToken addresses are required");
        }

        if (!params.amount) {
            throw new Error("Amount is required");
        }

        if (params.chain !== "sonic") {
            throw new Error("Only Sonic mainnet is supported for swaps");
        }

        // Normalize native token address if needed
        if (params.fromToken.toLowerCase() === "s") {
            params.fromToken = "0x0000000000000000000000000000000000000000";
        }
        if (params.toToken.toLowerCase() === "s") {
            params.toToken = "0x0000000000000000000000000000000000000000";
        }
    }
}

export const swapAction: Action = {
    name: "swap",
    description: "Swap tokens on Sonic networks using OpenOcean",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<unknown> => {
        if (!state) return false;
        elizaLogger.log("Starting swap action...");

        // Check if wallet is available
        const walletInfo = await sonicWalletProvider.get(runtime, message, state);
        if (!walletInfo) {
            callback?.({
                text: "Wallet not available. Please check your configuration.",
                content: { error: "Wallet initialization failed" },
            });
            return false;
        }

        try {
            const walletProvider = initWalletProvider(runtime);
            const action = new SwapAction(walletProvider);
            
            const context = composeContext({
                state,
                template: swapTemplate,
            });
            
            const content = await generateObjectDeprecated({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
            });

            const swapOptions: SwapParams = {
                chain: content.chain,
                fromToken: content.fromToken,
                toToken: content.toToken,
                amount: content.amount,
                slippage: content.slippage,
            };

            const swapResp = await action.swap(swapOptions);
            callback?.({
                text: `Successfully swapped ${swapResp.amount} ${swapResp.fromToken} to ${swapResp.toToken}\nTransaction Hash: ${swapResp.txHash}`,
                content: { ...swapResp },
            });

            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            elizaLogger.error("Error during swap:", errorMessage);
            callback?.({
                text: `Swap failed: ${errorMessage}`,
                content: { error: errorMessage }
            });
            return false;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("SONIC_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Swap 1 S for USDC on Sonic",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you swap 1 S for USDC on Sonic",
                    action: "SWAP",
                    content: {
                        chain: "sonic",
                        fromToken: "S",
                        toToken: "USDC",
                        amount: "1",
                        slippage: 1,
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Buy some token of 0x1234 using 1 USDC on Sonic. The slippage should be no more than 5%",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you swap 1 USDC for token 0x1234 on Sonic",
                    action: "SWAP",
                    content: {
                        chain: "sonic",
                        inputToken: "USDC",
                        outputToken: "0x1234",
                        amount: "1",
                        slippage: 0.05,
                    },
                },
            },
        ],
    ],
    similes: ["SWAP", "TOKEN_SWAP", "EXCHANGE_TOKENS", "TRADE_TOKENS"],
};