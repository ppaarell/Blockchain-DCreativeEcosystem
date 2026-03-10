const { ethers } = require("hardhat");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

function toEth(bn) { return Number(ethers.formatEther(bn)); }

async function main() {
  const [admin, creator, dsp, validator] = await ethers.getSigners();

  // Deploy
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const asset = await AssetRegistry.deploy("CreativeAsset","CRAS"); await asset.waitForDeployment();

  const LicenseTerms = await ethers.getContractFactory("LicenseTerms");
  const terms = await LicenseTerms.deploy(await asset.getAddress(), 1); await terms.waitForDeployment();

  const TestUSD = await ethers.getContractFactory("TestUSD");
  const tUSD = await TestUSD.deploy(); await tUSD.waitForDeployment();

  const RoyaltyEngine = await ethers.getContractFactory("RoyaltyEngine");
  const engine = await RoyaltyEngine.deploy(
    await tUSD.getAddress(), await asset.getAddress(), await terms.getAddress()
  ); await engine.waitForDeployment();

  console.log("Deployed:");
  console.log(" asset        :", await asset.getAddress());
  console.log(" terms        :", await terms.getAddress());
  console.log(" tUSD         :", await tUSD.getAddress());
  console.log(" royaltyEngine:", await engine.getAddress());

  // Roles & setup
  const CREATOR_ROLE  = await asset.CREATOR_ROLE();
  await (await asset.grantRole(CREATOR_ROLE, await creator.getAddress())).wait();

  await (await terms.addValidator(await validator.getAddress())).wait();

  // Mint asset
  await (await asset.connect(creator).mintAsset(
    "ipfs://bafybeigdyrandomcid", "0x" + "a".repeat(64)
  )).wait();
  const tokenId = 1;

  // Publish terms
  const ratePerUnit = 10n ** 15n; // 1e15 wei
  await (await terms.connect(creator).proposeTerms(tokenId, ratePerUnit, "0x" + "b".repeat(64))).wait();
  await (await terms.connect(validator).approveTerms(tokenId)).wait();
  await (await terms.publishTerms(tokenId)).wait();

  // Reporter role
  const REPORTER_ROLE = await engine.REPORTER_ROLE();
  await (await engine.grantRole(REPORTER_ROLE, await dsp.getAddress())).wait();

  // Fund engine
  await (await tUSD.transfer(await dsp.getAddress(), ethers.parseEther("10000"))).wait();
  await (await tUSD.connect(dsp).approve(await engine.getAddress(), ethers.parseEther("5000"))).wait();
  await (await engine.connect(dsp).fund(ethers.parseEther("2000"))).wait();

  // 100x submitUsage + CSV
  const csvWriter = createCsvWriter({
    path: "gas_usage_royalty.csv",
    header: [
      { id: "idx", title: "idx" },
      { id: "units", title: "units" },
      { id: "dueWei", title: "dueWei" },
      { id: "gasUsed", title: "gasUsed" },
      { id: "gasPriceWei", title: "effectiveGasPriceWei" },
      { id: "txCostWei", title: "txCostWei" },
      { id: "txCostETH", title: "txCostETH" },
      { id: "txHash", title: "txHash" }
    ],
  });

  const records = [];
  let totalGas = 0n, totalCost = 0n;

  for (let i = 1; i <= 100; i++) {
    const units = 100n + BigInt(i);
    const reportHash = "0x" + i.toString(16).padStart(64, "c");
    const tx = await engine.connect(dsp).submitUsage(tokenId, units, reportHash);
    const rc = await tx.wait();
    const gasUsed = rc.gasUsed;
    const gasPrice = rc.gasPrice ?? rc.effectiveGasPrice;
    const txCost   = gasUsed * gasPrice;

    totalGas  += gasUsed;
    totalCost += txCost;

    records.push({
      idx: i,
      units: units.toString(),
      dueWei: (units * ratePerUnit).toString(),
      gasUsed: gasUsed.toString(),
      gasPriceWei: gasPrice.toString(),
      txCostWei: txCost.toString(),
      txCostETH: toEth(txCost),
      txHash: rc.hash
    });
  }

  await csvWriter.writeRecords(records);
  console.log("CSV written: gas_usage_royalty.csv");
  console.log("Total gas used:", totalGas.toString());
  console.log("Total cost (ETH, simulated):", toEth(totalCost));
}

main().catch((e)=>{ console.error(e); process.exit(1); });
