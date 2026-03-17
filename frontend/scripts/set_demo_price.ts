import fs from 'fs'
import path from 'path'

const filePath = path.resolve(__dirname, 'demo_price.json')
const arg = process.argv[2]

if (!arg || arg === '--help') {
    console.log('Usage: npx tsx scripts/set_demo_price.ts <price|real>')
    console.log('Example: npx tsx scripts/set_demo_price.ts 2250.50')
    console.log('Example: npx tsx scripts/set_demo_price.ts real    (returns to Chainlink)')
    process.exit(0)
}

if (arg.toLowerCase() === 'real') {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log('✅ Demo Price Cleared. Returning to Real-time Chainlink feed...')
    } else {
        console.log('ℹ️ Already in Real-time mode.')
    }
} else {
    const price = parseFloat(arg)
    if (isNaN(price)) {
        console.error('❌ Error: Invalid price provided.')
        process.exit(1)
    }

    fs.writeFileSync(filePath, JSON.stringify({ price, updatedAt: Date.now() }))
    console.log(`✅ Demo Price set to $${price}`)
    console.log('📊 The Price Monitor will pick this up on its next poll (10s).')
}
