// this script export a function (anonymous : with no name)  who will be launch with ethers when running npx hardhat deploy
// hre will be the parameters of the function (relative to network, address, etc...)
// this syntax mean we define hre.getNamedAccounts and hre.deployments

//this function is equal to this one :

// async function deployFunc(hre) {
//       hre.getNamedAccounts()
//       hre.deployements
//}
// module.exports.default = deployFunc

const { networkConfig, developmentChains } = require("../helper-hardhat-config") //importing the network chain id correspondance file. it  extrapolate only "networkConfig" function from the helper-hardhat-config file
const { network } = require("hardhat") //we import the method network from hardhat (will be used for chain Id)
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments // same than declaring deployments.deploy and deployments.log
    const { deployer } = await getNamedAccounts()
    console.log("deployer: " + deployer)
    const chainId = network.config.chainId //we call her the chainid of the network (so we can make test on it)
    console.log("ChainId:" + chainId)
    //go here for more detail :https://github.com/aave/aave-v3-core/blob/master/helper-hardhat-config.ts

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]; // chainId has been grab above, so we can request here for this chain id the value of the field ethUsdPriceFeed
    let ethUsdPriceFeedAddress
    console.log("ethusedpricefeedaddress:" + ethUsdPriceFeedAddress)

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") // this command is to wait the deployment of the mock to be done
        ethUsdPriceFeedAddress = ethUsdAggregator.address // ask the pricefeed address from the mock previously deployed
        console.log(
            "ethusedpricefeedaddress if local chain:" + ethUsdPriceFeedAddress
        )
    } else {
        // so the other case is : the network is not a dev network
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"] //we then ask the ethUsdPriceFeed value from helper-hardhat where we define this
        console.log(
            "ethusedpricefeedaddress if NOT local chain:" +
                ethUsdPriceFeedAddress
        )
    }

    // unfortunatelly, it s not working with localhost blockchain as hardhat (because there is no chain link address for hardhat), that's why we need MOCK
    const args = [ethUsdPriceFeedAddress]
    console.log("args:" + args)

    const fundMe = await deploy("FundMe", {
        //main contract deployment

        from: deployer,
        args: args, //here we put args for constructor, we will put our priceFeed
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1, // here we call the value of number of blockconfirmation VIA hardhat.config.js
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        // test if the network is not a dev network & if there is an etherscan api key

        await verify(fundMe.address, args) //call of the verify function with the new deploy contract address and the corresponding args
    }
    log("----------------------------------------")
}
console.log("Finished")

module.exports.tags = ["all", "fundme"]

// https://www.youtube.com/watch?v=gyMwXuJrbJQ&t=10h52m06s
