# Hop Explorer Backend

> Backend indexer worker for explorer transfer data pull from the [TheGraph](https://thegraph.com/)

Dev

```sh
npm run dev
```

Serve

```sh
npm start
```

Build

```sh
npm run build
```

Docker build

```sh
make build-docker
```

Env vars

```sh
# (required) db connection
POSTGRES_USER=
POSTGRES_PASS=
POSTGRES_DBNAME=
POSTGRES_HOST=

# (required) rpc urls
NETWORK=mainnet
ETHEREUM_RPC=
GNOSIS_RPC=
POLYGON_RPC=
OPTIMISM_RPC=
ARBITRUM_RPC=
NOVA_RPC=
BASE_RPC=

# (optional) example
ENABLED_TOKENS=USDC,USDT,DAI,MATIC,ETH,WBTC,HOP,SNX,sUSD,rETH,MAGIC
ENABLED_CHAINS=ethereum,gnosis,polygon,arbitrum,optimism,nova,base
```

## Adding new tokens or chains

Update `@hop-protocol/core` version and push. By default all chains and tokens from core package will be enabled.

| Branch               | Docker Image
| ------------         | -------------------------------------
| `production-backend` | `hopprotocol/explorer-backend:latest`
| `goerli-backend`     | `hopprotocol/explorer-backend:goerli`

## License

[MIT](LICENSE)
