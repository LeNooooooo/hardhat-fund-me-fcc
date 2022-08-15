const networkConfig = {
  //define here the network based on chainid number
  4: {
    // 4 is the chainId of rinkeby
    name: "rinkeby",
    ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e", // here is the address of the chainlink oracles for this pair on rinkeby
  },
};

const developmentChains = ["hardhat", "localhost"]; //define the localhost value
const DECIMALS = 8; //value of parameters 1 for constructor.
const INITIAL_ANSWER = 200000000000; //where the price start

module.exports = {
  networkConfig,
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
};
