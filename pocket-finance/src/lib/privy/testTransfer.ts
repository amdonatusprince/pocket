import { createPublicClient, http, formatEther, parseEther, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonicTestnet } from './wallet.js';

async function main() {
    // Replace with your private key
    const PRIVATE_KEY = '0x2482d4d9b31afc8c144b21fae77497d3a75455adb00eee4a48b70258c1c42059';

    const RECIPIENT = '0x85CA836d014dA00537FdC04dFe8b07aeDc20FB69';
    const AMOUNT = '5'; // Amount in native token (S)

    // Create account from private key
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    console.log('Sender address:', account.address);
    console.log('Recipient address:', RECIPIENT);

    // Initialize clients
    const publicClient = createPublicClient({
        chain: sonicTestnet,
        transport: http(sonicTestnet.rpcUrls.default.http[0])
    });

    const walletClient = createWalletClient({
        chain: sonicTestnet,
        transport: http(sonicTestnet.rpcUrls.default.http[0])
    });

    try {
        // Check balance before transfer
        console.log('\nChecking balance before transfer...');
        const balanceBefore = await publicClient.getBalance({
            address: account.address,
        });
        console.log('Balance before:', formatEther(balanceBefore), 'S');

        // Prepare transfer
        console.log('\nPreparing transfer...');
        const value = parseEther(AMOUNT);
        
        // Send transaction
        console.log('Sending transaction...');
        const hash = await walletClient.sendTransaction({
            account,
            to: RECIPIENT as `0x${string}`,
            value,
        });
        console.log('Transaction hash:', hash);

        // Wait for transaction
        console.log('Waiting for transaction confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Transaction confirmed in block:', receipt.blockNumber);

        // Check balance after transfer
        console.log('\nChecking balance after transfer...');
        const balanceAfter = await publicClient.getBalance({
            address: account.address,
        });
        console.log('Balance after:', formatEther(balanceAfter), 'S');

        // Calculate difference
        const difference = balanceBefore - balanceAfter;
        console.log('Total spent (including gas):', formatEther(difference), 'S');

    } catch (error: any) {
        console.error('Error:', {
            message: error.message,
            details: error.details,
        });
    }
}

main().catch(console.error);