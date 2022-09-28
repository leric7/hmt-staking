# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

## Development

1. Copy `.env.sample` to `.env`

1. Compile the Contracts

   ```shell
   npx hardhat compile
   ```

1. Run Hardhat Node

   ```shell
   npx hardhat node
   ```

1. Deploy Contracts to Hardhat node

   ```shell
     npx hardhat deploy:full --network localhost
   ```

1. Run API Server

   ```shell
     yarn dev:api
   ```

## Improvements

- Write more test cases for smart contract.
- Dockerizing the dev environment.
