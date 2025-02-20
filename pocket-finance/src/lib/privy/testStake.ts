import { createPublicClient, http, formatEther, parseEther, createWalletClient, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonicTestnet } from './wallet.js';
import { PocketFiStakingAbi } from './abi.js';

async function main() {
    const PRIVATE_KEY = '0x2482d4d9b31afc8c144b21fae77497d3a75455adb00eee4a48b70258c1c42059';
    const STAKING_CONTRACT = '0x404Bf459100f97644d1Fd1dc591eE4A8BC8B5F65';
    const AMOUNT = '1'; // Amount to stake in S

    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
    console.log('Staker address:', account.address);
    console.log('Staking contract:', STAKING_CONTRACT);

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
        // 1. Get initial info
        console.log('\n1. Getting initial info...');
        const [nativeBalance, stakeInfo, apr] = await Promise.all([
            publicClient.getBalance({ address: account.address }),
            publicClient.readContract({
                address: STAKING_CONTRACT,
                abi: PocketFiStakingAbi,
                functionName: 'getUserStakeInfo',
                args: [account.address],
            }),
            publicClient.readContract({
                address: STAKING_CONTRACT,
                abi: PocketFiStakingAbi,
                functionName: 'getAPR'
            })
        ]);

        console.log('Native balance:', formatEther(nativeBalance), 'S');
        console.log('Staked amount:', formatEther(stakeInfo[0]), 'sPOCKET');
        console.log('Pending rewards:', formatEther(stakeInfo[1]), 'S');
        console.log('APR:', Number(apr) / 100, '%');

        // 2. Stake tokens
        console.log('\n2. Staking tokens...');
        const value = parseEther(AMOUNT);
        const stakeHash = await walletClient.sendTransaction({
            account,
            chain: sonicTestnet,
            to: STAKING_CONTRACT,
            data: encodeFunctionData({
                abi: PocketFiStakingAbi,
                functionName: 'stake',
                args: [value]
            }),
            value
        });
        console.log('Stake transaction:', stakeHash);
        await publicClient.waitForTransactionReceipt({ hash: stakeHash });

        // 3. Check balances after staking
        console.log('\n3. Checking balances after staking...');
        const afterStakeInfo = await publicClient.readContract({
            address: STAKING_CONTRACT,
            abi: PocketFiStakingAbi,
            functionName: 'getUserStakeInfo',
            args: [account.address],
        });
        console.log('Staked amount:', formatEther(afterStakeInfo[0]), 'sPOCKET');

        // 4. Check earned rewards
        console.log('\n4. Checking earned rewards...');
        const earned = await publicClient.readContract({
            address: STAKING_CONTRACT,
            abi: PocketFiStakingAbi,
            functionName: 'earned',
            args: [account.address],
        });
        console.log('Earned rewards:', formatEther(earned), 'S');

        // 5. Claim rewards if available
        if (earned > BigInt(0)) {
            console.log('\n5. Claiming rewards...');
            const claimHash = await walletClient.sendTransaction({
                account,
                chain: sonicTestnet,
                to: STAKING_CONTRACT,
                data: encodeFunctionData({
                    abi: PocketFiStakingAbi,
                    functionName: 'claimReward'
                })
            });
            console.log('Claim transaction:', claimHash);
            await publicClient.waitForTransactionReceipt({ hash: claimHash });
        }

        // 6. Withdraw half of staked amount
        console.log('\n6. Withdrawing half of staked amount...');
        const withdrawAmount = value / BigInt(2);
        const withdrawHash = await walletClient.sendTransaction({
            account,
            chain: sonicTestnet,
            to: STAKING_CONTRACT,
            data: encodeFunctionData({
                abi: PocketFiStakingAbi,
                functionName: 'withdraw',
                args: [withdrawAmount]
            })
        });
        console.log('Withdraw transaction:', withdrawHash);
        await publicClient.waitForTransactionReceipt({ hash: withdrawHash });

        // 7. Final balance check
        console.log('\n7. Final balance check...');
        const finalInfo = await publicClient.readContract({
            address: STAKING_CONTRACT,
            abi: PocketFiStakingAbi,
            functionName: 'getUserStakeInfo',
            args: [account.address],
        });
        console.log('Final staked amount:', formatEther(finalInfo[0]), 'sPOCKET');
        console.log('Final pending rewards:', formatEther(finalInfo[1]), 'S');

    } catch (error: any) {
        console.error('Error:', {
            message: error.message,
            details: error.details,
        });
    }
}

main().catch(console.error);