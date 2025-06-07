-include .env

.PHONY: all test deploy

build :; forge build

test :; forge test

test-fork-sepolia :; @forge test --fork-url $(SEPOLIA_RPC_URL)

install :
	forge install foundry-rs/forge-std@v1.9.7 --no-git && \
	forge install openzeppelin/openzeppelin-contracts@v5.3.0 --no-git && \
	forge install smartcontractkit/chainlink-brownie-contracts@1.3.0 --no-git

deploy-sepolia :
	@forge script script/Deploy.s.sol:Deploy --rpc-url $(SEPOLIA_RPC_URL) --account $(SEPOLIA_WALLET_NAME) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv

deploy-consumer-sepolia :
	@forge script script/Deploy.s.sol:DeployFunctionConsumer --rpc-url $(SEPOLIA_RPC_URL) --account $(SEPOLIA_WALLET_NAME) --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY) -vvvv

deploy-anvil :
	@forge script script/Deploy.s.sol:Deploy --rpc-url $(RPC_URL) --account $(ANVIL_ACCOUNT) --broadcast -vvvv

get-current-timestamp:
	cast block latest --rpc-url $(SEPOLIA_RPC_URL)| grep timestamp

create-gift :
	@forge script script/Interactions.s.sol:CreateGift --rpc-url $(SEPOLIA_RPC_URL) --account $(SEPOLIA_WALLET_NAME) --broadcast -vvvv

claim-gift :
	@forge script script/Interactions.s.sol:ClaimGift --rpc-url $(SEPOLIA_RPC_URL) --account $(SEPOLIA_WALLET_NAME) --broadcast -vvvv
