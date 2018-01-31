var TestSha = artifacts.require("./TestSha.sol");

const Promise         = require("bluebird");
const keccak256       = require("solidity-sha3");
//extensions.js : credit to : https://github.com/coldice/dbh-b9lab-hackathon/blob/development/truffle/utils/extensions.js
const Extensions      = require("../utils/extensions.js");
const addEvmFunctions = require("../utils/evmFunctions.js");

addEvmFunctions(web3);
Promise.promisifyAll(web3.eth,     { suffix: "Promise" });
Promise.promisifyAll(web3.version, { suffix: "Promise" });
Promise.promisifyAll(web3.evm,     { suffix: "Promise" });
Extensions.init(web3, assert);

contract('IexecHub', function(accounts) {

  let scheduleProvider, resourceProvider, appProvider, datasetProvider, dappUser, dappProvider, iExecCloudUser, marketplaceCreator;
  let amountGazProvided = 4000000;
  let isTestRPC;
  let testTimemout = 0;
  let aTestShaInstance;


  before("should prepare accounts and check TestRPC Mode", function() {
    assert.isAtLeast(accounts.length, 8, "should have at least 8 accounts");
    scheduleProvider   = accounts[0];
    resourceProvider   = accounts[1];
    appProvider        = accounts[2];
    datasetProvider    = accounts[3];
    dappUser           = accounts[4];
    dappProvider       = accounts[5];
    iExecCloudUser     = accounts[6];
    marketplaceCreator = accounts[7];


    return Extensions.makeSureAreUnlocked(
        [scheduleProvider, resourceProvider, appProvider, datasetProvider, dappUser, dappProvider, iExecCloudUser])
      .then(() => web3.eth.getBalancePromise(scheduleProvider))
      .then(balance => assert.isTrue(
        web3.toWei(web3.toBigNumber(80), "ether").lessThan(balance),
        "dappProvider should have at least 80 ether, not " + web3.fromWei(balance, "ether")))
      .then(() => Extensions.refillAccount(scheduleProvider, resourceProvider, 10))
      .then(() => Extensions.refillAccount(scheduleProvider, appProvider, 10))
      .then(() => Extensions.refillAccount(scheduleProvider, datasetProvider, 10))
      .then(() => Extensions.refillAccount(scheduleProvider, dappUser, 10))
      .then(() => Extensions.refillAccount(scheduleProvider, dappProvider, 10))
      .then(() => Extensions.refillAccount(scheduleProvider, iExecCloudUser, 10))
      .then(() => Extensions.refillAccount(scheduleProvider, marketplaceCreator, 10))
      .then(() => web3.version.getNodePromise())
      .then(node => isTestRPC = node.indexOf("EthereumJS TestRPC") >= 0)
      .then(() => TestSha.new({
        from: marketplaceCreator
      }))
      .then(instance => {
        aTestShaInstance = instance;
        console.log("aTestShaInstance.address is ");
        console.log(aTestShaInstance.address);
      });
  });

  it("testSolidityKeccak256FromString", function() {
    return aTestShaInstance.testSolidityKeccak256FromString("0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6")
      .then(txMined => {
        assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
        return Extensions.getEventsPromise(aTestShaInstance.SolidityKeccak256FromString({}));
      })
      .then(events => {
        assert.strictEqual(events[0].args.input,                   ("0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6"), "check input");
        assert.strictEqual(events[0].args.result, web3.sha3        ("0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6"), "check input");
        assert.strictEqual(events[0].args.result, "0xf1a309330efd9a6867e20fa573071b644fbdd1d567dfa2084ba4f94e94df1cbf",                    "check result");
        // assert.notEqual   (events[0].args.result, keccak256.sha3num("0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6"), "check input");
      });
  });

  it("testSolidityKeccak256FromBytes", function() {
    return aTestShaInstance.testSolidityKeccak256FromBytes("0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6")
      .then(txMined => {
        assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
        return Extensions.getEventsPromise(aTestShaInstance.SolidityKeccak256FromBytes({}));
      })
      .then(events => {
        assert.strictEqual(events[0].args.input,                    "0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6",                     "check input");
        assert.strictEqual(events[0].args.result, web3.sha3(        "0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6", {encoding: 'hex'}), "check input");
        // assert.strictEqual(events[0].args.result, keccak256.sha3num("0xc89efdaa54c0f20c7adf612882df0950f5a951637e0307cdcb4c672f298b8bc6"),                    "check input");
        assert.strictEqual(events[0].args.result,                   "0x4aeff0db81e3146828378be230d377356e57b6d599286b4b517dbf8941b3e1b2",                     "check result. is the same as web3java !!!");
      });
  });

  it("testSolidityKeccak256FromAddress", function(){
    return aTestShaInstance.testSolidityKeccak256FromAddress(marketplaceCreator)
      .then(txMined => {
        assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
        return Extensions.getEventsPromise(aTestShaInstance.SolidityKeccak256FromAddress({}));
      })
      .then(events => {
        assert.strictEqual(events[0].args.input,           (marketplaceCreator                   ), "test fail, Address 0");
        assert.strictEqual(events[0].args.result, web3.sha3(marketplaceCreator, {encoding: 'hex'}), "test fail, Address 1");
        // assert.strictEqual(events[0].args.result, keccak256.sha3num( 0x14723a09acff6d2a60dcdf7aa4aff308fddc160c ),                        "test fail, Address 2");
        // NOT PREDICTABLE, address (marketplaceCreator) can depend on the runtime
        // assert.strictEqual(events[0].args.result, "",  "test fail, Address 3");
      });
  });

  it("testSignedVote", function(){
    const result  = web3.sha3("tagazok"); // bytes32 signature of the returned value
    const address = accounts[0];

    return aTestShaInstance.testSignedVote(result, {from: address})
      .then(txMined => {
        assert.isBelow(txMined.receipt.gasUsed, amountGazProvided, "should not use all gas");
        return Extensions.getEventsPromise(aTestShaInstance.SignedVote({}));
      })
      .then(events => {
        const signed = Extensions.signResult("tagazok", address);
        assert.strictEqual(events[0].args.input, result,                                                                "test fail, SignedVote 0 (input)");
        assert.strictEqual(events[0].args.voter, address,                                                               "test fail, SignedVote 1 (voter)"); // accounts[0] is the requester
        assert.strictEqual(events[0].args.vote,  signed.hash,                                                           "test fail, SignedVote 2 (vote)");
        assert.strictEqual(events[0].args.sign,  signed.sign,                                                           "test fail, SignedVote 3 (sign)");
        assert.strictEqual(events[0].args.vote,  "0xca27f1c6a82d0e2d5a2393071a6528b5f5bde9cefadcb36ba69c287581904a29",  "test fail, SignedVote 4 (vote)");
      });
  });


});
