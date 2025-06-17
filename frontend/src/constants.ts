interface ContractsConfig {
  [chainId: number]: {
    untilThenV1: string,
    giftNFT: string,
  }
}

export const chainsToTSender: ContractsConfig = {
  11155111: {
    untilThenV1: "0x15E1CB9F78280D1301f78e98955E7355900c498B",
    giftNFT: "0xD6dC8c94720BEE353041c6D9A5E9c9cEe1b98b3B"
  }
}

export const erc20Abi = [];
export const untilThenV1Abi = [];
export const giftNFTAbi = [];
