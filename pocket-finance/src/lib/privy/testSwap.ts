import { createPublicClient, http, formatEther, parseEther, createWalletClient, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonicTestnet } from './wallet.js';
import { PocketFiSwapAbi } from './abi.js';
import { erc20Abi } from 'viem';

async function main() {
    const PRIVATE_KEY = '0x2482d4d9b31afc8c144b21fae77497d3a75455adb00eee4a48b70258c1c42059';
    const SWAP_CONTRACT = '0x787b42FA61F11cE130C40D489A00c56a8f5d335f';
    const POCKET_TOKEN = '0x7a114662911183125B1b5ce893bcA1d59151b5D5';
    const DIAMOND_TOKEN = '0x30BF3761147Ef0c86E2f84c3784FBD89E7954670';
    const CORAL_TOKEN = '0xAF93888cbD250300470A1618206e036E11470149';

    const AMOUNT_TO_SWAP = '0.1'; // Amount in S

    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    console.log('Wallet address:', account.address);
    console.log('Swap contract:', SWAP_CONTRACT);
    console.log('POCKET token:', POCKET_TOKEN);

    const publicClient = createPublicClient({
        chain: sonicTestnet,
        transport: http(sonicTestnet.rpcUrls.default.http[0])
    });

    const walletClient = createWalletClient({
        account,
        chain: sonicTestnet,
        transport: http(sonicTestnet.rpcUrls.default.http[0])
    });

    try {
        // 1. Initial balance check
        console.log('\n1. Checking initial balances...');
        const [nativeBalance, tokenBalance, contractBalance, contractTokenBalance] = await Promise.all([
            publicClient.getBalance({ address: account.address }),
            publicClient.readContract({
                address: POCKET_TOKEN,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [account.address],
            }),
            publicClient.getBalance({ address: SWAP_CONTRACT }),
            publicClient.readContract({
                address: POCKET_TOKEN,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [SWAP_CONTRACT],
            })
        ]);

        console.log('Native balance:', formatEther(nativeBalance), 'S');
        console.log('POCKET balance:', formatEther(tokenBalance), 'POCKET');
        console.log('Contract native balance:', formatEther(contractBalance), 'S');
        console.log('Contract POCKET balance:', formatEther(contractTokenBalance), 'POCKET');

        // 2. Get swap rate and calculate expected amounts
        console.log('\n2. Getting swap rate...');
        const [_, swapRate] = await publicClient.readContract({
            address: SWAP_CONTRACT,
            abi: PocketFiSwapAbi,
            functionName: 'supportedTokens',
            args: [POCKET_TOKEN],
        });
        
        // Convert swap rate to readable format (e.g., 1 S = X POCKET)
        const oneNativeInTokens = (BigInt(1e18) * BigInt(1e18)) / swapRate;
        console.log('Swap rate: 1 S =', formatEther(oneNativeInTokens), 'POCKET');

        // Calculate amounts for both swap directions
        const nativeAmount = parseEther(AMOUNT_TO_SWAP);
        const expectedTokens = (nativeAmount * BigInt(1e18)) / swapRate;
        console.log(`Swapping ${AMOUNT_TO_SWAP} S will get you approximately ${formatEther(expectedTokens)} POCKET`);

        const tokenAmount = parseEther('2000');
        const expectedNative = (tokenAmount * BigInt(1e18)) / swapRate;
        console.log(`Swapping 1 POCKET will get you approximately ${formatEther(expectedNative)} S`);

        if (contractBalance < expectedNative) {
            throw new Error(`Contract needs at least ${formatEther(expectedNative)} S, but has only ${formatEther(contractBalance)} S`);
        }

        // 3. Swap native for POCKET
        console.log('\n3. Swapping native for POCKET...');
        const swapNativeHash = await walletClient.sendTransaction({
            account,
            chain: sonicTestnet,
            to: SWAP_CONTRACT,
            data: encodeFunctionData({
                abi: PocketFiSwapAbi,
                functionName: 'swapNativeForToken',
                args: [POCKET_TOKEN]
            }),
            value: nativeAmount
        });
        console.log('Swap native transaction:', swapNativeHash);
        await publicClient.waitForTransactionReceipt({ hash: swapNativeHash });

        // 4. Check balances after first swap
        console.log('\n4. Checking balances after native swap...');
        const [nativeAfter1, tokenAfter1] = await Promise.all([
            publicClient.getBalance({ address: account.address }),
            publicClient.readContract({
                address: POCKET_TOKEN,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [account.address],
            })
        ]);
        console.log('Native balance:', formatEther(nativeAfter1), 'S');
        console.log('POCKET balance:', formatEther(tokenAfter1), 'POCKET');

        // 5. Approve tokens for swap
        console.log('\n5. Approving POCKET tokens...');
        const approveHash = await walletClient.writeContract({
            address: POCKET_TOKEN,
            abi: erc20Abi,
            functionName: 'approve',
            args: [SWAP_CONTRACT, tokenAmount]
        });
        console.log('Approve transaction:', approveHash);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // 6. Swap POCKET for native
        console.log('\n6. Swapping POCKET for native...');
        const swapTokenHash = await walletClient.writeContract({
            address: SWAP_CONTRACT,
            abi: PocketFiSwapAbi,
            functionName: 'swapTokenForNative',
            args: [POCKET_TOKEN, tokenAmount]
        });
        console.log('Swap token transaction:', swapTokenHash);
        await publicClient.waitForTransactionReceipt({ hash: swapTokenHash });

        // 7. Final balance check
        console.log('\n7. Checking final balances...');
        const [nativeFinal, tokenFinal] = await Promise.all([
            publicClient.getBalance({ address: account.address }),
            publicClient.readContract({
                address: POCKET_TOKEN,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [account.address],
            })
        ]);
        console.log('Final native balance:', formatEther(nativeFinal), 'S');
        console.log('Final POCKET balance:', formatEther(tokenFinal), 'POCKET');

    } catch (error: any) {
        console.error('Error:', {
            message: error.message,
            details: error.details,
        });
    }
}

main().catch(console.error);
