import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";


const deployVotingContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, log } = hre.deployments;

  const deployment = await deploy("VotingContract", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  log(`Address: ${deployment.address}`);
  log(`Deployer: ${deployer}`);
};

export default deployVotingContract;

deployVotingContract.tags = ["VotingContract"];
