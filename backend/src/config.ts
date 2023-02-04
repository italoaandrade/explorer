require('dotenv').config()

export const network = process.env.NETWORK || 'mainnet'
export const isGoerli = network === 'goerli'
export const port = Number(process.env.PORT || 3000)
export const ipRateLimitReqPerSec = Number(process.env.IP_RATE_LIMIT_REQ_PER_SEC || 100)
export const ipRateLimitWindowMs = Number(process.env.IP_RATE_LIMIT_WINDOW_MS || 1 * 1000)
export const postgresConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DBNAME,
  password: process.env.POSTGRES_PASS,
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
  maxConnections: process.env.POSTGRES_MAX_CONNECTIONS ? parseInt(process.env.POSTGRES_MAX_CONNECTIONS, 10) : 10
}

let enabledTokens = ['USDC', 'USDT', 'DAI', 'MATIC', 'ETH', 'WBTC', 'HOP', 'SNX']
let enabledChains = ['ethereum', 'gnosis', 'polygon', 'arbitrum', 'optimism', 'nova']

if (isGoerli) {
  enabledTokens = ['USDC', 'ETH']
  enabledChains = ['ethereum', 'polygon', 'optimism']
}

export { enabledTokens, enabledChains }

export const rpcUrls = {
  gnosis: process.env.GNOSIS_RPC,
  polygon: process.env.POLYGON_RPC,
  arbitrum: process.env.ARBITRUM_RPC,
  optimism: process.env.OPTIMISM_RPC,
  ethereum: process.env.ETHEREUM_RPC,
  nova: process.env.NOVA_RPC
}

export const transferTimes = {
  ethereum: {
    optimism: 10,
    arbitrum: 16,
    polygon: 25,
    gnosis: 5,
    nova: 16
  },
  optimism: {
    ethereum: 1,
    arbitrum: 1,
    polygon: 1,
    gnosis: 1,
    nova: 1
  },
  arbitrum: {
    ethereum: 1,
    optimism: 1,
    polygon: 1,
    gnosis: 1,
    nova: 1
  },
  polygon: {
    ethereum: 5,
    optimism: 5,
    arbitrum: 5,
    gnosis: 5,
    nova: 5
  },
  gnosis: {
    ethereum: 1,
    optimism: 1,
    arbitrum: 1,
    polygon: 1,
    nova: 1
  },
  nova: {
    ethereum: 1,
    optimism: 1,
    arbitrum: 1,
    polygon: 1,
    gnosis: 1
  }
}
