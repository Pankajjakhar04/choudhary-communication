import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env') })

const uri = process.env.MONGO_URI
if (!uri) {
  console.error('MONGO_URI is not set. Copy .env.example to .env and fill values.')
  process.exit(1)
}

async function test() {
  try {
    await mongoose.connect(uri, { bufferCommands: false })
    console.log('Connected to MongoDB successfully')
    await mongoose.disconnect()
    process.exit(0)
  } catch (e) {
    console.error('MongoDB connection error:')
    console.error(e && e.message ? e.message : e)
    process.exit(1)
  }
}

test()
