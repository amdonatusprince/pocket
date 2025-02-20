import type {
    IAgentRuntime,
    Provider,
    Memory,
    State,
} from "@elizaos/core";
import type {
    Address,
    WalletClient,
    PublicClient,
    Chain,
    HttpTransport,
    Account,
    PrivateKeyAccount,
    Hex,
} from "viem";
import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
    erc20Abi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as viemChains from "viem/chains";
import { createWeb3Name } from "@web3-name-sdk/core";
import { elizaLogger } from "@elizaos/core";

import type { SupportedChain } from "../types";

// Export chain configurations
export const sonicMainnet: Chain = {
    id: 146,
    name: 'Sonic',
    nativeCurrency: {
        name: 'S',
        symbol: 'S',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.soniclabs.com'],
        },
        public: {
            http: ['https://rpc.soniclabs.com'],
        },
    },
} as const;

export const sonicTestnet: Chain = {
    id: 57054,
    name: 'Sonic Blaze Testnet',
    nativeCurrency: {
        name: 'S',
        symbol: 'S',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.blaze.soniclabs.com'],
        },
        public: {
            http: ['https://rpc.blaze.soniclabs.com'],
        },
    },
} as const;

export class WalletProvider {
    private currentChain: SupportedChain = "sonic";
    chains: Record<string, Chain> = { 
        sonic: sonicMainnet,
        "sonic-testnet": sonicTestnet
    };
    private account!: PrivateKeyAccount;

    constructor(privateKey: `0x${string}`, chains?: Record<string, Chain>) {
        elizaLogger.debug("Initializing WalletProvider");
        
        // Add validation
        if (!privateKey || typeof privateKey !== 'string') {
            elizaLogger.error("Invalid private key:", { privateKey: !!privateKey });
            throw new Error("Invalid private key provided");
        }
        
        this.setAccount(privateKey);
        elizaLogger.debug("Account created with address:", this.account?.address);
        
        this.setChains(chains);
        if (chains && Object.keys(chains).length > 0) {
            this.setCurrentChain(Object.keys(chains)[0] as SupportedChain);
        }
        elizaLogger.debug("WalletProvider initialized successfully");
    }

    getAccount(): PrivateKeyAccount {
        return this.account;
    }

    getAddress(): Address {
        if (!this.account) {
            elizaLogger.error("Wallet not initialized");
            throw new Error("Wallet not initialized");
        }
        return this.account.address;
    }

    getCurrentChain(): Chain {
        return this.chains[this.currentChain];
    }

