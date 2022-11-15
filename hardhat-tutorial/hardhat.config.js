require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const {ALCHEMY_URL, PREVATE_KEY} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks:{
    goerli:{
      url: ALCHEMY_URL,
      accounts: [PREVATE_KEY]
    },
  },
};
