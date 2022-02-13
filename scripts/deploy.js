// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // const AddressProvider = await hre.ethers.getContractFactory("AddressProvider");
  const Config = await hre.ethers.getContractFactory("Config");

  // const addressProvider = await AddressProvider.deploy();
  // await addressProvider.deployed();
  const config = await Config.deploy();
  await config.deployed();
  // const core = await LendingPoolCore.deploy('0xA1e7eb70B321Fe900c9290d557f964BA0C10aa0d');
  // await core.deployed();

  // console.log("AddressProvider deployed to:", addressProvider.address);
  console.log("Core deployed to:", config.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
