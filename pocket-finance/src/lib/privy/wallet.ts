import type { Chain } from 'viem';

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