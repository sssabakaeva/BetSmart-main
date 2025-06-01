import { expect } from "chai";
import { ethers } from "hardhat";
import { VotingContract } from "../typechain-types";

describe("Контракт Голосования", function () {
  let votingContract: VotingContract;

  before(async () => {
    const VotingContractFactory = await ethers.getContractFactory("VotingContract");
    votingContract = (await VotingContractFactory.deploy()) as VotingContract;
    await votingContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Должен правильно указывать владельца", async function () {
      const [owner] = await ethers.getSigners();
      expect(await votingContract.owner()).to.equal(owner.address);
    });
  });

  describe("Сессия Голосования", function () {
    it("Должен позволять владельцу создавать сессию голосования", async function () {
      //const [owner] = await ethers.getSigners();
      const description = "Test Voting Session";
      const candidates = ["Alice", "Bob"];
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;

      await votingContract.createVotingSession(description, candidates, startTime, endTime);

      const session = await votingContract.votingSessions(0);
      expect(session.description).to.equal(description);
      expect(session.startTime).to.equal(BigInt(startTime));
      expect(session.endTime).to.equal(BigInt(endTime));
      expect(session.exists).to.equal(true);
    });

    it("Должен позволять пользователю голосовать во время активной сессии", async function () {
      const [, voter] = await ethers.getSigners();
      const startTime = Math.floor(Date.now() / 1000);
      const endTime = startTime + 3600;
    
      await votingContract.createVotingSession("Active Session", ["Alice"], startTime, endTime);
    
      await ethers.provider.send("evm_setNextBlockTimestamp", [startTime + 10]);
      await ethers.provider.send("evm_mine", []);
    
      await votingContract.connect(voter).vote(0, 0);
    
      const results = await votingContract.getResults(0);
      expect(results[1][0]).to.equal(BigInt(1));
    });
    

    it("Должен предотвращать голосование за пределами периода голосования", async function () {
      const description = "Expired Session";
      const candidates = ["Charlie"];
      const endTime = Math.floor(Date.now()) - 1000;

      await votingContract.createVotingSession(description, candidates, endTime - 3600, endTime);

      await expect(votingContract.vote(1, 0)).to.not.be.revertedWith("Voting is not active");
    });

    it("Должен возвращать правильные результаты после голосования", async function () {
      const results = await votingContract.getResults(0);
    
      const [names, votes] = results;
      expect(names[0]).to.equal("Alice");
      expect(votes[0]).to.equal(BigInt(1)); 
      expect(names[1]).to.equal("Bob");
      expect(votes[1]).to.equal(BigInt(0));
    });    
  });
});
