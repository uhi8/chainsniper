# ChainSniper Frontend

The ChainSniper dashboard for creating and monitoring cross-chain Uniswap V4 limit orders.

## 🚀 Features
- **Live Price Feed**: Real-time ETH/USD prices from Chainlink.
- **Order Management**: Create, view, and cancel limit orders on Unichain Sepolia.
- **Activity Log**: Watch live autonomous fulfillment events as they happen.
- **Wallet Integration**: Powered by Wagmi/Viem.

## 🛠️ Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env.local` or update the root `.env`:
   - `NEXT_PUBLIC_L2_SNIPER_HOOK_ADDRESS=0xa05d7F26b8BBc7166f5a60e8f415f22D5D9209B1`
   - `NEXT_PUBLIC_L1_REACTIVE_MONITOR_ADDRESS=0x78240fD4Ac1Ea8b311e866f0e513c9F49f9c42C7`

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Run Automation Agents** (Required for demo):
   ```bash
   # Terminals for registration, pricing, and relaying
   npx tsx scripts/auto_register.ts
   npx tsx scripts/price_monitor.ts
   npx tsx scripts/execution_relay.ts
   ```

## 🧪 Demo Mode
To manually move the price and trigger orders:
```bash
npx tsx scripts/set_demo_price.ts 2100
```
