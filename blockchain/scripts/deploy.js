const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with address:", deployer.address);

  const AuraCredit = await ethers.getContractFactory("AuraCredit");
  const contract = await AuraCredit.deploy();
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("AuraCredit deployed to:", addr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

