const hre = require("hardhat");

async function main() {
  // Contract addresses
  const SWAP_CONTRACT_ADDRESS = "0x787b42FA61F11cE130C40D489A00c56a8f5d335f";
  const POCKET_TOKEN_ADDRESS = "0x7a114662911183125B1b5ce893bcA1d59151b5D5";

  // Get contract instances
  const swapContract = await hre.ethers.getContractAt(
    "PocketFiTokenSwap",
    SWAP_CONTRACT_ADDRESS
  );
  
  const pocketToken = await hre.ethers.getContractAt(
    "PocketToken",
    POCKET_TOKEN_ADDRESS
  );

  // Amount to swap (e.g., 0.1 native token)
  const nativeAmount = hre.ethers.parseEther("0.1");
  
  try {
    // Check contract balances first
    const contractBalance = await hre.ethers.provider.getBalance(SWAP_CONTRACT_ADDRESS);
    console.log(`Contract native balance: ${hre.ethers.formatEther(contractBalance)} S`);

    // Get token info to check swap rate
    const tokenInfo = await swapContract.supportedTokens(POCKET_TOKEN_ADDRESS);
    console.log(`Swap rate: ${tokenInfo.swapRate}`);

    // Calculate how much native token we'll get for our POCKET tokens
    const tokenAmount = hre.ethers.parseEther("1");
    const expectedNative = (tokenAmount * BigInt(1e18)) / BigInt(tokenInfo.swapRate);
    console.log(`For ${hre.ethers.formatEther(tokenAmount)} POCKET tokens, you need ${hre.ethers.formatEther(expectedNative)} S`);

    if (contractBalance < expectedNative) {
      throw new Error(`Contract needs at least ${hre.ethers.formatEther(expectedNative)} S, but has only ${hre.ethers.formatEther(contractBalance)} S`);
    }

    // 1. First test: Swap native (S) for POCKET tokens
    console.log("\nTesting swapNativeForToken...");
    console.log(`Swapping ${hre.ethers.formatEther(nativeAmount)} S for POCKET`);
    
    const swapNativeTx = await swapContract.swapNativeForToken(
      POCKET_TOKEN_ADDRESS,
      { value: nativeAmount }
    );
    await swapNativeTx.wait();
    console.log("Native to Token swap successful!");
    console.log("Transaction hash:", swapNativeTx.hash);

    // 2. Second test: Swap POCKET tokens for native (S)
    console.log("\nTesting swapTokenForNative...");
    
    // First approve tokens
    console.log("Approving tokens...");
    const approveTx = await pocketToken.approve(SWAP_CONTRACT_ADDRESS, tokenAmount);
    await approveTx.wait();
    console.log("Approval successful!");

    // Then swap
    console.log(`Swapping ${hre.ethers.formatEther(tokenAmount)} POCKET for S`);
    const swapTokenTx = await swapContract.swapTokenForNative(
      POCKET_TOKEN_ADDRESS,
      tokenAmount
    );
    await swapTokenTx.wait();
    console.log("Token to Native swap successful!");
    console.log("Transaction hash:", swapTokenTx.hash);

  } catch (error) {
    console.error("Error occurred:", error.message);
    // If error contains revert reason, log it
    if (error.data) {
      console.error("Revert reason:", error.data.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 