    getPublicClient(
        chainName: SupportedChain
    ): PublicClient<HttpTransport, Chain> {
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

    getWalletClient(chainName: SupportedChain): WalletClient {
        if (!this.account) {
            throw new Error("Wallet not initialized");
        }

        const transport = this.createHttpTransport(chainName);
        return createWalletClient({
            chain: this.chains[chainName],
            transport,
            account: this.account,
        });
    }

    async checkERC20Allowance(
        chain: SupportedChain,
        token: Address,
        owner: Address,
        spender: Address,
    ): Promise<bigint> {
        const publicClient = this.getPublicClient(chain);
        return await publicClient.readContract({
            address: token,
            abi: erc20Abi,
            functionName: "allowance",
            args: [owner, spender],
        });
    }

    async approveERC20(
        chain: SupportedChain,
        token: Address,
        spender: Address,
        amount: bigint
    ): Promise<Hex> {
        const publicClient = this.getPublicClient(chain);
        const walletClient = this.getWalletClient(chain);
        const { request } = await publicClient.simulateContract({
            account: this.account,
            address: token,
            abi: erc20Abi,
            functionName: "approve",
            args: [spender, amount],
        });

        return await walletClient.writeContract(request);
    }

    async transfer(
        chain: SupportedChain,
        toAddress: Address,
        amount: bigint,
        options?: {
            gas?: bigint;
            gasPrice?: bigint;
            data?: Hex;
        }
    ): Promise<Hex> {
        const walletClient = this.getWalletClient(chain);
        
        // Create transaction parameters
        const transactionRequest = {
            account: this.account,
            to: toAddress,
            value: amount,
            chain: this.chains[chain],
            // Only include data if it's provided and valid
            ...(options?.data ? { data: options.data } : {}),
            ...(options?.gas ? { gas: options.gas } : {}),
            ...(options?.gasPrice ? { gasPrice: options.gasPrice } : {})
        };

        elizaLogger.debug("Transfer transaction request:", transactionRequest);
        
        return await walletClient.sendTransaction(transactionRequest);
    }

    async transferERC20(
        chain: SupportedChain,
        tokenAddress: Address,
        toAddress: Address,
        amount: bigint,
        options?: {
            gas?: bigint;
            gasPrice?: bigint;
        }
    ): Promise<Hex> {
        const publicClient = this.getPublicClient(chain);
        const walletClient = this.getWalletClient(chain);
        const { request } = await publicClient.simulateContract({
            account: this.account,
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "transfer",
            args: [toAddress, amount],
            ...options,
        });

        return await walletClient.writeContract(request);
    }

    async getBalance(): Promise<string> {
        const client = this.getPublicClient(this.currentChain);
        const balance = await client.getBalance({
            address: this.account.address,
        });
        return formatUnits(balance, 18);
    }

    addChain(chain: Record<string, Chain>) {
        this.setChains(chain);
    }

    switchChain(chainName: SupportedChain, customRpcUrl?: string) {
        if (!this.chains[chainName]) {
            const chain = WalletProvider.genChainFromName(
                chainName,
                customRpcUrl
            );
            this.addChain({ [chainName]: chain });
        }
        this.setCurrentChain(chainName);
    }

    async formatAddress(address: string): Promise<Address> {
        if (address.endsWith('.eth') || address.endsWith('.xyz')) {
            const resolvedAddress = await this.resolveWeb3Name(address);
            if (!resolvedAddress) {
                throw new Error(`Could not resolve address for ${address}`);
            }
            return resolvedAddress as Address;
        }
        return address as Address;
    }

    async resolveWeb3Name(name: string): Promise<string | null> {
        const nameService = createWeb3Name();
        return await nameService.getAddress(name);
    }

    private setAccount(privateKey: `0x${string}`) {
        try {
            const formattedKey = privateKey.startsWith('0x') ? 
                privateKey : 
                `0x${privateKey}` as `0x${string}`;
            this.account = privateKeyToAccount(formattedKey);
            elizaLogger.debug("Account set successfully");
        } catch (error: any) {
            elizaLogger.error("Failed to set account:", error);
            throw new Error(`Invalid private key: ${error?.message || 'Unknown error'}`);
        }
    }

    private setChains = (chains?: Record<string, Chain>) => {
        if (!chains) {
            return;
        }
        for (const chain of Object.keys(chains)) {
            this.chains[chain] = chains[chain];
        }
    };

    private setCurrentChain = (chain: SupportedChain) => {
        this.currentChain = chain;
    };

    private createHttpTransport = (chainName: SupportedChain) => {
        const chain = this.chains[chainName];
        if (!chain) {
            throw new Error(`Chain ${chainName} not configured`);
        }
        return http(chain.rpcUrls.default.http[0]);
    };

    static genChainFromName(
        chainName: string,
        customRpcUrl?: string | null
    ): Chain {
        // First check if it's a Sonic chain
        if (chainName === 'sonic') return sonicMainnet;
        if (chainName === 'sonic-testnet') return sonicTestnet;

        throw new Error("Unsupported chain name");
    }

    getChainConfigs(chainName: SupportedChain): Chain {
        return this.chains[chainName];
    }
}

const genChainsFromRuntime = (
    runtime: IAgentRuntime
): Record<string, Chain> => {
    return {
        "sonic": sonicMainnet,
        "sonic-testnet": sonicTestnet
    };
};

export const initWalletProvider = (runtime: IAgentRuntime) => {
    elizaLogger.debug("Initializing wallet provider from runtime");
    const privateKey = process.env.SONIC_PRIVATE_KEY || runtime.getSetting("SONIC_PRIVATE_KEY");
    
    if (!privateKey) {
        elizaLogger.error("SONIC_PRIVATE_KEY not found");
        throw new Error("SONIC_PRIVATE_KEY not found");
    }

    // Add debug logging
    elizaLogger.debug("Private key exists:", !!privateKey);
    
    const chains = genChainsFromRuntime(runtime);
    const provider = new WalletProvider(privateKey as `0x${string}`, chains);
    
    // Verify account creation
    const address = provider.getAddress();
    elizaLogger.debug("Initialized wallet address:", address);
    
    return provider;
};

export const sonicWalletProvider: Provider = {
    async get(
        runtime: IAgentRuntime,
        _message: Memory,
        _state?: State
    ): Promise<string | null> {
        try {
            const walletProvider = initWalletProvider(runtime);
            const address = walletProvider.getAddress();
            const balance = await walletProvider.getBalance();
            const chain = walletProvider.getCurrentChain();
            return `Sonic Wallet Address: ${address}\nBalance: ${balance} ${chain.nativeCurrency.symbol}\nChain ID: ${chain.id}, Name: ${chain.name}`;
        } catch (error) {
            console.error("Error in Sonic wallet provider:", error);
            return null;
        }
    },
};
