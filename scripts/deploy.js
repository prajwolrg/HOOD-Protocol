// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const path = require("path");

const ORACLE_ADDRESS = "0x8c064bcf7c0da3b3b090babfe8f3323534d84d68"

function BigN(n) {
    return ethers.BigNumber.from(n.toString())
}
async function main() {

  // get deployer account
  const [deployer] = await ethers.getSigners();

  contracts = {}

  const AddressProvider = await ethers.getContractFactory("AddressProvider")

  const Config = await ethers.getContractFactory("Config")
  config = await Config.deploy()
  contracts['config'] = config.address

  const Core = await ethers.getContractFactory("LendingPoolCore", {
    libraries: {
        Config: contracts['config']
    }
  })

  const Asset = await ethers.getContractFactory("Asset")
  const Oracle = await ethers.getContractFactory("Oracle")
  const Pool = await ethers.getContractFactory("LendingPool")
  const DataProvider = await ethers.getContractFactory("LendingPoolDataProvider")
  const ReserveInitializer = await ethers.getContractFactory("ReserveInitializer")

  addressProvider = await AddressProvider.deploy()
  ap = addressProvider.address
  contracts['addressProvider'] = ap
  core = await Core.deploy(ap)
  contracts['lendingPoolCore'] = core.address
  pool = await Pool.deploy(ap)
  contracts['lendingPool'] = pool.address
  data = await DataProvider.deploy(ap)
  contracts['dataProvider'] = data.address
  initializer = await ReserveInitializer.deploy(ap)
  contracts['initializer'] = initializer.address

  oracle = await Oracle.deploy(ORACLE_ADDRESS)
  contracts['oracle'] = oracle.address

  await addressProvider.setLendingPool(pool.address)
  await addressProvider.setLendingPoolCore(core.address)
  await addressProvider.setLendingPoolDataProvider(data.address)
  await addressProvider.setETHAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
  await addressProvider.setReserveInitializer(initializer.address)
  await addressProvider.setConfigLibrary(config.address)
  await addressProvider.setPriceOracle(oracle.address)

  await core.initialize()
  await data.initialize()
  await pool.initialize()
  await initializer.initialize()

  asset1 = await Asset.deploy("Bitcoin", "BTC", 18);
  asset1Addr = asset1.address;
  contracts['btc'] = asset1Addr

  asset2 = await Asset.deploy("Ethereum", "ETH", 18);
  asset2Addr = asset2.address;
  contracts['eth'] = asset2Addr

  asset3 = await Asset.deploy("United States Dollar", "USD", 18);
  asset3Addr = asset3.address;
  contracts['usd'] = asset3Addr

  console.table(contracts)

  let deployerAddr = deployer.address;
  console.log(deployerAddr)
  await asset1.mint(deployerAddr, BigN(999 * 10 ** 18))
  await asset2.mint(deployerAddr, BigN(999 * 10 ** 18))
  await asset3.mint(deployerAddr, BigN(999 * 10 ** 18))

  console.log('minting done!')

  await initializer.initializeReserve(contracts['btc']);
  await initializer.initializeReserve(contracts['eth']);
  await initializer.initializeReserve(contracts['usd']);
  console.log("reserve initialized")
  
  // // // set prices of assets    
  // const newtPrice = ethers.BigNumber.from(`${parseInt(5 * 10 ** 18)}`); 
  // const usdPrice = ethers.BigNumber.from(`${parseInt(1 * 10 ** 18)}`); 
  // const balnPrice = ethers.BigNumber.from(`${parseInt((10 ** 18)/120)}`); 

  // await oracle.set_reference_data(contracts['usd'], usdPrice); // [usd][usd] = 1
  // await oracle.set_reference_data(contracts['baln'], balnPrice); // [baln][usd] = 1/120
  // await oracle.set_reference_data(contracts['omm'], newtPrice); // [newt][usd] = 5


  tx = await asset1.approve(contracts['lendingPoolCore'], BigN(200 * 10 ** 18))
  await tx.wait()
  tx = await asset2.approve(contracts['lendingPoolCore'], BigN(200 * 10 ** 18))
  await tx.wait()
  tx = await asset3.approve(contracts['lendingPoolCore'], BigN(200 * 10 ** 18))
  await tx.wait()
  console.log('approvals done!')

  tx = await pool.deposit(contracts['btc'], BigN(200 * 10 ** 18))
  await tx.wait()
  tx = await pool.deposit(contracts['eth'], BigN(200 * 10 ** 18))
  await tx.wait()
  tx = await pool.deposit(contracts['usd'], BigN(200 * 10 ** 18))
  await tx.wait()
  console.log('Deposits done')

  saveContractAdresses(contracts)
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
