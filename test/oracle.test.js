// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("Oracle", function () {
//   it("Should return price os various assets in USD once set", async function () {
//     const Oracle = await ethers.getContractFactory("Oracle");
//     const oracle = await Oracle.deploy();
//     await oracle.deployed();

//     const ethPrice = ethers.BigNumber.from(`${parseInt(4000 * 10 ** 18)}`); 
//     const nrsPrice = ethers.BigNumber.from(`${parseInt((10 ** 18)/119)}`); 

//     const setEthPrice = await oracle.set_reference_data("ETH","USD", ethPrice);
//     const setNRSPrice = await oracle.set_reference_data("NRS","USD", nrsPrice);
//     // price should be set by now
//     const getEthPrice = await oracle.get_reference_data("ETH", "USD");
//     const getNRSPrice = await oracle.get_reference_data("NRS", "USD");
//     // asserts
//     expect(getEthPrice).to.equal(ethPrice);
//     expect(getNRSPrice).to.equal(nrsPrice);
    
//   });

//   it('only deployer should be able to change prices', async function() {
//     const Oracle = await ethers.getContractFactory("Oracle");
//     const oracle = await Oracle.deploy();
//     await oracle.deployed();

//     let [wallet1, wallet2, wallet3] = await ethers.getSigners() // first 3 wallets are saved in the variables
//     const ethPrice = ethers.BigNumber.from(`${parseInt(4000 * 10 ** 18)}`); 
//     await expect(oracle.connect(wallet3).set_reference_data("ETH","USD", ethPrice)).to.be.revertedWith('Oracle: Sender not owner error');
//   })
// });
