import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

dotenv.config()

const connectionString = process.env.AUTH_SERVICE_POSTGRES_URL

if (!connectionString) {
    throw new Error('Missing AUTH_SERVICE_POSTGRES_URL')
}

const pool = new Pool({
    connectionString
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
})

const connectDB = async () => {
    try {
        const connection = await prisma.$connect()
        console.log('Connected to the database')
    } catch (error) {
        console.error('Error connecting to the database:', error)
        process.exit(1)
    }
}

const disconnectDB = async () => {
    try {
        await prisma.$disconnect()
        console.log('Disconnected from the database')
    } catch (error) {
        console.error('Error disconnecting from the database:', error)
        process.exit(1)
    }
}

export {prisma, connectDB, disconnectDB}