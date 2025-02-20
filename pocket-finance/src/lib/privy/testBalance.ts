import { createPublicClient, http, formatEther, formatUnits, erc20Abi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonicTestnet } from './wallet.js';

async function testGetBalance() {
    // Replace with your private key
    const PRIVATE_KEY = '0x2482d4d9b31afc8c144b21fae77497d3a75455adb00eee4a48b70258c1c42059';
    
    // Test token address - replace with actual token
    const TEST_TOKEN = '0x7a114662911183125B1b5ce893bcA1d59151b5D5';
    
    // Create account from private key
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    console.log('\nInitialized wallet:');
    console.log('Address:', account.address);
    console.log('Chain:', sonicTestnet.name);

    // Initialize public client
    const publicClient = createPublicClient({
        chain: sonicTestnet,
        transport: http(sonicTestnet.rpcUrls.default.http[0])
    });

    try {
        // 1. Test native balance
        console.log('\n1. Testing native balance...');
        const nativeBalance = await publicClient.getBalance({
            address: account.address as `0x${string}`,
        });
        console.log('Native Balance:', formatEther(nativeBalance), sonicTestnet.nativeCurrency.symbol);

        // 2. Test token balance
        console.log('\n2. Testing token balance...');
        try {
            const [tokenBalance, decimals, symbol, name] = await Promise.all([
                publicClient.readContract({
                    address: TEST_TOKEN as `0x${string}`,
                    abi: erc20Abi,
                    functionName: 'balanceOf',
                    args: [account.address],
                }),
                publicClient.readContract({
                    address: TEST_TOKEN as `0x${string}`,
                    abi: erc20Abi,
                    functionName: 'decimals',
                }),
                publicClient.readContract({
                    address: TEST_TOKEN as `0x${string}`,
                    abi: erc20Abi,
                    functionName: 'symbol',
                }),
                publicClient.readContract({
                    address: TEST_TOKEN as `0x${string}`,
                    abi: erc20Abi,
                    functionName: 'name',
                })
            ]);
            console.log('Token Name:', name);
            console.log('Token Symbol:', symbol);
            console.log('Token Balance:', formatUnits(tokenBalance, decimals), symbol);
        } catch (error: any) {
            console.log('Token balance check failed:', error.message);
        }

        // 3. Test full wallet info
        console.log('\n3. Testing full wallet info...');
        const walletInfo = [
            `Wallet Address: ${account.address}`,
            `Chain: ${sonicTestnet.name}`,
            `Native Balance: ${formatEther(nativeBalance)} ${sonicTestnet.nativeCurrency.symbol}`,
        ].join('\n');
        console.log(walletInfo);

    } catch (error: any) {
        console.error('\nError:', {
            message: error.message,
            details: error.details,
            code: error.code,
        });
    }
}

async function main() {
    console.log('=== Testing Balance Checks ===');
    try {
        await testGetBalance();
    } catch (error) {
        console.error('Test failed:', error);
    }
}

main().catch(console.error);