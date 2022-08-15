const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = "1000000000000000000" //we hardcode here some value for below tests. we can also write it like this : ethers.utils.parseEther("1")
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer // we assign the deployer object of the specific account to this object
              // another way to get account deployer :
              // const accounts = await ethers.getSigner() // this is calling all the signer (account) of the hardhatconfig
              // const accountZero = accounts(0) // we call here the first account grabbed by the previous line. Actually the account 0 willbe the first account of the list

              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer) // this get contract function will give use the latest deployement of this contract, done with deployer account
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })
          describe("constructor", async function () {
              it("set the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address) // this whole test will test if we assign correctly the pricefeed data from fundMr to Mock3Aggregator
              })
          })

          describe("fund", async function () {
              // all those tests are for the "fund" function
              it("fails if you don't send enough ETH", async function () {
                  // here we test if the fund function is call with not enough ETH, if the error handling in the code is working
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("updated the amount funded data structur", async function () {
                  await fundMe.fund({ value: sendValue }) // call of the function with the hardcode data
                  const response = await fundMe.getAddressAmountFunded(
                      //we are calling here the mapping in the sol file
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString()) //here we ask if the call of the addressToAmountFunded function with the deployer addressin param is the same than
              })

              it("Adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer) // here we test if the address of deployer is well pushed in the array of funder
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  // before each is used to launch action before test, here we fund the contract
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single funder", async function () {
                  // the modele of test will be
                  // arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(
                          // we define a const which will have the balance of the contract (after the beforeEach)
                          fundMe.address
                      )

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // same for the deployer address

                  // act

                  const transactionResponse = await fundMe.withdraw() // we call the withdraw function

                  const transactionReceipt = await transactionResponse.wait(1) // we wait one block

                  const { gasUsed, effectiveGasPrice } = transactionReceipt // this syntax pull out the two object from transactionReceipt object (we know the name by running debugger)
                  const gasCost = gasUsed.mul(effectiveGasPrice) // we use .mul because it s big number

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // gas Cost

                  //assert

                  assert.equal(endingFundMeBalance, 0) // check of the balance of contract after withdraw
                  console.log(
                      "1:" +
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString()
                  )
                  console.log(
                      "2:" + endingDeployerBalance.add(gasCost).toString()
                  )
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() // we include here the gas cost we calculate before
                  ) // check if the deployer end balance equal total of balance
              })

              it("Cheap withdraw ETH from a single funder", async function () {
                  // the modele of test will be
                  // arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(
                          // we define a const which will have the balance of the contract (after the beforeEach)
                          fundMe.address
                      )

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // same for the deployer address

                  // act

                  const transactionResponse = await fundMe.cheapWithdraw() // we call the withdraw function

                  const transactionReceipt = await transactionResponse.wait(1) // we wait one block

                  const { gasUsed, effectiveGasPrice } = transactionReceipt // this syntax pull out the two object from transactionReceipt object (we know the name by running debugger)
                  const gasCost = gasUsed.mul(effectiveGasPrice) // we use .mul because it s big number

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  // gas Cost

                  //assert

                  assert.equal(endingFundMeBalance, 0) // check of the balance of contract after withdraw
                  console.log(
                      "1:" +
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString()
                  )
                  console.log(
                      "2:" + endingDeployerBalance.add(gasCost).toString()
                  )
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() // we include here the gas cost we calculate before
                  ) // check if the deployer end balance equal total of balance
              })

              it("allows us to withdraw with multiple funders", async function () {
                  // here we test in case there is multiple funder

                  //ARRANGE
                  const accounts = await ethers.getSigners() // we call the signer
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          // we create a new object with the index of account starting at 1 because 0 is the deployer
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue }) // and here we use the fund function with each of the instance of the contact created with other accounts
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(
                          // we define a const which will have the balance of the contract (after the beforeEach)
                          fundMe.address
                      )

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // same for the deployer address

                  //ACT

                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //ASSERT

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  console.log(
                      "1:" +
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString()
                  )
                  console.log(
                      "2:" + endingDeployerBalance.add(gasCost).toString()
                  )
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure that the funders are reset properly AFTER DOING THE TEST, because normally we empty the money of each account
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("cheaperWithdraw Testing...", async function () {
                  // here we test in case there is multiple funder

                  //ARRANGE
                  const accounts = await ethers.getSigners() // we call the signer
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          // we create a new object with the index of account starting at 1 because 0 is the deployer
                          accounts[i]
                      )
                      await fundMeConnectedContract.fund({ value: sendValue }) // and here we use the fund function with each of the instance of the contact created with other accounts
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(
                          // we define a const which will have the balance of the contract (after the beforeEach)
                          fundMe.address
                      )

                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) // same for the deployer address

                  //ACT

                  const transactionResponse = await fundMe.cheapWithdraw()
                  const transactionReceipt = await transactionResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //ASSERT

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer)

                  assert.equal(endingFundMeBalance, 0)
                  console.log(
                      "1:" +
                          startingFundMeBalance
                              .add(startingDeployerBalance)
                              .toString()
                  )
                  console.log(
                      "2:" + endingDeployerBalance.add(gasCost).toString()
                  )
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )

                  // Make sure that the funders are reset properly AFTER DOING THE TEST, because normally we empty the money of each account
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })

              it("only allow the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1] // here we define an account (the index 1) as attacker who will try to withdraw the fund
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted // using the withdraw function with this account should not work
              })
          })
      })
