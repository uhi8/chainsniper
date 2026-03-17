# ChainSniper 2.0: The Agentic Intent Engine 🎯🧬

This document outlines the transition from simple automation to a competitive, agent-first execution layer.

## 🚀 The 2.0 Vision
Transform ChainSniper from a "Price Trigger" into a **Competitive Intent Marketplace**.

### 1. Reputation-Based Priority (ERC-8004)
- **Identity Matters**: If multiple snipers target the same price, the **Highest Reputation Agent** is executed first. This kills anonymous sandwich bots.

### 2. Priority Boosting (x402)
- **Intent Bidding**: Agents can attach an **x402 Micropayment** on L1 to "boost" their order to the front of the queue on L2.

### 3. Piggyback Execution
- **Zero-Gas Sniping**: The Hook watches swaps from other users. If a large trade pushes price into a sniper's range, the sniper's trade "piggybacks" inside that same transaction.

---

## 🏗️ Architecture
- **Monitor**: Listens for L1 x402 payments and reputation scores.
- **Hook**: Sorts intent buckets by `(Reputation + Priority)` and executes in `beforeSwap`.

---
*UHI8 Evolution Track*
