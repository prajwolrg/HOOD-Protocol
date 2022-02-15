const { expect } = require("chai")

function BigN(n) {
    return ethers.BigNumber.from(n.toString())
}

beforeEach(async function () {
    const AddressProvider = await ethers.getContractFactory("AddressProvider")

    const Config = await ethers.getContractFactory("Config")
    config = await Config.deploy()

    const Core = await ethers.getContractFactory("LendingPoolCore", {
    	libraries: {
        	Config: config.address
    	}
    })

    const Asset = await ethers.getContractFactory("Asset")
    const Oracle = await ethers.getContractFactory("Oracle")
    const Pool = await ethers.getContractFactory("LendingPool")
    const DataProvider = await ethers.getContractFactory("LendingPoolDataProvider")
    const ReserveInitializer = await ethers.getContractFactory("ReserveInitializer")

    addressProvider = await AddressProvider.deploy()
    ap = addressProvider.address
    core = await Core.deploy(ap)
    pool = await Pool.deploy(ap)
    data = await DataProvider.deploy(ap)
    initializer = await ReserveInitializer.deploy(ap)
    oracle = await Oracle.deploy()

    addressProvider.setLendingPool(pool.address)
    addressProvider.setLendingPoolCore(core.address)
    addressProvider.setLendingPoolDataProvider(data.address)
    addressProvider.setETHAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
    addressProvider.setReserveInitializer(initializer.address)
    addressProvider.setConfigLibrary(config.address)
    addressProvider.setPriceOracle(oracle.address)

    await core.initialize()
    await data.initialize()
    await pool.initialize()
    await initializer.initialize()

    asset1 = await Asset.deploy("USD Hood", "USDH", 18);
    asset1Addr = asset1.address;

    asset2 = await Asset.deploy("NRS Hood", "NRSH", 18);
    asset2Addr = asset2.address;

    asset3 = await Asset.deploy("Newton Token", "NEWT", 18);
    asset3Addr = asset3.address;

    await initializer.initializeReserve(asset1Addr);
    await initializer.initializeReserve(asset2Addr);
    await initializer.initializeReserve(asset3Addr);

    [owner, wallet1, wallet2] = await ethers.getSigners();
    ownerAddr = await owner.getAddress()
    user1 = await wallet1.getAddress()
    user2 = await wallet2.getAddress()

    // set prices of assets    
    const newtPrice = ethers.BigNumber.from(`${parseInt(5 * 10 ** 18)}`); 
    const usdPrice = ethers.BigNumber.from(`${parseInt(1 * 10 ** 18)}`); 
    const nrsPrice = ethers.BigNumber.from(`${parseInt((10 ** 18)/120)}`); 

    await oracle.set_reference_data(asset1Addr, usdPrice); // [usd][usd] = 1
    await oracle.set_reference_data(asset2Addr, nrsPrice); // [nrs][usd] = 1/120
    await oracle.set_reference_data(asset3Addr, newtPrice); // [newt][usd] = 5

    const getNrsPrice = await oracle.get_reference_data(asset2Addr);
    const getNewtPrice = await oracle.get_reference_data(asset3Addr);

    expect(getNrsPrice).to.equal(nrsPrice);
    expect(getNewtPrice).to.equal(newtPrice);

    // make a1 the minter
    await asset1.addMinter(user1)
    await asset2.addMinter(user1)
    await asset3.addMinter(user1)

    // // mint to user2
    await asset1.connect(wallet1).mint(user2, BigN(150 * 10**18))
    await asset2.connect(wallet1).mint(user2, BigN(121 * 10**18))
    await asset3.connect(wallet1).mint(user2, BigN(101 * 10**18))

    // approve to core, before deposit
    await asset1.connect(wallet2).approve(core.address, BigN(150 * 10**18))
    await asset2.connect(wallet2).approve(core.address, BigN(121 * 10**18))
    await asset3.connect(wallet2).approve(core.address, BigN(100 * 10**18))

})


describe("Address Provider, Data Provider", async function () {
  it("Initialize Address Provider and Data Provider", async function () {
	let a = await data.getAllReserves();
	expect(a.length).to.equal(3);
  })
})


