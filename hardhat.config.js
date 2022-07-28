require("@nomiclabs/hardhat-waffle");
require('dotenv').config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("@nomiclabs/hardhat-waffle");

// Replace this private key with your Harmony account private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Be aware of NEVER putting real Ether into testing accounts
const PRIVATE_KEY = process.env.ICE_PRIVATE_KEY;



module.exports = {
  solidity: "0.5.5",
  networks: {
    matic_testnet: {
      url: `https://rpc-mumbai.maticvigil.com`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    harmony_testnet: {
      url: `https://api.s0.b.hmny.io`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    hardhat_node: {
      url: `http://127.0.0.1:8545`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    ganache_node: {
      url: `http://127.0.0.1:7545`,
      accounts: [`0x${PRIVATE_KEY}`]
    },
    arctic: {
      url: `https://arctic-rpc.icenetwork.io:9933`,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  }
};
