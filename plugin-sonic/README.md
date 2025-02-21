# `@pocketfinance/sonic-plugin`

An open-source plugin built on top of the Eliza Agent Framework that enables interaction with the Pocket Finance ecosystem. This plugin provides support for transfers, payments, swaps, staking, bridging, and financial analysis on the Sonic network.

## Mission

PocketFi Plugin aims to make DeFi accessible to everyone by leveraging AI to simplify onchain interactions on the Sonic blockchain. Our goal is to:
- Make crypto mainstream through intuitive AI interactions
- Simplify DeFi operations for everyday users
- Enhance onchain UX through natural language processing
- Bridge the gap between traditional finance users and Web3

## For Protocol Developers

This plugin is designed to be extensible, allowing any protocol to integrate with the Sonic ecosystem through the Eliza Agent Framework. By using our templates and action patterns, you can:

- Add your protocol's integration
- Enable AI-powered interactions with your project
- Let users interact with your protocol through natural language
- Leverage existing Eliza templates for quick implementation

### Integration Steps

1. Fork this repository
2. Add your protocol integration using the Eliza agent templates
3. Follow our existing patterns for actions (see examples in src/actions)
4. Submit a Pull Request
5. We'll review and help get your protocol integrated!

Example integration structure:
```typescript
// src/actions/your-protocol.ts
export class YourProtocolAction {
    // Implementation following Eliza patterns
}

export const yourProtocolAction: Action = {
    name: "your-protocol",
    description: "Interact with YourProtocol on Sonic network",
    // ... other required fields
};
```

---

## Configuration

### Default Setup

By default, **pocketfi-plugin** is not enabled. To use it, simply add your private key and/or public key to the `.env` file. If private key is not provided, some actions will be disabled.

**Security Note:** Your private key grants full access to your associated funds. Store it securely and never share it with anyone. Do not commit or upload your `.env` file to version control systems like Git.

```env
SONIC_PRIVATE_KEY=your-private-key-here
SONIC_PUBLIC_KEY=your-public-key-here
PERPLEXITY_API_KEY=your-api-key-here
```

### Custom RPC URLs

By default, the RPC URL is inferred from the `viem/chains` config. To use custom RPC URLs, add the following to your `.env` file:

```env
SONIC_PROVIDER_URL=https://your-custom-sonic-rpc-url
```

## Provider

The **Wallet Provider** initializes with Sonic as the default. It:

- Provides the **context** of the currently connected address and its balance.
- Creates **Public** and **Wallet clients** to interact with the Sonic network.

---

## Actions

### Get Financial Info

Get professional financial analysis and advice using the Perplexity AI model. Just specify your query about:

- Market analysis
- Token performance
- Investment strategies
- DeFi concepts
- Financial terms

**Example usage:**

```bash
What's the current market sentiment for Bitcoin?
```

### Get Balance

Get the balance of an address on Sonic. Just specify the:

- **Address**
- **Token**

**Example usage:**

```bash
Get the USDC balance of 0x1234567890 on Sonic.
```

### Transfer

Transfer tokens from one address to another on Sonic. Just specify the:

- **Token**
- **Amount**
- **Recipient Address**
- **Data**(Optional)

**Example usage:**

```bash
Transfer 100 S token to 0xRecipient.
```

### Deploy Token

Deploy new token contracts on Sonic. Supports ERC20, ERC721, and ERC1155. Just specify the:

- **Contract Type**
- **Name**
- **Symbol**
- **Supply/URI** (as appropriate)

**Example usage:**

```bash
Deploy an ERC20 token with name 'MyToken', symbol 'MTK', decimals 18, total supply 10000.
```

### Bridge

Bridge tokens between networks. Just specify the:

- **From Chain**
- **To Chain**
- **From Token**
- **To Token**
- **Amount**
- **Recipient Address**(Optional)

**Example usage:**

```bash
Bridge 1 SONIC from Ethereum to Sonic network.
```

### Faucet

Request testnet tokens from the faucet. You could request any of the supported tokens. Just specify the:

- **Token**(Optional)
- **Recipient Address**

The faucet is rate-limited. One claim is allowed per IP address within a 24-hour period.

**Example usage:**

```bash
Get some testnet USDC from the faucet.
```

---

## Contribution

This is an open-source project and we welcome contributions! Whether you're:
- Adding new protocol integrations
- Improving existing features
- Fixing bugs
- Enhancing documentation

The plugin contains tests. Whether you're using **TDD** or not, please make sure to run the tests before submitting a PR.

### Running Tests

Navigate to the `pocketfi-plugin` directory and run:

```bash
yarn test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Built With Eliza

This plugin is proudly built on top of the Eliza Agent Framework, enabling AI-powered interactions with the Sonic blockchain ecosystem. Special thanks to the Eliza team for making this possible.