describe("Lending Pool", async function() {
    it ("Should be able to accept deposits", async function() {
        await pool.connect(wallet2).deposit(asset1Addr, BigN(100 * 10 ** 18))
        await pool.connect(wallet2).deposit(asset2Addr, BigN(100 * 10 ** 18))
        await pool.connect(wallet2).deposit(asset3Addr, BigN(100 * 10 ** 18))

        reserveData1 = await data.getReserveData(asset1Addr)
        reserveData2 = await data.getReserveData(asset2Addr)
        reserveData3 = await data.getReserveData(asset3Addr)

        expect(await reserveData1['availableLiquidity']).to.equal(BigN(100 * 10 ** 18))
        expect(await reserveData2['totalLiquidity']).to.equal(BigN(100 * 10 ** 18))
        expect(await reserveData3['totalBorrows']).to.equal(0)
    })
})


describe("HTokens", async function() {
    it ("Should be able to accept redeem", async function() {

        await pool.connect(wallet2).deposit(asset1Addr, BigN(100 * 10 ** 18))
        await pool.connect(wallet2).deposit(asset2Addr, BigN(100 * 10 ** 18))
        await pool.connect(wallet2).deposit(asset3Addr, BigN(100 * 10 ** 18))

        asset1HTokenAddress = await core.getReserveHTokenAddress(asset1Addr);
        asset2HTokenAddress = await core.getReserveHTokenAddress(asset2Addr);
        asset3HTokenAddress = await core.getReserveHTokenAddress(asset3Addr);

        const HToken = await ethers.getContractFactory('HToken');

        const instance1 = await HToken.attach(asset1HTokenAddress);
        const instance2 = await HToken.attach(asset2HTokenAddress);
        const instance3 = await HToken.attach(asset3HTokenAddress);

        expect(await instance1.balanceOf(user2)).to.equal(BigN(100 * 10 ** 18))
        expect(await instance2.balanceOf(user2)).to.equal(BigN(100 * 10 ** 18))
        expect(await instance3.balanceOf(user2)).to.equal(BigN(100 * 10 ** 18))

        // they can redeem their balances 
        await instance1.connect(wallet2).redeem(BigN(100 * 10 ** 18))
        await instance2.connect(wallet2).redeem(BigN(100 * 10 ** 18))
        await instance3.connect(wallet2).redeem(BigN(100 * 10 ** 18))

        expect(await instance2.balanceOf(user2)).to.equal(0)
        expect(await instance1.balanceOf(user2)).to.equal(0)
        expect(await instance3.balanceOf(user2)).to.equal(0)
    })
})

describe("Lending Pool", async function() {
    it ("Should be able to accept borrow and repay: single reserve", async function() {
        const Asset = await ethers.getContractFactory('Asset');
        const asset = Asset.attach(asset1Addr);
        const balanceBefore = await asset.balanceOf(user2);

        await pool.connect(wallet2).deposit(asset1Addr, BigN(100 * 10 ** 18))        
        await pool.connect(wallet2).borrow(asset1Addr, BigN(50 * 10 ** 18))
        const asset1DTokenAddress = await core.getReserveDTokenAddress(asset1Addr);

        const DToken = await ethers.getContractFactory('DToken');
        const instance1 = await DToken.attach(asset1DTokenAddress);

        const balanceAfter = await asset.balanceOf(user2);
        expect(await instance1.balanceOf(user2)).to.equal(BigN(50 * 10 ** 18))

        await asset1.connect(wallet2).approve(core.address, BigN(100 * 10**18))
        // user repays more than their existing loan, now all their loan should clear
        await pool.connect(wallet2).repay(asset1Addr, BigN(60 * 10 ** 18))
        expect(await instance1.balanceOf(user2)).to.equal(BigN(0))
    })
})

describe("Lending Pool Data Provider", async function() {
    it ("Should return correct user account data", async function() {

        await pool.connect(wallet2).deposit(asset1Addr, BigN(100 * 10 ** 18))
        await pool.connect(wallet2).deposit(asset3Addr, BigN(100 * 10 ** 18))

        const userAccountData = await data.getUserAccountData(user2);

        expect(userAccountData.totalBorrows).to.equal(BigN(0));
        expect(userAccountData.totalLiquidity).to.equal(BigN(600 * 10 ** 18))

        await pool.connect(wallet2).deposit(asset2Addr, BigN(100 * 10 ** 18))
        const userReserve2Data = await data.getUserReserveData(asset2Addr, user2)
        expect(userReserve2Data.totalLiquidity).to.equal(BigN(100 * 10 ** 18))
    })
})