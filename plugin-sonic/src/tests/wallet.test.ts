import { describe, expect, it, beforeEach } from "vitest";
import { WalletProvider, sonicMainnet, sonicTestnet } from "../providers/wallet";

describe("WalletProvider", () => {
    const testPrivateKey = "0x1234567890123456789012345678901234567890123456789012345678901234";
    let walletProvider: WalletProvider;

    beforeEach(() => {
        walletProvider = new WalletProvider(testPrivateKey);
    });

    describe("Chain Management", () => {
        it("initializes with default chains", () => {
            expect(walletProvider.chains["sonic"]).toBeDefined();
            expect(walletProvider.chains["sonic-testnet"]).toBeDefined();
        });

        it("get chain configs", () => {
            expect(walletProvider.getChainConfigs("sonic").id).toEqual(sonicMainnet.id);
            expect(walletProvider.getChainConfigs("sonic-testnet").id).toEqual(sonicTestnet.id);
        });

        it("switches chains", () => {
            walletProvider.switchChain("sonic-testnet");
            expect(walletProvider.getCurrentChain().id).toEqual(sonicTestnet.id);

            walletProvider.switchChain("sonic");
            expect(walletProvider.getCurrentChain().id).toEqual(sonicMainnet.id);
        });
    });

    describe("Account Management", () => {
        it("initializes with private key", () => {
            expect(walletProvider.getAccount()).toBeDefined();
            expect(walletProvider.getAddress()).toBeDefined();
        });
    });

    describe("Client Creation", () => {
        it("creates public client", () => {
            const publicClient = walletProvider.getPublicClient("sonic");
            expect(publicClient).toBeDefined();
        });

        it("creates wallet client", () => {
            const walletClient = walletProvider.getWalletClient("sonic");
            expect(walletClient).toBeDefined();
        });
    });
});
