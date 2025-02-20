import {
    elizaLogger,
    type HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
    composeContext,
    generateObjectDeprecated,
    Action,
} from "@elizaos/core";
import {
    formatUnits,
    parseEther,
    parseUnits,
    erc20Abi,
    createPublicClient,
    http,
    createWalletClient,
} from "viem";

import {
    initWalletProvider,
    type WalletProvider,
    sonicMainnet,
    sonicTestnet,
} from "../providers/wallet.js";
import { transferTemplate } from "../templates/index.js";
import type { TransferParams, TransferResponse } from "../types/index.js";
import { sonicWalletProvider } from "../providers/wallet.js";

export { transferTemplate };

export class TransferAction {
    constructor(private walletProvider: WalletProvider) {}
    async transfer(params: TransferParams): Promise<TransferResponse> {
        elizaLogger.debug("Transfer params:", params);
        
        // Validate chain first
        if (params.chain !== 'sonic' && params.chain !== 'sonic-testnet') {
            throw new Error('Unsupported chain. Must be either "sonic" or "sonic-testnet"');
        }

        await this.validateAndNormalizeParams(params);
        elizaLogger.debug("Normalized transfer params:", params);

        const chainConfig = params.chain === 'sonic' ? sonicMainnet : sonicTestnet;
        const nativeToken = chainConfig.nativeCurrency.symbol;

        // Initialize clients like in testBalance.ts
        const publicClient = createPublicClient({
            chain: chainConfig,
            transport: http(chainConfig.rpcUrls.default.http[0])
        });

        const walletClient = createWalletClient({
            chain: chainConfig,
            transport: http(chainConfig.rpcUrls.default.http[0])
        });

        const account = this.walletProvider.getAccount();

        const resp: TransferResponse = {
            chain: params.chain,
            txHash: "0x",
            recipient: params.toAddress,
            amount: "",
            token: params.token ?? nativeToken,
        };

        if (!params.token || params.token === nativeToken) {
            // Native token transfer
            try {
                // Prepare transfer
                const value = parseEther(params.amount || '0');
                
                // Send transaction (similar to testBalance.ts)
                const hash = await walletClient.sendTransaction({
                    account,
                    to: params.toAddress as `0x${string}`,
                    value,
                });

                resp.txHash = hash;
                resp.amount = params.amount || '0';

                // Wait for transaction
                await publicClient.waitForTransactionReceipt({ hash });
                
                return resp;
            } catch (error: any) {
                elizaLogger.error("Transfer failed:", error);
                throw new Error(`Transfer failed: ${error.message}`);
            }
        } else {
            // ERC20 token transfer
            if (!params.token) throw new Error("Token address is required");
            if (!params.token.startsWith("0x")) {
                throw new Error("Token address must start with 0x");
            }

            const decimals = await publicClient.readContract({
                address: params.token as `0x${string}`,
                abi: erc20Abi,
                functionName: "decimals",
            });

            let value: bigint;
            if (!params.amount) {
                value = await publicClient.readContract({
                    address: params.token as `0x${string}`,
                    abi: erc20Abi,
                    functionName: "balanceOf",
                    args: [account.address as `0x${string}`],
                });
            } else {
                value = parseUnits(params.amount, decimals);
            }

            resp.amount = formatUnits(value, decimals);
            resp.txHash = await this.walletProvider.transferERC20(
                params.chain,
                params.token as `0x${string}`,
                params.toAddress,
                value
            );
        }

        if (!resp.txHash || resp.txHash === "0x") {
            throw new Error("Get transaction hash failed");
        }

        // wait for the transaction to be confirmed
        await publicClient.waitForTransactionReceipt({
            hash: resp.txHash,
        });

        return resp;
    }

    private async validateAndNormalizeParams(params: TransferParams): Promise<void> {
        if (!params.toAddress) {
            throw new Error("To address is required");
        }
        params.toAddress = await this.walletProvider.formatAddress(params.toAddress);
        
        if (!params.toAddress || params.toAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error("Invalid recipient address");
        }
    }
}

export const transferAction: Action = {
    name: "transfer",
    description: "Transfer tokens on Sonic networks. Supports both native S token and ERC20 tokens.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<unknown> => {
        if (!state) return false;
        elizaLogger.log("Starting transfer action...");

        // Check if transfer is allowed
        const walletInfo = await sonicWalletProvider.get(runtime, message, state);
        if (!walletInfo) {
            callback?.({
                text: "Wallet not available. Please check your configuration.",
                content: { error: "Wallet initialization failed" },
            });
            return false;
        }

        if (!(message.content.source === "direct")) {
            callback?.({
                text: "I can't do that for you.",
                content: { error: "Transfer not allowed" },
            });
            return false;
        }

        try {
            const walletProvider = initWalletProvider(runtime);
            const action = new TransferAction(walletProvider);
            
            const context = composeContext({
                state,
                template: transferTemplate,
            });
            
            const content = await generateObjectDeprecated({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
            });

            const paramOptions: TransferParams = {
                chain: content.chain,
                token: content.token,
                amount: content.amount,
                toAddress: content.toAddress,
                data: content.data,
            };

            const transferResp = await action.transfer(paramOptions);
            callback?.({
                text: `Successfully transferred ${transferResp.amount} ${transferResp.token} to ${transferResp.recipient}\nTransaction Hash: ${transferResp.txHash}`,
                content: { ...transferResp },
            });

            return true;
        } catch (error: any) {
            elizaLogger.error("Error during transfer:", error.message);
            callback?.({
                text: `Transfer failed: ${error.message}`,
                content: { error: error.message },
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
                    text: "Transfer 1 S to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                },
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
                        toAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
                    },
                },
            },
        ],
    ],
    similes: ["TRANSFER", "SEND"]
};
