const PizzaToken = artifacts.require("./pizzaToken.sol");

contract("PizzaToken", function(accounts) {
    let tokenInstance;

    it("sets the token details correctly", function() {
        return PizzaToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return tokenInstance.name();
        }).then(function(name) {
            assert.equal(name, "PizzaToken", "has correct name")
            return tokenInstance.symbol()
        }).then(function(symbol) {
            assert.equal(symbol, "PIZ", "has correct symbol")
        })
    })

    it("sets the the totalSupply on deployment", function() {
        return PizzaToken.deployed().then(function(instance) {
            tokenInstance = instance;
            return tokenInstance.totalSupply() ;
        }).then(function(totalSupply) {
            assert.equal(totalSupply.toNumber(), 1000000, "sets total supply to 1,000,000");
            return tokenInstance.balance(accounts[0]) ;
        }).then(function(adminBalance) {
            assert.equal(adminBalance.toNumber(), 1000000, "It sets admin balance to 1,000,000")
        });
    }) 

    it("transfer tokens to another account", function() {
        return PizzaToken.deployed().then(function(instance) {
            tokenInstance = instance ;
            return tokenInstance.transfer.call(accounts[1], 99999999999);
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf("revert") >= 0, "error message must contain the word revert");
            return tokenInstance.transfer(accounts[1], 250000, {from: accounts[0]})
        }).then(function(receipt) {
            // text for the event
            assert.equal(receipt.logs.length, 1, "Triggers one event"),
            assert.equal(receipt.logs[0].event, "Transfer", "Should be the 'Transfer' event"),
            assert.equal(receipt.logs[0].args._from, accounts[0], "logs the account from which the token was sent"),
            assert.equal(receipt.logs[0].args._to, accounts[1], "logs the account transfer was made to"),
            assert.equal(receipt.logs[0].args._value, 250000, "logs the transfer amount")
            return tokenInstance.balance(accounts[1])
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 250000, "sets balance of receiver to 250000");
            return tokenInstance.balance(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 750000, "sets the sender balance to 750000");
        })
    })
})