const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const Wallet = await hre.ethers.getContractFactory("Wallet");
    const wallet = await Wallet.deploy(); // Déploie le contrat

    await wallet.waitForDeployment(); // ← Ethers v6

    const address = await wallet.getAddress(); // ← Ethers v6
    console.log("Wallet deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
