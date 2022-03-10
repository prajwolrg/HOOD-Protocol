# HOOD Protocol
This is a decentralized, peer to peer money market protocol on the Matic Mumbai testnet.

The outer folder structure contains files for contracts, and frontend contains the client application.

Prerequisties:

	- nodeJS
	- Hardhat
	- MetaMask
	- Solidity Compiler

All the required contracts are in contracts directory.
To compile the contracts:
```sh
npx hardhat compile
```

To test the contracts
```sh
npx hardhat test
```

To deploy the contracts
```sh
npx hardhat run scripts/deploy.js --network matic_testnet
```

The contracts will be deployed, and list of contract addresses will be printed in the console.
<br/>
Copy the json output, and replace it to `frontend/src/consts/Contracts.js`
<br/>
Similarly, replace `ReserveList.js` with token names and addresses.


Copy the contract artifacts to the frontend folder.
```sh
cp -r artifacts/contracts frontend/src
```

Then, install the node dependencies of both directories:
```sh
npm install
cd frontend && npm install
```
Run the server
```sh
npm start
```

When connecting the wallet, set the network to polygon mumbai testnet.
You should now be good to go!