const hre = require("hardhat");

async function main() {
  // Contract addresses
  const SWAP_CONTRACT_ADDRESS = "0x787b42FA61F11cE130C40D489A00c56a8f5d335f";
  const POCKET_TOKEN_ADDRESS = "0xAF93888cbD250300470A1618206e036E11470149";

  // New rate: 1 S = 1000 POCKET (with 18 decimals)
  const NEW_RATE = "2000000000000000000"; // 1000 * 1e18

  // Get the swap contract instance
  const swapContract = await hre.ethers.getContractAt(
    "PocketFiTokenSwap",
    SWAP_CONTRACT_ADDRESS
  );

  try {
    // Get current rate first
    const tokenInfo = await swapContract.supportedTokens(POCKET_TOKEN_ADDRESS);
    console.log(`Current swap rate: ${tokenInfo.swapRate}`);

    // Set new rate
    console.log(`Setting new rate to: ${NEW_RATE}`);
    const tx = await swapContract.setSwapRate(POCKET_TOKEN_ADDRESS, NEW_RATE);
    await tx.wait();
    console.log("Transaction hash:", tx.hash);

    // Verify new rate
    const newTokenInfo = await swapContract.supportedTokens(POCKET_TOKEN_ADDRESS);
    console.log(`New swap rate set successfully: ${newTokenInfo.swapRate}`);

  } catch (error) {
    console.error("Error occurred:", error.message);
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