const { run } = require("hardhat");

const verify = async (contractAddress, args) => {
  console.log("Verifying Contract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().include("already verified")) {
      console.log("This contract is already verified!");
    } else {
      console.log(e);
    }
  }
};

module.exports = { verify };
