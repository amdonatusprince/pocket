import type { PrivyClientConfig } from '@privy-io/react-auth';
// import { sonic, sonicTestnet } from 'viem/chains';
import { sonicMainnet, sonicTestnet } from './wallet';

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID!;

export const PRIVY_CONFIG: PrivyClientConfig = {
  appearance: {
    accentColor: "#6A6FF5",
    theme: "#FFFFFF",
    showWalletLoginFirst: false,
    logo: "https://i.imghippo.com/files/ISvi4233ooI.png",
    walletChainType: "ethereum-and-solana",
    walletList: [
      "detected_wallets",
      'coinbase_wallet', 
      'rainbow', 
      'wallet_connect'
    ]
  },
  defaultChain: sonicTestnet,
  supportedChains: [sonicMainnet, sonicTestnet],
  loginMethods: [
    "wallet",
    "email",
    // "google",
    // "twitter",
    // "github",
    // "linkedin",
  ],
  "fundingMethodConfig": {
    "moonpay": {
      "useSandbox": true
    }
  },
  embeddedWallets: {
    requireUserPasswordOnCreate: false,
    showWalletUIs: true,
    ethereum: {
      createOnLogin: "users-without-wallets"
    },
    solana: {
      createOnLogin: "off"
    }
  },
  "mfa": {
    "noPromptOnMfaRequired": false
  },
}; 