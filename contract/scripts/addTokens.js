const hre = require("hardhat");

async function main() {
  // Contract addresses
  const SWAP_CONTRACT_ADDRESS = "0x787b42FA61F11cE130C40D489A00c56a8f5d335f";
  
  // Token addresses and rates
  const tokens = [
    {
      address: "0x7a114662911183125B1b5ce893bcA1d59151b5D5",
      rate: 1000  // 1 native = 1000 tokens
    },
    {
      address: "0x30BF3761147Ef0c86E2f84c3784FBD89E7954670",
      rate: 2  // 1 native = 2 tokens
    },
    {
      address: "0xAF93888cbD250300470A1618206e036E11470149",
      rate: 2   // 1 native = 2 tokens
    }
  ];

  // Get the swap contract instance
  const swapContract = await hre.ethers.getContractAt(
    "PocketFiTokenSwap",
    SWAP_CONTRACT_ADDRESS
  );

  // Add each token
  for (const token of tokens) {
    console.log(`Adding token ${token.address} with rate ${token.rate}...`);
    const tx = await swapContract.addToken(token.address, token.rate);
    await tx.wait();
    console.log("Transaction hash:", tx.hash);
  }
  
  console.log("All tokens added successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 