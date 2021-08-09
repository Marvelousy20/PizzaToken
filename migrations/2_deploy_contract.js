const PizzaToken = artifacts.require("PizzaToken");

module.exports = function (deployer) {
  deployer.deploy(PizzaToken, 1000000);
};
