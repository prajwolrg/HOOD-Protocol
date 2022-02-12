const { expect } = require("chai");

function BigN(n) {
    return ethers.BigNumber.from(n.toString())
}

beforeEach(async function () {
    const AddressProvider = await ethers.getContractFactory("AddressProvider")
    const Core = await ethers.getContractFactory("LendingPoolCore");
    const Pool = await ethers.getContractFactory("LendingPool");
    const Asset = await ethers.getContractFactory("Asset");
    const Oracle = await ethers.getContractFactory("Oracle");

    let addressProvider = await AddressProvider.deploy()
    ap = addressProvider.address
    core = await Core.deploy(ap)
    pool = await Pool.deploy(ap)
    oracle = await Oracle.deploy()

    addressProvider.setLendingPool(pool.address)
    addressProvider.setLendingPoolCore(core.address)
    addressProvider.setPriceOracle(oracle.address)
    addressProvider.setETHAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')

    await pool.deployed()
    await core.deployed()
    await oracle.deployed()

    await core.initialize()
    await pool.initialize()

    oracle.set_reference_data("USDH", "USD", ethers.BigNumber.from('1000000000000000000'))
    oracle.set_reference_data("NEWT", "USD", ethers.BigNumber.from('5000000000000000000'))
    oracle.set_reference_data("NRSH", "USD", ethers.BigNumber.from('8333333333333333'))

    asset1 = await Asset.deploy("USD Hood", "USDH", 18);
    asset1Addr = asset1.address;

    asset2 = await Asset.deploy("NRS Hood", "NRSH", 18);
    asset2Addr = asset2.address;

    asset3 = await Asset.deploy("Newton Token", "NEWT", 18);
    asset3Addr = asset3.address;

    await core.initializeReserve(
        asset1Addr,
        18,
        ethers.BigNumber.from('650000000000000000'),
        ethers.BigNumber.from('500000000000000000000000000')
    );

    await core.initializeReserve(
        asset2Addr,
        18,
        ethers.BigNumber.from('650000000000000000'),
        ethers.BigNumber.from('500000000000000000000000000')
    );

    await core.initializeReserve(
        asset3Addr,
        18,
        ethers.BigNumber.from('650000000000000000'),
        ethers.BigNumber.from('500000000000000000000000000')
    );

    [owner, wallet1, wallet2] = await ethers.getSigners();
    ownerAddr = await owner.getAddress()
    user1 = await wallet1.getAddress()
    user2 = await wallet2.getAddress()

    // make a1 the minter
    await asset1.addMinter(user1)
    await asset2.addMinter(user1)
    await asset3.addMinter(user1)

    // // mint to user2
    await asset1.connect(wallet1).mint(user2, BigN(101 * 10**18))
    await asset2.connect(wallet1).mint(user2, BigN(101 * 10**18))
    await asset3.connect(wallet1).mint(user2, BigN(101 * 10**18))

    // approve to core, before deposit
    await asset1.connect(wallet2).approve(core.address, BigN(100 * 10**18))
    await asset2.connect(wallet2).approve(core.address, BigN(100 * 10**18))
    await asset3.connect(wallet2).approve(core.address, BigN(100 * 10**18))
})


describe("Lending Pool Core", function () {
    it("should be able to initialize multiple reserves", async function () {
        expect(await core.getReserveActiveStatus(asset1Addr)).to.equal(true);
        expect(await core.getReserveActiveStatus(asset2Addr)).to.equal(true);
        expect(await core.getReserveActiveStatus(asset3Addr)).to.equal(true);
    })
})

// describe("Deposit and Redeem: ", function () {
//     it("should be able to accept multiple reserve deposits and redeem", async function () {
//         await asset1.deployed();
//         await asset2.deployed();
//         await asset3.deployed();
//         await pool.deployed();
//         await core.deployed();

//         await pool.connect(wallet2).deposit(asset1Addr, BigN(100 * 10 ** 18))
//         await pool.connect(wallet2).deposit(asset2Addr, BigN(100 * 10 ** 18))
//         await pool.connect(wallet2).deposit(asset3Addr, BigN(100 * 10 ** 18))

