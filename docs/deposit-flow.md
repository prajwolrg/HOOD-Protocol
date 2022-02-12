# Deposit Flow

### Prerequisties
- Contracts deployed.
- Reserve initialized in lending pool core.

### Flow
- Approve amount to core
- Started by calling deposit method in lending pool

    ```js
    pool.deposit(reserve, amount);
    ```
- Get core instance
- Get hToken instance for that reserve
- Update State on Deposit (Core)
    - Update cumulative indexes
        - if total borrows on that reserve > 0,  update liquidity and borrow cumulative indexes
    - Update reserve interest rates and last update timestamp
- Mint hToken on Deposit
    - Cumulate Balance
        - If it is not user's 1st deposit, check if user has some interest pending. If yeah, mint that address to the user.
        - Set the user index to be the same as reserve index.
    - Call internal mint method on that address
- Transfer funds to core
    - Transfer the amount from user to core
- Fire Deposit eventlog

