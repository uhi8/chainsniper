# ChainSniper Deployment Guide

## Current Architecture Status

ChainSniper uses a **Hybrid Autonomy** model:
- ✅ **Execution**: Fully autonomous (contract-driven)
- ⚠️ **Registration**: Requires automation script (due to Reactive Network limitations)

---

## Deployment Options

### Option 1: Serverless Deployment (Recommended for Production)

Deploy the `auto_register.ts` script to a serverless platform that runs 24/7.

#### A. Railway.app (Easiest)

1. **Create `Dockerfile`** in `frontend/`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npx", "tsx", "scripts/auto_register.ts"]
```

2. **Create `railway.json`**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npx tsx scripts/auto_register.ts",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

3. **Deploy**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

4. **Set Environment Variables** in Railway Dashboard:
   - `DEPLOYER_PRIVATE_KEY`
   - `L2_SNIPER_HOOK_ADDRESS`
   - `L1_REACTIVE_MONITOR_ADDRESS`

**Cost**: ~$5/month

---

#### B. Render.com (Alternative)

1. **Create `render.yaml`**:
```yaml
services:
  - type: worker
    name: chainsniper-auto-register
    env: node
    buildCommand: cd frontend && npm install
    startCommand: cd frontend && npx tsx scripts/auto_register.ts
    envVars:
      - key: DEPLOYER_PRIVATE_KEY
        sync: false
      - key: L2_SNIPER_HOOK_ADDRESS
        value: 0x699C19321188aB200194E8A2B6db19B43106E70F
      - key: L1_REACTIVE_MONITOR_ADDRESS
        value: 0xEc6db17C3A82B70352E856e0f0c3Cd1d3108F1c9
```

2. **Deploy**: Connect your GitHub repo to Render

**Cost**: Free tier available

---

### Option 2: VPS Deployment (More Control)

Deploy to a Virtual Private Server (DigitalOcean, AWS EC2, etc.)

1. **Install Node.js** on server:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Clone and Setup**:
```bash
git clone <your-repo>
cd chainsniper/frontend
npm install
```

3. **Create systemd service** (`/etc/systemd/system/chainsniper.service`):
```ini
[Unit]
Description=ChainSniper Auto-Register
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/chainsniper/frontend
ExecStart=/usr/bin/npx tsx scripts/auto_register.ts
Restart=always
RestartSec=10
Environment="DEPLOYER_PRIVATE_KEY=0x..."
Environment="L2_SNIPER_HOOK_ADDRESS=0x699C19321188aB200194E8A2B6db19B43106E70F"
Environment="L1_REACTIVE_MONITOR_ADDRESS=0xEc6db17C3A82B70352E856e0f0c3Cd1d3108F1c9"

[Install]
WantedBy=multi-user.target
```

4. **Start Service**:
```bash
sudo systemctl enable chainsniper
sudo systemctl start chainsniper
sudo systemctl status chainsniper
```

**Cost**: ~$5-10/month (DigitalOcean Droplet)

---

### Option 3: Local Development (Current Setup)

Keep running `npx tsx scripts/auto_register.ts` on your laptop.

**Pros**: Free, full control
**Cons**: Must keep laptop running 24/7

---

## Frontend Deployment

Deploy the Next.js frontend separately:

### Vercel (Recommended)

```bash
cd frontend
vercel --prod
```

### Netlify

```bash
cd frontend
npm run build
netlify deploy --prod --dir=.next
```

---

## Security Best Practices

### 1. Use Dedicated Wallet
Create a new wallet specifically for the auto-register script with minimal funds:
```bash
# Generate new wallet
cast wallet new

# Fund with ~0.1 ETH on Reactive Network (for gas)
```

### 2. Environment Variables
**Never commit** `.env` to Git. Use platform-specific secret management:
- Railway: Environment Variables tab
- Render: Secret Files
- VPS: systemd environment or `.env` with restricted permissions

### 3. Monitoring
Add health checks to `auto_register.ts`:
```typescript
// Add after line 64
setInterval(() => {
    console.log(`[${new Date().toISOString()}] ✅ Agent Running`)
}, 60000) // Log every minute
```

---

## Future: Full Autonomy

Once Reactive Network adds Unichain support:

1. **Uncomment subscription** in `ReactiveL1Monitor.sol` (lines 104-112)
2. **Redeploy** L1 Monitor
3. **Shut down** auto-register script
4. **Delete** server/service

The system will be **100% contract-native** with zero infrastructure costs.

---

## Quick Start (Railway)

```bash
# 1. Create Dockerfile
cat > frontend/Dockerfile << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npx", "tsx", "scripts/auto_register.ts"]
EOF

# 2. Deploy
cd frontend
railway login
railway init
railway up

# 3. Set secrets in Railway dashboard
# DEPLOYER_PRIVATE_KEY, L2_SNIPER_HOOK_ADDRESS, L1_REACTIVE_MONITOR_ADDRESS
```

**Done!** Your auto-register agent is now running 24/7.
