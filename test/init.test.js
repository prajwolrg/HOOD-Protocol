// const { expect } = require("chai")

// beforeEach(async function() {
//   const AddressProvider = await ethers.getContractFactory("AddressProvider")
//   const Core = await ethers.getContractFactory("LendingPoolCore")
//   const Pool = await ethers.getContractFactory("LendingPool")

//   addressProvider = await AddressProvider.deploy()
//   ap = addressProvider.address
//   core = await Core.deploy(ap)
//   pool = await Pool.deploy(ap)

//   addressProvider.setLendingPool(pool.address)
//   addressProvider.setLendingPoolCore(core.address)
//   addressProvider.setETHAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')

//   await core.initialize()
//   await pool.initialize()
// })


// describe("Address Provider", function () {
//   it("Initialize Address Provider", function () {
//     console.log("Address Provider Initialized!!")
//   })
// })