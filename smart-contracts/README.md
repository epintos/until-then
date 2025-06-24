This includes the Foundry setup and Smart Contracts for Until Then

## Setup

```bash
  make install
  cp .env.example .env
```

## Test
```bash
  make test
```

This will run the tests using fork-url and Sepolia.

## Useful commands

You can find other useful commands for deployments, setup and debuggin in the [Makefile](./Makefile)

## Addreses in Sepolia

In the [HelperConfig](./script/HelperConfig.s.sol) you can find all the contracts that have been already deployed to Sepolia. Some of the deploy scripts will use these to setup the contracts properly.
