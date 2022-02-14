// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // const AddressProvider = await ethers.getContractFactory("AddressProvider")

  // const Config = await ethers.getContractFactory("Config")
  // config = await Config.deploy()
  // console.log('config', config.address);

  // const Core = await ethers.getContractFactory("LendingPoolCore", {
  //   libraries: {
  //       Config: config.address
  //   }
  // })

  const Asset = await ethers.getContractFactory("Asset")
  // const Oracle = await ethers.getContractFactory("Oracle")
  // const Pool = await ethers.getContractFactory("LendingPool")
  // const DataProvider = await ethers.getContractFactory("LendingPoolDataProvider")
  // const ReserveInitializer = await ethers.getContractFactory("ReserveInitializer")

  // addressProvider = await AddressProvider.deploy()
  // ap = addressProvider.address
  // core = await Core.deploy('0xCc34c1Ca005Ad54c268D9eA0c4488409211A68ca')
  // console.log(core.address);
  // pool = await Pool.deploy(ap)
  // data = await DataProvider.deploy(ap)
  // initializer = await ReserveInitializer.deploy(ap)
  // oracle = await Oracle.deploy()
  // console.log(ap, core.address, pool.address, data.address, initializer.address, oracle.address)

  // const addressProvider = await AddressProvider.attach('0xCc34c1Ca005Ad54c268D9eA0c4488409211A68ca');
  // const oracle = await Oracle.attach('0x0a8Ce79F46dC98E09ce73B8CdF1E6f7b89bD8777');
  // const pool = await Pool.attach('0xadC6C7cf0C8636D57F3972e3C2B3B360Bf5Af900');
  // const data = await DataProvider.attach('0xE1d217036209b4dF2735E16F93b9A08Af1934F43');
  // const initializer = await ReserveInitializer.attach('0x22d8E9A1D4ecEBB5E16C1ea669E4695138f9D8b0');
  // await addressProvider.setLendingPool('0xadC6C7cf0C8636D57F3972e3C2B3B360Bf5Af900')
  // await addressProvider.setLendingPoolCore(core.address)
  // await addressProvider.setLendingPoolDataProvider('0xE1d217036209b4dF2735E16F93b9A08Af1934F43')
  // await addressProvider.setETHAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
  // await addressProvider.setReserveInitializer('0x22d8E9A1D4ecEBB5E16C1ea669E4695138f9D8b0')
  // addressProvider.setConfigLibrary(config.address)
  // await addressProvider.setPriceOracle('0x0a8Ce79F46dC98E09ce73B8CdF1E6f7b89bD8777')

  // await core.initialize()
  // await data.initialize()
  // await pool.initialize()
  // await initializer.initialize()

  asset1 = await Asset.deploy("USD Hood", "USDH", 18);
  asset1Addr = asset1.address;

  asset2 = await Asset.deploy("NRS Hood", "NRSH", 18);
  asset2Addr = asset2.address;

  asset3 = await Asset.deploy("Newton Token", "NEWT", 18);
  asset3Addr = asset3.address;
  console.log(asset1Addr, asset2Addr, asset3Addr)

  // await initializer.initializeReserve(asset1Addr);
  // await initializer.initializeReserve(asset2Addr);
  // await initializer.initializeReserve(asset3Addr);

  // [owner, wallet1, wallet2] = await ethers.getSigners();
  // ownerAddr = await owner.getAddress()
  // user1 = await wallet1.getAddress()
  // user2 = await wallet2.getAddress()

  // // set prices of assets    
  // const newtPrice = ethers.BigNumber.from(`${parseInt(5 * 10 ** 18)}`); 
  // const usdPrice = ethers.BigNumber.from(`${parseInt(1 * 10 ** 18)}`); 
  // const nrsPrice = ethers.BigNumber.from(`${parseInt((10 ** 18)/120)}`); 

  // await oracle.set_reference_data(asset1Addr, usdPrice); // [usd][usd] = 1
  // await oracle.set_reference_data(asset2Addr, nrsPrice); // [nrs][usd] = 1/120
  // await oracle.set_reference_data(asset3Addr, newtPrice); // [newt][usd] = 5

  // const getNrsPrice = await oracle.get_reference_data(asset2Addr);
  // const getNewtPrice = await oracle.get_reference_data(asset3Addr);

  // expect(getNrsPrice).to.equal(nrsPrice);
  // expect(getNewtPrice).to.equal(newtPrice);

  // // make a1 the minter
  // await asset1.addMinter(user1)
  // await asset2.addMinter(user1)
  // await asset3.addMinter(user1)

  // // // mint to user2
  // await asset1.connect(wallet1).mint(user2, BigN(101 * 10**18))
  // await asset2.connect(wallet1).mint(user2, BigN(121 * 10**18))
  // await asset3.connect(wallet1).mint(user2, BigN(101 * 10**18))

  // // approve to core, before deposit
  // await asset1.connect(wallet2).approve(core.address, BigN(100 * 10**18))
  // await asset2.connect(wallet2).approve(core.address, BigN(121 * 10**18))
  // await asset3.connect(wallet2).approve(core.address, BigN(100 * 10**18))
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
