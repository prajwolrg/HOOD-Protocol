// const { expect } = require("chai");

// function BigN(n) {
//   return ethers.BigNumber.from(`${parseInt(n * 10 ** 18)}`)
// }

// beforeEach(async function() {
//   const AddressProvider = await ethers.getContractFactory("AddressProvider")
//   const Core = await ethers.getContractFactory("LendingPoolCore");
//   const Pool = await ethers.getContractFactory("LendingPool");
//   const Asset = await ethers.getContractFactory("Asset");
//   const Oracle = await ethers.getContractFactory("Oracle");

//   let addressProvider = await AddressProvider.deploy()
//   ap = addressProvider.address
//   core = await Core.deploy(ap)
//   pool = await Pool.deploy(ap)
//   oracle = await Oracle.deploy()
  
//   addressProvider.setLendingPool(pool.address)
//   addressProvider.setLendingPoolCore(core.address)
//   addressProvider.setPriceOracle(oracle.address)
//   addressProvider.setETHAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
  
//   await pool.deployed()
//   await core.deployed()
//   await oracle.deployed()

//   await core.initialize()
//   await pool.initialize()

//   oracle.set_reference_data("USDH","USD", BigN(1))
  
//   asset = await Asset.deploy("USD Hood", "USDH", 18);
//   reserve = asset.address;

//   await core.initializeReserve(
//       reserve ,
//       18,
//       ethers.BigNumber.from('650000000000000000'),
//       ethers.BigNumber.from('500000000000000000')
//     );
// })

// describe("Lending Pool Core", function () {
//   it("should be able to initialize a reserve", async function() {
//     expect(await core.getReserveActiveStatus(reserve)).to.equal(true);
//   })
// })

// describe("Lending Pool", function() {
//   it("should be able to accept deposit", async function () {

//     await asset.deployed();
//     await pool.deployed();
//     await core.deployed();

//     let [owner, addr1] = await ethers.getSigners();
//     ownerAddr = await owner.getAddress()
//     a1Addr = await addr1.getAddress()

//     // make a1 the minter
//     await asset.addMinter(a1Addr)
//     // a1 calls mint method
//     await asset.connect(addr1).mint(a1Addr, ethers.BigNumber.from('1000'))
//     // approve to core
//     await asset.connect(addr1).approve(core.address, ethers.BigNumber.from('1000'))
//     // deposit via lending pool
//     await pool.connect(addr1).deposit(reserve, ethers.BigNumber.from('500'))
//     // get reserve data and test conditions
//     data = await core.getReserveData(reserve)
//     expect(await data.totalLiquidity).to.equal(ethers.BigNumber.from('500'))
//     expect(await data.availableLiquidity).to.equal(ethers.BigNumber.from('500'))
//   })
// })

// describe('LendingPool', function() {
//   it('should be able to accept borrows', async function () {
//     await asset.deployed();
//     await pool.deployed();
//     await core.deployed();
//     await oracle.deployed()

//     let [owner, addr1] = await ethers.getSigners();
//     ownerAddr = await owner.getAddress()
//     a1Addr = await addr1.getAddress()
//     // make a1 the minter
//     await asset.addMinter(a1Addr)
//     // a1 calls mint method
//     await asset.connect(addr1).mint(a1Addr, ethers.BigNumber.from('100000000000000000000'))
//     await asset.connect(addr1).mint(ownerAddr, ethers.BigNumber.from('100000000000000000000'))
//     await asset.connect(addr1).approve(core.address, ethers.BigNumber.from('100000000000000000000'))
//     await asset.connect(owner).approve(core.address, ethers.BigNumber.from('100000000000000000000'))
    
//     await pool.connect(addr1).deposit(reserve, ethers.BigNumber.from('100000000000000000000'));
//     await pool.connect(addr1).borrow(reserve, ethers.BigNumber.from('20000000000000000000'));
//     await pool.connect(owner).deposit(reserve, ethers.BigNumber.from('10000000000000000000'));
//     data = await core.getReserveData(reserve)
//     expect(await asset.balanceOf(a1Addr)).to.equal(ethers.BigNumber.from('20000000000000000000'));
//     expect(await data.totalBorrows).to.equal(ethers.BigNumber.from('20000000000000000000'))
//     expect(await data.totalLiquidity).to.equal(ethers.BigNumber.from('110000000000000000000'))
//     expect(await data.availableLiquidity).to.equal(ethers.BigNumber.from('90000000000000000000'))
//   })

//   it ('borrow rate should increase on borrow increase', async function() {
//     await asset.deployed()
//     await pool.deployed()
//     await core.deployed()
//     await oracle.deployed();
//     let [owner, addr1, addr2] = await ethers.getSigners()
    
//     a1Addr = await addr1.getAddress()
//     a2Addr = await addr2.getAddress()
//     // await asset.addMinter(owner.getAddress())

//     await asset.connect(owner).mint(a1Addr, ethers.BigNumber.from('1000000000000000000000'))
//     await asset.connect(owner).mint(a2Addr, ethers.BigNumber.from('1000000000000000000000'))

//     await asset.connect(addr1).approve(core.address, ethers.BigNumber.from('1000000000000000000000'))
//     await asset.connect(addr2).approve(core.address, ethers.BigNumber.from('1000000000000000000000'))

