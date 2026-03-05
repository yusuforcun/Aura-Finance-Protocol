const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuraCredit", function () {
  let contract;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const AuraCredit = await ethers.getContractFactory("AuraCredit");
    contract = await AuraCredit.deploy();
  });

  describe("takeCredit", function () {
    it("should open credit with principal", async function () {
      await contract.connect(user1).takeCredit(1000);
      const [principal, repaid, active, debt] = await contract.getPosition(user1.address);
      expect(principal).to.equal(1000);
      expect(repaid).to.equal(0);
      expect(active).to.be.true;
      expect(debt).to.equal(1020); // 1000 + 2% interest
    });

    it("should reject zero amount", async function () {
      await expect(contract.connect(user1).takeCredit(0)).to.be.revertedWith("Amount zero");
    });

    it("should reject second credit when active", async function () {
      await contract.connect(user1).takeCredit(1000);
      await expect(contract.connect(user1).takeCredit(500)).to.be.revertedWith("Active credit exists");
    });
  });

  describe("repay", function () {
    it("should reduce debt on repay", async function () {
      await contract.connect(user1).takeCredit(1000); // debt 1020
      await contract.connect(user1).repay(1020); // full repay closes
      const [, , active, debt] = await contract.getPosition(user1.address);
      expect(active).to.be.false;
      expect(debt).to.equal(0);
    });

    it("should revert when debt is 0 (bonus covers all)", async function () {
      await contract.connect(user1).claimJoinBonus(); // 50 bonus
      await contract.connect(user1).takeCredit(40); // 40 + 2% = 40.8, bonus 50 covers => debt 0
      await expect(contract.connect(user1).repay(1)).to.be.revertedWith("Debt zero - use closeCredit()");
    });
  });

  describe("closeCredit (deadlock fix)", function () {
    it("should close when bonus fully covers debt", async function () {
      await contract.connect(user1).claimJoinBonus(); // 50 bonus
      await contract.connect(user1).takeCredit(40); // raw debt ~41, bonus 50 > 41 => debt=0
      const [, , activeBefore] = await contract.getPosition(user1.address);
      expect(activeBefore).to.be.true;

      await contract.connect(user1).closeCredit();
      const [principal, , active, debt] = await contract.getPosition(user1.address);
      expect(active).to.be.false;
      expect(debt).to.equal(0);
      expect(principal).to.equal(40);
    });
  });

  describe("bonus preservation", function () {
    it("should keep unused bonus after close", async function () {
      await contract.connect(user1).claimJoinBonus(); // 50 bonus
      await contract.connect(user1).takeCredit(20); // raw debt ~20.4, bonus 50 > 20.4
      const bonusBefore = await contract.joinBonus(user1.address);
      expect(bonusBefore).to.equal(50);

      await contract.connect(user1).closeCredit();
      const bonusAfter = await contract.joinBonus(user1.address);
      // bonusUsed = min(20.4, 50) = 20.4, remaining = 50 - 21 = 29 (rawDebt rounds)
      expect(bonusAfter).to.be.greaterThan(0);
      expect(bonusAfter).to.be.lessThan(50);
    });
  });

  describe("double bonus prevention", function () {
    it("should not allow claim + grant", async function () {
      await contract.connect(user1).claimJoinBonus();
      await expect(contract.connect(owner).grantJoinBonus(user1.address)).to.be.revertedWith(
        "Already received bonus"
      );
    });

    it("should not allow grant + claim", async function () {
      await contract.connect(owner).grantJoinBonus(user1.address);
      await expect(contract.connect(user1).claimJoinBonus()).to.be.revertedWith("Already claimed");
    });

    it("should not allow double claim", async function () {
      await contract.connect(user1).claimJoinBonus();
      await expect(contract.connect(user1).claimJoinBonus()).to.be.revertedWith("Already claimed");
    });
  });

  describe("interest", function () {
    it("should apply 2% interest", async function () {
      await contract.connect(user1).takeCredit(1000);
      const [, , , debt] = await contract.getPosition(user1.address);
      expect(debt).to.equal(1020);
    });
  });
});
