// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const path = require("path");
const fs = require("fs")

const contractAddresses = JSON.parse(fs.readFileSync("./frontend/src/consts/contractAddresses.json"))
console.log(contractAddresses)

function BigN(n) {
    return ethers.BigNumber.from(n.toString())
}

async function main() {

  // get deployer account
  const [deployer] = await ethers.getSigners();

  const AddressProvider = await ethers.getContractFactory("AddressProvider")

  const Config = await ethers.getContractFactory("Config")
  config = await Config.attach(contractAddresses['config'])

  const Core = await ethers.getContractFactory("LendingPoolCore", {
    libraries: {
        Config: contractAddresses['config']
    }
  })

  const Asset = await ethers.getContractFactory("Asset")
  const Oracle = await ethers.getContractFactory("Oracle")
  const Pool = await ethers.getContractFactory("LendingPool")
  const DataProvider = await ethers.getContractFactory("LendingPoolDataProvider")
  const ReserveInitializer = await ethers.getContractFactory("ReserveInitializer")

  addressProvider = await AddressProvider.attach(contractAddresses['addressProvider'])
  core = await Core.attach(contractAddresses['lendingPoolCore'])
  pool = await Pool.attach(contractAddresses['lendingPool'])
  data = await DataProvider.attach(contractAddresses['dataProvider'])
  initializer = await ReserveInitializer.attach(contractAddresses['initializer'])
  oracle = await Oracle.attach(contractAddresses['oracle'])

  newAsset = await Asset.attach(contractAddresses['icx']);
  assetAddr = newAsset.address;

  console.table(contractAddresses)

  // let deployerAddr = deployer.address;
  // console.log(deployerAddr)
  // const tx = await newAsset.mint(deployerAddr, BigN(999 * 10 ** 18))
	// console.log(tx)
  // console.log('minting done!')

  // await initializer.initializeReserve(contractAddresses['icx']);
  // console.log("reserve initialized")
  
  tx = await newAsset.approve(contractAddresses['lendingPoolCore'], BigN(200 * 10 ** 18))
  await tx.wait()
  console.log('approvals done!')

  tx = await pool.deposit(contractAddresses['icx'], BigN(200 * 10 ** 18))
  await tx.wait()
  console.log('Deposits done')

  saveContractAdresses(contractAddresses)
  console.log("setup complete")

}

function saveContractAdresses(contractAddresses) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "consts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contractAddresses.json"),
    JSON.stringify(contractAddresses, undefined, 2)
  );
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
