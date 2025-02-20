# `@ai16z/plugin-sonic`

This plugin enables interaction with the Sonic blockchain ecosystem, providing support for financial analysis and onchain actions on the Sonic network.

---

## Configuration

### Default Setup

By default, **plugin-sonic** is not enabled. To use it, simply add your private key and/or public key to the `.env` file. If private key is not provided, some actions will be disabled.

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

The plugin contains tests. Whether you're using **TDD** or not, please make sure to run the tests before submitting a PR.

### Running Tests

Navigate to the `plugin-sonic` directory and run:

```bash
yarn test
```
