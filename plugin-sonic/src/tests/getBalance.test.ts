import { describe, it, beforeEach, expect } from "vitest";
import {
    generatePrivateKey,
    Account,
    privateKeyToAccount,
} from "viem/accounts";

import { GetBalanceAction } from "../actions/getBalance";
import { WalletProvider } from "../providers/wallet";
import { GetBalanceParams } from "../types";

describe("GetBalance Action", () => {
    let account: Account;
    let wp: WalletProvider;
    let ga: GetBalanceAction;

    beforeEach(async () => {
        const pk = generatePrivateKey();
        account = privateKeyToAccount(pk);
        wp = new WalletProvider(pk);
        ga = new GetBalanceAction(wp);
    });

    describe("Get Balance", () => {
        it("get native token balance", async () => {
            const input: GetBalanceParams = {
                chain: "sonic",
                address: account.address,
                token: "S",
            };
            const resp = await ga.getBalance(input);
            expect(resp.balance).toBeDefined();
            expect(typeof resp.balance).toBe("object");
        });

        it("get USDC balance", async () => {
            const input: GetBalanceParams = {
                chain: "sonic",
                address: account.address,
                token: "USDC",
            };
            const resp = await ga.getBalance(input);
            expect(resp.balance).toBeDefined();
            expect(typeof resp.balance).toBe("object");
        });

        it("get balance by token contract address", async () => {
            const input: GetBalanceParams = {
                chain: "sonic",
                address: account.address,
                token: "0x55d398326f99059ff775485246999027b3197955",
            };
            const resp = await ga.getBalance(input);
            expect(resp.balance).toBeDefined();
            expect(typeof resp.balance).toBe("object");
        });

        it("get balance on testnet", async () => {
            const input: GetBalanceParams = {
                chain: "sonic-testnet",
                address: account.address,
                token: "S",
            };
            const resp = await ga.getBalance(input);
            expect(resp.balance).toBeDefined();
            expect(typeof resp.balance).toBe("object");
        });

        it("handles invalid token address", async () => {
            const input: GetBalanceParams = {
                chain: "sonic",
                address: account.address,
                token: "0xinvalid",
            };
            await expect(ga.getBalance(input)).rejects.toThrow();
        });

        it("handles missing address", async () => {
            const input: GetBalanceParams = {
                chain: "sonic",
                address: "0x0000000000000000000000000000000000000000",
                token: "S",
            };
            await expect(ga.getBalance(input)).rejects.toThrow("Address is required for getting balance");
        });
    });
});
