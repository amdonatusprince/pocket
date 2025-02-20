import {
    composeContext,
    elizaLogger,
    generateObjectDeprecated,
    type HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
    type Action,
} from "@elizaos/core";
import {
    erc20Abi,
    formatEther,
    formatUnits,
    type Address,
    createPublicClient,
    http,
} from "viem";

import {
    sonicWalletProvider,
    initWalletProvider,
    type WalletProvider,
    sonicMainnet,
    sonicTestnet,
} from "../providers/wallet.js";
import { getBalanceTemplate } from "../templates/index.js";
import type {
    GetBalanceParams,
    GetBalanceResponse,
    SupportedChain,
} from "../types/index.js";

export { getBalanceTemplate };

export class GetBalanceAction {
    constructor(private walletProvider: WalletProvider) {}

    async getBalance(params: GetBalanceParams): Promise<GetBalanceResponse> {
        elizaLogger.debug("Get balance params:", params);
        
        // Validate chain first
        if (params.chain !== 'sonic' && params.chain !== 'sonic-testnet') {
            throw new Error('Unsupported chain. Must be either "sonic" or "sonic-testnet"');
        }

        const chainConfig = params.chain === 'sonic' ? sonicMainnet : sonicTestnet;
        elizaLogger.debug("Using chain:", chainConfig.name);

        // Get and validate address BEFORE creating the client
        let address = params.address;
        if (!address) {
            address = this.walletProvider.getAddress();
            elizaLogger.debug("Using wallet address:", address);
        }

        // Ensure we have a valid address
        if (!address || address === '0x0000000000000000000000000000000000000000') {
            elizaLogger.error("Invalid address:", address);
            throw new Error("Invalid or missing address");
        }

        // Initialize public client
        const publicClient = createPublicClient({
            chain: chainConfig,
            transport: http(chainConfig.rpcUrls.default.http[0])
        });

        try {
            // Ensure address is properly formatted
            const formattedAddress = address as `0x${string}`;
            elizaLogger.debug("Querying balance for address:", formattedAddress);

            if (!params.token || params.token.toLowerCase() === chainConfig.nativeCurrency.symbol.toLowerCase()) {
                // Get native token balance
                const nativeBalance = await publicClient.getBalance({
                    address: formattedAddress,
                });
                
                return {
                    chain: params.chain,
                    address: formattedAddress,
                    balance: {
                        token: chainConfig.nativeCurrency.symbol,
                        amount: formatEther(nativeBalance)
                    }
                };
            } else {
                // Get ERC20 token balance
                const tokenAddress = params.token as `0x${string}`;
                const [balance, decimals, symbol, name] = await Promise.all([
                    publicClient.readContract({
                        address: tokenAddress,
                        abi: erc20Abi,
                        functionName: 'balanceOf',
                        args: [formattedAddress],
                    }),
                    publicClient.readContract({
                        address: tokenAddress,
                        abi: erc20Abi,
                        functionName: 'decimals',
                    }),
                    publicClient.readContract({
                        address: tokenAddress,
                        abi: erc20Abi,
                        functionName: 'symbol',
                    }),
                    publicClient.readContract({
                        address: tokenAddress,
                        abi: erc20Abi,
                        functionName: 'name',
                    })
                ]);

                return {
                    chain: params.chain,
                    address: formattedAddress,
                    balance: {
                        token: symbol,
                        amount: formatUnits(balance, decimals),
                        tokenName: name
                    }
                };
            }
        } catch (error: any) {
            elizaLogger.error("Get balance error:", error);
            throw new Error(`Failed to get balance: ${error.message}`);
        }
    }

    async getWalletInfo(chain: SupportedChain): Promise<string> {
        const address = this.walletProvider.getAddress();
        if (!address) {
            throw new Error("No wallet address available");
        }

        const chainConfig = chain === 'sonic' ? sonicMainnet : sonicTestnet;
        elizaLogger.debug("Getting wallet info for chain:", chainConfig.name);

        // Initialize public client explicitly
        const publicClient = createPublicClient({
            chain: chainConfig,
            transport: http(chainConfig.rpcUrls.default.http[0])
        });

        try {
            const nativeBalance = await publicClient.getBalance({
                address: address as `0x${string}`,
            });

            return [
                `Wallet Address: ${address}`,
                `Chain: ${chainConfig.name}`,
                `Native Balance: ${formatEther(nativeBalance)} ${chainConfig.nativeCurrency.symbol}`
            ].join('\n');
        } catch (error: any) {
            elizaLogger.error("Error getting wallet info:", error);
            throw new Error(`Failed to get wallet info: ${error.message}`);
        }
    }
}

export const getBalanceAction: Action = {
    name: "getBalance",
    description: "Get wallet information and token balances on Sonic networks. Supports both native S token and ERC20 tokens.",
    handler: async (
        runtime: IAgentRuntime, 
        message: Memory, 
        state?: State,
        _options?: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<unknown> => {
        if (!state) return false;
        elizaLogger.log("Starting getBalance action...");

        try {
            const walletProvider = initWalletProvider(runtime);
            elizaLogger.debug("Wallet provider initialized");

            const address = walletProvider.getAddress();
            if (!address) {
                throw new Error("No wallet address available");
            }
            elizaLogger.debug("Using wallet address:", address);

            const action = new GetBalanceAction(walletProvider);
            
            // Get context for token info
            const context = composeContext({
                state,
                template: getBalanceTemplate,
            });
            
            const content = await generateObjectDeprecated({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
            });

            // Use the wallet address instead of content.address
            const getBalanceResp = await action.getBalance({
                chain: content.chain || 'sonic-testnet',  // Default to testnet if not specified
                address: content.address || address, 
                token: content.token,  // Keep token from content
            });

            elizaLogger.debug("Balance response:", getBalanceResp);

            if (callback) {
                const walletInfo = await action.getWalletInfo(getBalanceResp.chain);
                let text = walletInfo + "\n\n";
                if (getBalanceResp.balance) {
                    const tokenName = getBalanceResp.balance.tokenName 
                        ? ` (${getBalanceResp.balance.tokenName})`
                        : '';
                    text += `Token Balance: ${getBalanceResp.balance.amount} ${getBalanceResp.balance.token}${tokenName}`;
                }
                callback({
                    text,
                    content: getBalanceResp,
                });
            }
            return true;
        } catch (error: any) {
            elizaLogger.error("Error during get balance:", error.message);
            callback?.({
                text: `Get balance failed: ${error.message}`,
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
                    text: "Show my wallet info and S token balance",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you check your wallet information and S token balance",
                    action: "GET_BALANCE",
                    content: {
                        chain: "sonic",
                        token: "S",
                    },
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check my balance of token 0x1234 on testnet",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you check your balance of token 0x1234 on Sonic testnet",
                    action: "GET_BALANCE",
                    content: {
                        chain: "sonic-testnet",
                        token: "0x1234",
                    },
                },
            },
        ],
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
