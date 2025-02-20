const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("PocketFiDeployment", (m) => {
  // Deploy PocketToken first
  const pocketToken = m.contract("PocketToken", [
    "Pocket Token",           // name
    "POCKET",                 // symbol
    18,                      // decimals
    "1000000000000000000000000", // initial supply (1 million tokens with 18 decimals)
    "10000000000000000000000000", // max supply (10 million tokens with 18 decimals)
    "0x03E15BD74ee8AdBef0C58584fc6d2b859Cd053E6"    // initialOwner
  ]);

  // Deploy PocketFiStaking
  const pocketFiStaking = m.contract("PocketFiStaking", []);

  // Deploy PocketFiTokenSwap
  const pocketFiTokenSwap = m.contract("PocketFiTokenSwap", [
    "0x03E15BD74ee8AdBef0C58584fc6d2b859Cd053E6"    // initialOwner
  ]);

  // After deployment, you'll need to:
  // 1. Add POCKET token to the swap contract
  // 2. Fund the swap contract with tokens and native currency
  // 3. Set up any initial staking parameters

  return {
    pocketToken,
    pocketFiStaking,
    pocketFiTokenSwap,
  };
}); 


// PocketFiDeployment

// PocketFiStaking - 0x404Bf459100f97644d1Fd1dc591eE4A8BC8B5F65
// PocketFiTokenSwap - 0x787b42FA61F11cE130C40D489A00c56a8f5d335f
// PocketToken - 0x7a114662911183125B1b5ce893bcA1d59151b5D5