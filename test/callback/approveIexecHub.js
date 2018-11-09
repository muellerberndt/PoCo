const Promise = require('bluebird');
const Web3 = require('web3');
const fs = require('fs-extra');
const openAsync = Promise.promisify(fs.open);
const writeAsync = Promise.promisify(fs.write);
const readFileAsync = Promise.promisify(fs.readFile);
const writeFileAsync = Promise.promisify(fs.writeFile);

var MSG_SENDER = process.argv[2] || "0x8bd535d49b095ef648cd85ea827867d358872809";
var SMART_CONTRACT_ADDRESS = process.argv[3] || "0xeae99b010f8b8852ab47ba883f4c5157633c5ac6";
var NODE_TARGET = process.argv[3] || "http://localhost:8545";

web3 = new Web3(new Web3.providers.HttpProvider(NODE_TARGET));

Promise.promisifyAll(web3.eth, {
  suffix: "Promise"
});

async function getAbiContent() {
  try {
    var abiFileContent = await readFileAsync("../../deployed/contracts/IexecAPI.json");
    return JSON.parse(abiFileContent);
  } catch (err) {
    console.error(err)
  }
};

async function run() {
  try {
    var abi = await getAbiContent();
    console.log(abi);
    console.log(abi.abi);
    var contract = new web3.eth.Contract(abi.abi, SMART_CONTRACT_ADDRESS);
    //var balanceOfBefore = await contract.methods.balanceOf(MSG_SENDER).call();
    //console.log("MSG_SENDER [" + MSG_SENDER + "] balanceOf before is [" + balanceOfBefore + "]");

    web3.eth.getTransactionCountPromise(MSG_SENDER).timeout(2000).then(function(currentNonce) {
      console.log("MSG_SENDER [" + MSG_SENDER + "] nonce is [" + currentNonce + "]");
      try {

/*
txMined = await aIexecAPIInstance.approveIexecHub(200,{
  from: iExecCloudUser,
  gas: constants.AMOUNT_GAS_PROVIDED
});
assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");

*/

        contract.methods.approveIexecHub(200).send({
            from: MSG_SENDER,
            gas: "4000000",
            gasPrice: "20000000000",
            nonce: currentNonce
          })
          .on('transactionHash', function(hash) {
            console.debug("approveIexecHub : " + hash);
          })
          .on('receipt', function(receipt) {
            console.debug("receipt : " + receipt);
            str = JSON.stringify(receipt, null, 4);
            console.debug(str);

          })
          .on('confirmation', function(confirmationNumber, receipt) {
            console.debug("confirmationNumber : " + confirmationNumber);
          })
          .on('error', function(error) {
            console.error("sendTransaction error !");
            console.error(error);
            process.exit(1);
          });
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
