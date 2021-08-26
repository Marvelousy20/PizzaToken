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
            return tokenInstance.transfer.call(accounts[1], 250000, {from: accounts[0]});
        }).then(function(success) {
            // Test whether the transaction returns true 
            assert.equal(success, true, 'sets return value to true') ;
            return tokenInstance.transfer(accounts[1], 250000, {from: accounts[0]}) ;
        }).then(function(receipt) {
            // test whether the arguments from the event call
            assert.equal(receipt.logs.length, 1, "Triggers one event");
            assert.equal(receipt.logs[0].event, "Transfer", "Should be the 'Transfer' event");
            assert.equal(receipt.logs[0].args._from, accounts[0], "logs the account from which the token was sent");
            assert.equal(receipt.logs[0].args._to, accounts[1], "logs the account transfer was made to")
            assert.equal(receipt.logs[0].args._value, 250000, "logs the transfer amount");
            return tokenInstance.balance(accounts[1])
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 250000, "sets balance of receiver to 250000");
            return tokenInstance.balance(accounts[0]);
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 750000, "sets the sender balance to 750000");
        })
    })

    it('approves delegate transfer', function() {
        return PizzaToken.deployed().then(function(instance) {
            tokenInstance = instance ;
            return tokenInstance.approve.call(accounts[1], 100)
        }).then(function(success) {
            assert.equal(success, true, 'it returns true') ;
            return tokenInstance.approve(accounts[1], 100, {from: accounts[0]}) ;
        }).then(function(receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Approval', 'should be the Approve event');
            assert.equal(receipt.logs[0].args._owner, accounts[0], "logs the account the token are authorized by");
            assert.equal(receipt.logs[0].args._spender, accounts[1], "logs the account the tokens are authorized to");
            assert.equal(receipt.logs[0].args._value, 100, "logs the transfer amount");
            return tokenInstance.allowance(accounts[0], accounts[1]);
        }).then(function(allowance) {
            assert.equal(allowance.toNumber(), 100, "stores allowance for delegate transfer") ;
        })
    })
    
    it("handles delegate token transfer", function() {
        return PizzaToken.deployed().then(function(instance) {
            tokenInstance = instance ;
            fromAccount = accounts[2];
            toAccount = accounts[3];
            // This will be person calling this function
            spendingAccount = accounts[4] ;
            return tokenInstance.transfer(fromAccount, 100, {from: accounts[0]});
        }).then(function() {
            // spending account is allowed to spend 10 tokens from 100 tokens that fromAccount has
            return tokenInstance.approve(spendingAccount, 10, {from: fromAccount}) ;
        }).then(function() {
            return tokenInstance.transferFrom(fromAccount, toAccount, 999, {from: spendingAccount}) ;
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf("revert") >= 0, "cannot transfer value greater than balance") ;
            return tokenInstance.transferFrom(fromAccount, toAccount, 20, {from: spendingAccount}) ;
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf("revert") >= 0, "cannot transfer value greater than approved allowance") ;
            return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, {from: spendingAccount}) ;
        }).then(function(success) {
            assert.equal(success, true)
            return tokenInstance.transferFrom(fromAccount, toAccount, 10, {from: spendingAccount}) ;
        }).then(function(receipt) {
            assert.equal(receipt.logs.length, 1, "triggers one event");
            assert.equal(receipt.logs[0].event, "Transfer", "Should be the 'Transfer' event");
            assert.equal(receipt.logs[0].args._from, fromAccount, "logs the account from which the token was sent");
            assert.equal(receipt.logs[0].args._to, toAccount, "logs the account transfer was made to")
            assert.equal(receipt.logs[0].args._value, 10, "logs the transfer amount");

            return tokenInstance.balance(fromAccount) ;
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 90, "deducts from the account sending the token") ;
            return tokenInstance.balance(toAccount) ;
        }).then(function(balance) {
            assert.equal(balance.toNumber(), 10, "adds to the acount receiving the token")
        })
    })    
})