//         // get reserve data
//         const asset1Data = await core.getReserveData(asset1Addr)
//         const asset2Data = await core.getReserveData(asset2Addr)
//         const asset3Data = await core.getReserveData(asset3Addr)

//         expect(await asset1Data.totalLiquidity).to.equal(BigN(100 * 10 ** 18))
//         expect(await asset2Data.totalLiquidity).to.equal(BigN(100 * 10 ** 18))
//         expect(await asset3Data.totalLiquidity).to.equal(BigN(100 * 10 ** 18))

//         // get reserve htoken address
//         asset1HTokenAddress = await core.getReserveHTokenAddress(asset1Addr);
//         asset2HTokenAddress = await core.getReserveHTokenAddress(asset2Addr);
//         asset3HTokenAddress = await core.getReserveHTokenAddress(asset3Addr);

//         const HToken = await ethers.getContractFactory('HToken');

//         const instance1 = await HToken.attach(asset1HTokenAddress);
//         const instance2 = await HToken.attach(asset2HTokenAddress);
//         const instance3 = await HToken.attach(asset3HTokenAddress);

//         expect(await instance1.balanceOf(user2)).to.equal(BigN(100 * 10 ** 18))
//         expect(await instance2.balanceOf(user2)).to.equal(BigN(100 * 10 ** 18))
//         expect(await instance3.balanceOf(user2)).to.equal(BigN(100 * 10 ** 18))

//         // they can redeem their balances 
//         await instance1.connect(wallet2).redeem(BigN(100 * 10 ** 18))
//         await instance2.connect(wallet2).redeem(BigN(100 * 10 ** 18))
//         await instance3.connect(wallet2).redeem(BigN(100 * 10 ** 18))

//         expect(await instance2.balanceOf(user2)).to.equal(0)
//         expect(await instance1.balanceOf(user2)).to.equal(0)
//         expect(await instance3.balanceOf(user2)).to.equal(0)
//     })
// })

describe("Borrow and Repay: ", function () {
    it("should be able to accept multiple reserve borrow and repay", async function () {
        await asset1.deployed();
        await asset2.deployed();
        await asset3.deployed();
        await pool.deployed();
        await core.deployed();

        // deposit first before borrow
        await pool.connect(wallet2).deposit(asset1Addr, BigN(100 * 10 ** 18))
        await pool.connect(wallet2).deposit(asset2Addr, BigN(100 * 10 ** 18))
        await pool.connect(wallet2).deposit(asset3Addr, BigN(100 * 10 ** 18))

        // then borrow
        // console.log(await core.getUserAccountData(user2))
        console.log("----Borrow 1 ------------")
        await pool.connect(wallet2).borrow(asset1Addr, BigN(50 * 10 ** 18))
        console.log("----Borrow 2 ------------")
        await pool.connect(wallet2).borrow(asset2Addr, BigN(50 * 10 ** 18))
        console.log("----Borrow 3---------------")
        await pool.connect(wallet2).borrow(asset3Addr, BigN(49 * 10 ** 18))

        // approve before repay
        await asset1.connect(wallet2).approve(core.address, BigN(55 * 10**18))
        await asset2.connect(wallet2).approve(core.address, BigN(55 * 10**18))
        await asset3.connect(wallet2).approve(core.address, BigN(55 * 10**18))
        
        // repay
        await pool.connect(wallet2).repay(asset1Addr, BigN(51 * 10**18))
        await pool.connect(wallet2).repay(asset2Addr, BigN(50 * 10**18))
        await pool.connect(wallet2).repay(asset3Addr, BigN(50 * 10**18))

        // get user account data
        console.log(await asset1.balanceOf(user2) / 10 ** 18)
        console.log(await asset1.balanceOf(user2) / 10 ** 18)
        console.log(await asset1.balanceOf(user2) / 10 ** 18)
        
    })
})