//     await pool.connect(addr1).deposit(reserve, ethers.BigNumber.from('1000000000000000000000'))
//     await pool.connect(addr2).deposit(reserve, ethers.BigNumber.from('1000000000000000000000'))
//     await pool.connect(addr1).borrow(reserve, BigN(200))
//     dataBefore = await core.getReserveData(reserve)
//     await pool.connect(addr2).borrow(reserve, BigN(200))
//     await pool.connect(addr2).borrow(reserve, ethers.BigNumber.from('290000000000000000000'))
//     dataAfter = await core.getReserveData(reserve)

//     expect(await dataBefore.availableLiquidity).to.be.gt(await dataAfter.availableLiquidity)
//     expect(await dataBefore.borrowRate).to.be.lt(await dataAfter.borrowRate)
//     expect(await dataBefore.liquidityRate).to.be.lt(await dataAfter.liquidityRate)
//     expect(await dataBefore.totalBorrows).to.be.lt(await dataAfter.totalBorrows)
//   })
// })

// describe('HToken', function() {
//   it('should be able to withdraw deposited amount', async function () {
//     await asset.deployed();
//     await pool.deployed();
//     await core.deployed();

//     let [owner, wallet1, wallet2] = await ethers.getSigners();
//     ownerAddr = await owner.getAddress()
//     addr1 = await wallet1.getAddress()
//     addr2 = await wallet2.getAddress()
//     // // make a1 the minter
//     await asset.addMinter(a1Addr)
//     // // a1 calls mint method
//     await asset.connect(wallet1).mint(addr1, BigN(200))
//     await asset.connect(wallet1).approve(core.address, BigN(200))    
//     await pool.connect(wallet1).deposit(reserve, BigN(200))
    
//     // mint to a2
//     await asset.connect(wallet1).mint(addr2, BigN(200))
//     await asset.connect(wallet2).approve(core.address, BigN(200))    
//     await pool.connect(wallet2).deposit(reserve, BigN(200))
//     await pool.connect(wallet2).borrow(reserve, BigN(90));

//     hTokenAddress = await core.getReserveHTokenAddress(reserve);
//     const HToken = await ethers.getContractFactory('HToken');
//     const instance = await HToken.attach(hTokenAddress);
    
//     expect(await instance.balanceOf(addr1)).to.equal(BigN(200));

//     beforeReserveData = await core.getReserveData(reserve);
//     let amountToRedeem = BigN(10);
//     await instance.connect(wallet1).redeem(amountToRedeem);
//     afterReserveData = await core.getReserveData(reserve);

//     expect(beforeReserveData.liquidityRate).to.be.lt(afterReserveData.liquidityRate);
//     expect(parseInt(beforeReserveData.totalLiquidity)).to.be.equal(parseInt(afterReserveData.totalLiquidity) + parseInt(amountToRedeem));
//     expect(parseInt(beforeReserveData.availableLiquidity)).to.be.equal(parseInt(afterReserveData.availableLiquidity) + parseInt(amountToRedeem));


//     expect(await instance.balanceOf(addr1)).to.equal(BigN(190));
//     expect(await asset.balanceOf(addr1)).to.equal(amountToRedeem);
    
//     await instance.connect(wallet1).redeem(BigN(190));

//     expect(await instance.balanceOf(addr1)).to.equal(BigN(0));
//     expect(await asset.balanceOf(addr1)).to.equal(BigN(200));

//     // should not be able wto withdraw more than what they have
//     await expect(instance.connect(wallet1).redeem(BigN(200))).to.be.revertedWith('Insufficent balance to withdraw');
//   })
// })


// describe('Lending Pool', function() {
//   it('should be repay loans', async function () {
//     await asset.deployed();
//     await pool.deployed();
//     await core.deployed();

//     let [owner, wallet1, wallet2] = await ethers.getSigners()
//     ownerAddr = await owner.getAddress()
//     addr1 = await wallet1.getAddress()
//     addr2 = await wallet2.getAddress()
//     // // make a1 the minter
//     await asset.addMinter(addr1)
//     // // a1 calls mint method
//     await asset.connect(wallet1).mint(addr1, BigN(200))
//     await asset.connect(wallet1).approve(core.address, BigN(200))    
//     await pool.connect(wallet1).deposit(reserve, BigN(200))
    
//     // mint to a2
//     await asset.connect(wallet1).mint(addr2, BigN(200))
//     await asset.connect(wallet2).approve(core.address, BigN(200))    
//     await pool.connect(wallet2).deposit(reserve, BigN(200))
    
//     await pool.connect(wallet2).borrow(reserve, BigN(100))

    
//     beforeData = await core.getUserReserveData(reserve, addr2)
    
//     await asset.connect(wallet2).approve(core.address, BigN(100))
//     await pool.connect(wallet2).repay(reserve, BigN(100));

//     afterData = await core.getUserReserveData(reserve, addr2)

//     expect(parseInt(beforeData.principalBorrowBalance)).to.be.lt(parseInt(afterData.principalBorrowBalance) + parseInt(BigN(100)))
//     expect(parseInt(beforeData.currentBorrowBalance)).to.be.lt(parseInt(afterData.currentBorrowBalance) + parseInt(BigN(100)))
//     // expect(parseInt(beforeData.liquidityRate)).to.be.lt(parseInt(afterData.liquidityRate))
//     expect(parseInt(beforeData.borrowRate)).to.be.gt(parseInt(afterData.borrowRate))

//   })
// })
