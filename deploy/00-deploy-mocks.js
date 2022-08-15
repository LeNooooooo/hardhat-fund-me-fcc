// the purpose of this mock script is to deploy a "fake" contract who will simulate for example a data feed from chainlink

const { network } = require("hardhat");
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config"); // we import here the developmentChain we create in the helper

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  if (developmentChains.includes(network.name)) {
    // this is the same than asking if the chain id is 31337 (hardhat chain id)
    log("Local Network Detected! Deploying Mocks..."); // the log function import before is like console log
    await deploy("MockV3Aggregator", {
      //we then deploy the mock
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log("Mock Deployed!");
    log("------------------------------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"]; // this tags allow, with the command --mocks to launch the deploy only of the mocks (this file) :npm hardhat deploy --mock
