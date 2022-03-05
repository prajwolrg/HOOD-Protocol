// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

function BigN(n) {
    return ethers.BigNumber.from(n.toString())
}
async function main() {
  contracts = {}

  const AddressProvider = await ethers.getContractFactory("AddressProvider")

  const Config = await ethers.getContractFactory("Config")
  config = await Config.deploy()
  console.log('config', config.address);
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
  const Rewards = await ethers.getContractFactory("RewardDistribution")
  const Hood = await ethers.getContractFactory("HoodToken")

  addressProvider = await AddressProvider.deploy()
  ap = addressProvider.address
  contracts['addressProvider'] = ap
  core = await Core.deploy(ap)
  contracts['lendingPoolCore'] = core.address
  pool = await Pool.deploy(ap)
  contracts['lendingPool'] = pool.address
  data = await DataProvider.deploy(ap)
  contracts['lendingPoolDataProvider'] = data.address
  initializer = await ReserveInitializer.deploy(ap)
  contracts['initializer'] = initializer.address
  oracle = await Oracle.deploy()
  contracts['oracle'] = oracle.address
  rewards = await Rewards.deploy(ap)
  contracts['rewards'] = rewards.address
  hood = await Hood.deploy(ap)
  contracts['hoodToken'] = hood.address

  await addressProvider.setLendingPool(pool.address)
  await addressProvider.setLendingPoolCore(core.address)
  await addressProvider.setLendingPoolDataProvider(data.address)
  await addressProvider.setETHAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
  await addressProvider.setReserveInitializer(initializer.address)
  await addressProvider.setConfigLibrary(config.address)
  await addressProvider.setPriceOracle(oracle.address)
  await addressProvider.setHoodToken(hood.address)
  await addressProvider.setRewardDistribution(rewards.address)

  await core.initialize()
  await data.initialize()
  await pool.initialize()
  await initializer.initialize()

  asset1 = await Asset.deploy("United States Dollar", "USD", 18);
  asset1Addr = asset1.address;
  contracts['usd'] = asset1Addr

  asset2 = await Asset.deploy("Nepali Rupees", "NRS", 18);
  asset2Addr = asset2.address;
  contracts['nrs'] = asset2Addr

  asset3 = await Asset.deploy("Indigo", "INDG", 18);
  asset3Addr = asset3.address;
  contracts['indg'] = asset3Addr

  console.table(contracts)

  await asset1.mint('0xE0486d4AF0Fc6d030BbC7C4Ca5336592781F340b', BigN(999 * 10 ** 18))
  await asset2.mint('0xE0486d4AF0Fc6d030BbC7C4Ca5336592781F340b', BigN(999 * 10 ** 18))
  await asset3.mint('0xE0486d4AF0Fc6d030BbC7C4Ca5336592781F340b', BigN(999 * 10 ** 18))


  // initializer = ReserveInitializer.attach(contracts['initializer'])
  // asset1 = Asset.attach(contracts['usd'])
  // asset2 = Asset.attach(contracts['nrs'])
  // asset3 = Asset.attach(contracts['indg'])
  // pool = Pool.attach(contracts['lendingPool'])
  // oracle = Oracle.attach(contracts['oracle'])

  // console.log(contracts)

  // const tx = await initializer.initializeReserve(contracts['usd']);
  // console.log("reserve initialized", tx)
  // await initializer.initializeReserve(contracts['nrs']);
  // console.log("reserve initialized")
  // await initializer.initializeReserve(contracts['indg']);
  // console.log("reserve initialized")

  // [owner, wallet1, wallet2] = await ethers.getSigners();
  // ownerAddr = await owner.getAddress()
  // user1 = await wallet1.getAddress()
  // user2 = await wallet2.getAddress()

  // // set prices of assets    
  // const newtPrice = ethers.BigNumber.from(`${parseInt(5 * 10 ** 18)}`); 
  // const usdPrice = ethers.BigNumber.from(`${parseInt(1 * 10 ** 18)}`); 
  // const nrsPrice = ethers.BigNumber.from(`${parseInt((10 ** 18)/120)}`); 

  // await oracle.set_reference_data(contracts['usd'], usdPrice); // [usd][usd] = 1
  // await oracle.set_reference_data(contracts['nrs'], nrsPrice); // [nrs][usd] = 1/120
  // await oracle.set_reference_data(contracts['indg'], newtPrice); // [newt][usd] = 5


  // await asset1.approve(contracts['lendingPoolCore'], BigN(200 * 10 ** 18))
  // await asset2.approve(contracts['lendingPoolCore'], BigN(200 * 10 ** 18))
  // await asset3.approve(contracts['lendingPoolCore'], BigN(200 * 10 ** 18))

  // await pool.deposit(contracts['usd'], BigN(200 * 10 ** 18))
  // await pool.deposit(contracts['nrs'], BigN(200 * 10 ** 18))
  // await pool.deposit(contracts['indg'], BigN(200 * 10 ** 18))

  // const getNrsPrice = await oracle.get_reference_data(asset2Addr);
  // const getNewtPrice = await oracle.get_reference_data(asset3Addr);

  // expect(getNrsPrice).to.equal(nrsPrice);
  // expect(getNewtPrice).to.equal(newtPrice);

  // // make a1 the minter
  // await asset1.addMinter('0xB6c355d81bdec9592Edd221cA7d162B48b465420')
  // await asset2.addMinter(user1)
  // await asset3.addMinter(user1)

  // // // mint to user2
  // await asset1.mint("0x6195817Bf6849cC2d160664d13075Fc0D258B090", BigN(101 * 10**18))
  // await asset2.connect(wallet1).mint(user2, BigN(121 * 10**18))
  // await asset3.connect(wallet1).mint(user2, BigN(101 * 10**18))

  // // approve to core, before deposit
  // await asset1.approve('0x4283fD76deE17441Edb70a3a04a32565bFBc513D', BigN(100 * 10**18))
  // await pool.deposit(asset1.address, BigN(100 * 10 ** 18))
  // await pool.borrow(asset1.address, BigN(10 * 10 ** 18))
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
