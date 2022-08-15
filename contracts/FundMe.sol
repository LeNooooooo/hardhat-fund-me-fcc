// SPDX-License-Identifier: MIT

// PRAGMA
pragma solidity ^0.8.8;

//IMPORT
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol";

//ERROR
error FundMe__NotOwner(); //the double underscore is a naming convention for the erro : contractname__nameOfError

//INTERFACE

// LIBRAIRY

//CONTRACT

/** @title A contract for crowd funding
 *   @author Arnaud Desert
 *   @notice  This contract is to demo a sample funding contract
 *   @dev This implements pricefeed as our librairy
 */
contract FundMe {
    //Type Declarations
    using PriceConverter for uint256;

    // States variables
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;
    address private immutable i_owner; // we put this one private for gaz optimisation, and create a getter
    uint256 public constant MINIMUM_USD = 50 * 10**18;
    AggregatorV3Interface public s_priceFeed; // we create this new variable of type AggregatorV3interface

    // Modifiers

    modifier onlyOwner() {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // Contructor
    constructor(address priceFeedAddress) {
        // here we add a parameter to the constructor so we can put the pricefeed as parameter
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress); // this mean we call AggregatorV3Interface on the specific pricefeed we need
    }

    // Fallback / receive

    fallback() external payable {
        fund();
    }

    receive() external payable {
        fund();
    }

    /** 
    @notice  This contract is to demo a sample funding contract
    *   @dev This implements pricefeed as our librairy
    */

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        ); //adding priceFeed between parrenthesis mean second parameter
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheapWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders; //here, instead of reading storage (cost a lot) we create a memory (cheaper) variable and read only one time
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }

        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    // VIEW / PURE FUNCTIONS

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    // Explainer from: https://solidity-by-example.org/fallback/
    // Ether is sent to contract
    //      is msg.data empty?
    //          /   \
    //         yes  no
    //         /     \
    //    receive()?  fallback()
    //     /   \
    //   yes   no
    //  /        \
    //receive()  fallback()
}

// Concepts we didn't cover yet (will cover in later sections)
// 1. Enum
// 2. Events
// 3. Try / Catch
// 4. Function Selector
// 5. abi.encode / decode
// 6. Hash with keccak256
// 7. Yul / Assembly
