# HOOD Protocol

This project is decentralized money market protocol along with a frontend for it.

## Folder Structure
```
contracts/ :  Required solidity contracts for HOOD Protocol.

frontend/ : Code for frontend

scripts/ : Protocol deployment script

test/ : Unit tests
```

# How to run

### Initialize
```sh
git clone git@github.com:izyak/HOOD-Protocol.git
cd HOOD-Protocol
git checkout main
npm install
```
### Compile contracts
Assuming you're in HOOD-Protocol Directory

```sh
npx hardhat compile
```
### Test contracts
```
npx hardhat test
```

### Deploy contract to hardhat node

First, initialize an instance of hardhat node
```
npx hardhat node
```
In another terminal, run the following command 
```
npx hardhat run scripts/deploy.js --network hardhat_node
```
This commands runs the file deploy.js in the scripts directory.<br/>
It initializes the system, deploys 3 assets and mints all 3 tokens to deployer address, and deposit some of it. It also copies all contract addresses to `frontend/src/consts/contractAddresses.json`.

## Testnet Deployment
To deploy to testnet, change the private key in `hardhat.config.js` file with your own account with some balance for the testnet. Configuration for matic and harmony testnet are added by default. To deploy to other networks, add required configuration in `hardhat.config.js`
```sh
npx hardhat run scripts/deploy.js --network matic_testnet # matic testnet
npx hardhat run scripts/deploy.js --network harmony_testnet # harmony testnet
```

## Frontend
When we compile the project, a directory, artifacts will be made. Copy the contracts directory in the artifacts folder to the frontend/src folder.
```sh
cp -r artifacts/contracts frontend/src 
```
This command copies ABI of all contracts to the frontend folder.
Copy all the contract addresses to `consts/Contracts.js`

Then, navigate in the frontend folder, and install required nppm dependencies using
```sh
cd frontend
npm install
npm start
```

Then, the frontend should load at localhost:3000 in the browser.

The frontend uses default provider of metamask. So, for hardhat node, make sure to change the configuration for hardhat node, and select hardhat node as provider.

### Note:
These contracts has been deployed at matic testnet and harmony testnet as well.
The contract addresses for these networks are commented out in `Contracts.js` file of `frontend/src/consts/Contracts.js`. You can use them to test out instead of deploying in the hardhat node.

## FYI:
If you encounter this error 
```
'SafeERC20: low-level call failed'
```
make sure you mint 3 assets to the same wallet which tries to deposit.

```js
// line number 88 in deploy.js
await asset1.mint(deployerAddr, BigN(999 * 10 ** 18))
await asset2.mint(deployerAddr, BigN(999 * 10 ** 18))
await asset3.mint(deployerAddr, BigN(999 * 10 ** 18))

// line number 122 in deploy.js
await pool.connect(deployer).deposit(contracts['usd'], BigN(200 * 10 ** 18))
await pool.connect(deployer).deposit(contracts['nrs'], BigN(200 * 10 ** 18))
await pool.connect(deployer).deposit(contracts['indg'], BigN(200 * 10 ** 18))  
```
