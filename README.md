README

Reproducible Royalty Settlement Engine
A Rights-Aware Blockchain Licensing Prototype

Overview

This repository contains a proof of concept implementation of a blockchain based royalty settlement framework proposed in the research paper:

From Public Evidence to Reproducible Royalty Settlement: A Rights-Aware Approach.

The system addresses transparency and reconciliation issues in digital royalty distribution by introducing an evidence centric settlement architecture built on Ethereum compatible smart contracts.

In many creative industries such as music, media, and digital publishing, royalty payments are fragmented across platforms and depend on opaque usage reports. This lack of transparency slows settlement and often leads to disputes between creators, platforms, and intermediaries.

The proposed approach enables independent verification of royalty payouts by publishing a minimal bundle of verifiable evidence on chain, while sensitive usage data remains off chain. This evidence bundle allows third parties to reconstruct settlement outcomes without accessing private operational systems.

The prototype implements a four layer architecture consisting of asset registration, license governance, royalty settlement, and audit compliance.

System Architecture

The architecture follows the four layer rights aware design described in the research model.

Asset Layer
Responsible for registering creative works and storing immutable identifiers for each asset.

Licensing Layer
Handles machine readable license policies including royalty rates and validator approval quorum.

Royalty and Payment Layer
Processes usage submissions and automatically distributes royalties to asset owners.

Audit and Governance Layer
Anchors compliance evidence and provides dispute resolution mechanisms.

Together these layers generate a compact evidence bundle consisting of

terms hash
signer set
usage key
allocation hash
payout receipts

This bundle enables independent reconstruction of royalty settlements from public records.

Repository Structure

contracts/

AssetRegistry.sol
Registers creative assets as NFTs and stores ownership information.

LicenseTerms.sol
Manages machine readable license terms and validator approvals.

RoyaltyEngine.sol
Processes usage reports and executes royalty payments.

AuditCompliance.sol
Anchors audit bundles and manages compliance verification.

TestUSD.sol
ERC20 token used to simulate royalty payments.

scripts/

simulate.js
Runs end to end simulation of the royalty settlement cycle and records gas usage.

gas_usage_royalty.csv
Dataset generated from simulation runs.

Core Smart Contracts

AssetRegistry

The AssetRegistry contract represents the asset layer of the system. It registers creative works and mints NFTs representing ownership of those works.

Main responsibilities

register creative assets
store immutable content hashes
manage ownership records
provide owner lookup for royalty payouts

Key functions

mintAsset
ownerOf
grantRole

LicenseTerms

LicenseTerms governs the lifecycle of licensing policies.

Creators propose machine readable license terms containing royalty rates and metadata references. Validators review the proposal and approve it until the required quorum is reached.

Once approved the license terms become active and are enforced by the royalty engine.

Key functions

proposeTerms
approveTerms
publishTerms
rateOf
isActive

RoyaltyEngine

RoyaltyEngine implements the royalty settlement cycle.

Platforms or distributors submit usage reports containing the number of units consumed for a given asset. The contract calculates the royalty amount using the active rate and automatically transfers the payout to the asset owner.

Key responsibilities

receive funding from platforms
process usage submissions
calculate royalty amounts
execute ERC20 payouts
emit settlement receipts

Key functions

fund
submitUsage
quoteRoyalty

AuditCompliance

AuditCompliance provides the audit and governance layer.

The contract records audit bundles containing hashes of usage data, allocation vectors, and payout records. Regulators or auditors can mark compliance status or open disputes.

Key features

audit bundle anchoring
regulatory compliance marking
dispute initiation and resolution
audit trail preservation

Simulation Workflow

The simulation script simulate.js demonstrates the full royalty lifecycle.

Step 1
Deploy all smart contracts.

Step 2
Assign system roles including creator, validator, and DSP reporter.

Step 3
Mint a creative asset NFT.

Step 4
Propose and approve license terms.

Step 5
Fund the royalty engine with ERC20 tokens.

Step 6
Submit multiple usage reports.

Step 7
Automatically distribute royalties to the asset owner.

The script executes one hundred usage transactions and records gas consumption metrics for each transaction.

The following metrics are exported to a CSV file

usage units
royalty amount
gas used
gas price
transaction cost
transaction hash

This dataset can be used to analyze settlement cost efficiency.

Deterministic Royalty Cycle

The settlement process follows a deterministic algorithm.

1 Creator registers an asset and publishes license terms
2 Validators approve the license policy
3 Platforms deposit funds into the royalty engine
4 Platforms submit usage reports
5 The engine calculates royalty = units × rate
6 The engine transfers ERC20 payouts to the asset owner
7 Settlement receipts are emitted for audit reconstruction

This design ensures that each usage report produces exactly one payout and prevents double counting.

Evidence Based Auditability

Each settlement produces verifiable events that form an evidence trail.

UsageSubmitted
AllocationComputed
PayoutExecuted
ComplianceReportReady

These events allow external auditors to reconstruct royalty allocations and verify payouts without accessing internal usage logs.

Technology Stack

Solidity 0.8.x
Ethereum Virtual Machine
OpenZeppelin Contracts
Hardhat Development Framework
Node.js simulation environment

ERC20 tokens are used for royalty payments and NFTs represent creative assets.

Experimental Objective

This prototype evaluates three core properties of the proposed architecture.

Reproducibility
Royalty settlements can be reconstructed exactly from public receipts.

Auditability
Third parties can verify payments using the minimal evidence bundle.

Deterministic execution
Settlement results do not depend on execution order or platform specific logic.

The prototype demonstrates how blockchain based licensing systems can produce audit ready settlement records while preserving privacy of usage data.

Future Work

Future extensions of the system may include

zero knowledge proof integration for private usage verification
multi recipient royalty splits
integration with industry metadata standards such as DDEX and ISRC
deployment on low fee Layer 2 networks for production environments

License

This repository is intended for research and educational purposes related to blockchain based digital rights management and royalty settlement systems.
