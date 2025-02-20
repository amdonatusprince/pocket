// export * from "./actions/swap";
export * from "./actions/transfer";
export * from "./providers/wallet";
export * from "./types";

import type { Plugin } from "@elizaos/core";
import { pocketFiSwapAction } from "./actions/swap";
import { perplexityAction } from "./actions/perplexity";
import { transferAction } from "./actions/transfer";
import { sonicWalletProvider } from "./providers/wallet";
import { getBalanceAction } from "./actions/getBalance";
import { pocketFiStakeAction } from "./actions/stake";
import { deployAction } from "./actions/deploy";

export const PocketFinanceSonicPlugin: Plugin = {
    name: "pocket-finance",
    description:
        "Pocket Finance integration plugin that allows users to complete onchain actions on the Sonic blockchain, including invoicing, transferring, swapping, staking, bridging, token deployments, and financial analysis",
    providers: [sonicWalletProvider],
    evaluators: [],
    services: [],
    actions: [
        getBalanceAction,
        pocketFiSwapAction,
        transferAction,
        perplexityAction,
        pocketFiStakeAction,
        deployAction,
    ],
};

export default PocketFinanceSonicPlugin;
