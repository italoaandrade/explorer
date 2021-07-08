const poll = true
const fetchInterval = 10 * 1000

let perPage = 100
try {
  const cached = Number(localStorage.getItem('perPage'))
  if (cached) {
    perPage = cached
  }
} catch (err) {
  console.error(err)
}

const app = new Vue({
  el: '#app',
  data: {
    perPage,
    page: 0,
    allTransfers: [],
    transfers: []
  },
  computed: {
    hasPreviousPage () {
      return this.page > 0
    },
    hasNextPage () {
      return this.page < (this.allTransfers.length / this.perPage) - 1
    }
  },
  methods: {
    refreshTransfers () {
      const start = this.page * this.perPage
      const end = start + this.perPage
      Vue.set(app, 'transfers', this.allTransfers.slice(start, end))

      updateChart(app.transfers)
    },
    updateTransfers (transfers) {
      Vue.set(app, 'allTransfers', transfers)
      this.refreshTransfers()
    },
    previousPage () {
      Vue.set(app, 'page', Math.max(this.page - 1, 0))
      this.refreshTransfers()
    },
    nextPage () {
      Vue.set(app, 'page', Math.min(this.page + 1, Math.floor(this.allTransfers.length / this.perPage)))
      this.refreshTransfers()
    },
    setPerPage (event) {
      const value = event.target.value
      const perPage = Number(value)
      Vue.set(app, 'perPage', perPage)
      try {
        localStorage.setItem('perPage', perPage)
      } catch (err) {
        console.error(err)
      }
      this.refreshTransfers()
    }
  }
})

const chainToIndexMapSource = {
  xdai: 1,
  polygon: 2,
  optimism: 2,
  ethereum: 0
}

const chainToIndexMapDestination = {
  ethereum: 3,
  xdai: 4,
  optimism: 5,
  polygon: 5
}

const chainIdToSlugMap = {
  1: 'ethereum',
  42: 'ethereum',
  69: 'optimism',
  77: 'xdai',
  100: 'xdai',
  137: 'polygon'
}

const chainSlugToNameMap = {
  ethereum: 'Ethereum',
  xdai: 'xDai',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism'
}

const colorsMap = {
  ethereum: '#868dac',
  arbitrum: '#97ba4c',
  optimism: '#97ba4c',
  xdai: '#46a4a1',
  polygon: '#8b57e1',
  fallback: '#9f9fa3'
}

const chainLogosMap = {
  ethereum: 'https://s3.us-west-1.amazonaws.com/assets.hop.exchange/logos/ethereum.svg',
  xdai: 'https://s3.us-west-1.amazonaws.com/assets.hop.exchange/logos/xdai.svg',
  polygon: 'https://s3.us-west-1.amazonaws.com/assets.hop.exchange/logos/polygon.svg'
}

const tokenLogosMap = {
  USDC: 'https://s3.us-west-1.amazonaws.com/assets.hop.exchange/logos/usdc.svg'
}

function explorerLink (chain, transactionHash) {
  let base = ''
  if (chain === 'xdai') {
    base = 'https://blockscout.com/xdai/mainnet'
  } else if (chain === 'polygon') {
    base = 'https://polygonscan.com'
  } else {
    base = 'https://etherscan.io'
  }

  return `${base}/tx/${transactionHash}`
}

async function queryFetch (url, query, variables) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      query,
      variables: variables || {}
    })
  })
  const jsonRes = await res.json()
  return jsonRes.data
}

async function fetchTransfers (chain) {
  const queryL1 = `
    query TransferSentToL2 {
      transferSents: transferSentToL2S(
        first: 1000,
        orderBy: timestamp,
        orderDirection: desc
      ) {
        id
        destinationChainId
        amount
        transactionHash
        timestamp
      }
    }
  `
  const queryL2 = `
    query TransferSents {
      transferSents(
        first: 1000,
        orderBy: timestamp,
        orderDirection: desc
      ) {
        transferId
        destinationChainId
        amount
        transactionHash
        timestamp
      }
    }
  `
  let url = 'https://api.thegraph.com/subgraphs/name/hop-protocol/hop'
  let query = queryL1
  if (chain !== 'mainnet') {
    url = `${url}-${chain}`
    query = queryL2
  }
  const data = await queryFetch(url, query)
  return data.transferSents.map(x => {
    x.destinationChainId = Number(x.destinationChainId)
    return x
  })
}

async function fetchBonds (chain) {
  const query = `
    query WithdrawalBondeds {
      withdrawalBondeds(
        first: 1000,
        orderBy: timestamp,
        orderDirection: desc
      ) {
        id
        transferId
        transactionHash
      }
    }
  `
  let url = 'https://api.thegraph.com/subgraphs/name/hop-protocol/hop'
  if (chain !== 'mainnet') {
    url = `${url}-${chain}`
  }
  const data = await queryFetch(url, query)
  return data.withdrawalBondeds
}

async function updateData () {
  const data = []
  const [
    xdaiTransfers,
    polygonTransfers,
    mainnetTransfers
  ] = await Promise.all([
    fetchTransfers('xdai'),
    fetchTransfers('polygon'),
    fetchTransfers('mainnet')
  ])

  const [
    xdaiBonds,
    polygonBonds,
    mainnetBonds
  ] = await Promise.all([
    fetchBonds('xdai'),
    fetchBonds('polygon'),
    fetchBonds('mainnet')
  ])

  for (const x of xdaiTransfers) {
    data.push({
      sourceChain: 100,
      destinationChain: x.destinationChainId,
      amount: x.amount,
      transferId: x.transferId,
      transactionHash: x.transactionHash,
      timestamp: Number(x.timestamp)
    })
  }
  for (const x of polygonTransfers) {
    data.push({
      sourceChain: 137,
      destinationChain: x.destinationChainId,
      amount: x.amount,
      transferId: x.transferId,
      transactionHash: x.transactionHash,
      timestamp: Number(x.timestamp)
    })
  }
  for (const x of mainnetTransfers) {
    data.push({
      sourceChain: 1,
      destinationChain: x.destinationChainId,
      amount: x.amount,
      transferId: x.id,
      transactionHash: x.transactionHash,
      timestamp: Number(x.timestamp)
    })
  }

  for (const x of data) {
    x.bonded = false
  }

  const bondsMap = {
    xdai: xdaiBonds,
    polygon: polygonBonds,
    ethereum: mainnetBonds
  }

  for (const x of data) {
    const bonds = bondsMap[chainIdToSlugMap[x.destinationChain]]
    for (const bond of bonds) {
      if (bond.transferId === x.transferId) {
        x.bonded = true
        x.bondTransactionHash = bond.transactionHash
        continue
      }
    }
  }

  const populatedData = data.filter(x => x.destinationChain && x.transferId)
    .sort((a, b) => a.timestamp < b.timestamp)
    .map(populateTransfer)

  app.updateTransfers(populatedData)

  try {
    localStorage.setItem('data', JSON.stringify(populatedData))
  } catch (err) {
    console.error(err)
  }

  return populatedData
}

function populateTransfer (x, i) {
  x.index = i

  const t = luxon.DateTime.fromSeconds(x.timestamp)
  x.isoTimestamp = t.toISO()
  x.relativeTimestamp = t.toRelative()

  x.sourceChainSlug = chainIdToSlugMap[x.sourceChain]
  x.destinationChainSlug = chainIdToSlugMap[x.destinationChain]

  x.sourceChainName = chainSlugToNameMap[x.sourceChainSlug]
  x.destinationChainName = chainSlugToNameMap[x.destinationChainSlug]

  x.sourceChainImageUrl = chainLogosMap[x.sourceChainSlug]
  x.destinationChainImageUrl = chainLogosMap[x.destinationChainSlug]

  x.sourceTxExplorerUrl = explorerLink(x.sourceChainSlug, x.transactionHash)
  x.bondTxExplorerUrl = x.bondTransactionHash ? explorerLink(x.destinationChainSlug, x.bondTransactionHash) : ''

  const tokenDecimals = 6
  x.formattedAmount = ethers.utils.formatUnits(x.amount, tokenDecimals)
  x.token = 'USDC'
  x.tokenImageUrl = tokenLogosMap[x.token]

  return x
}

async function updateChart (data) {
  const links = data.map(x => {
    return {
      source: chainToIndexMapSource[x.sourceChainSlug],
      target: chainToIndexMapDestination[x.destinationChainSlug],
      value: 1
    }
  })

  const graph = {
    nodes: [
      { node: 0, name: 'Ethereum', id: 'ethereum' },
      { node: 1, name: 'xDai', id: 'xdai' },
      // {"node":1,"name":"Optimism", "id": "optimism"},
      { node: 2, name: 'Polygon', id: 'polygon' },

      { node: 3, name: 'Ethereum', id: 'ethereum' },
      { node: 4, name: 'xDai', id: 'xdai' },
      // {"node":4,"name":"Optimism", "id": "optimism"},
      { node: 5, name: 'Polygon', id: 'polygon' }
    ],
    links: links
  }

  const render = () => {
    d3.select('#chart svg').remove()
    const chart = d3.select('#chart').append('svg').chart('Sankey.Path')
    chart
      .name(label)
      .colorNodes(function (name, node) {
        return color(node, 1) || colorsMap.fallback
      })
      .colorLinks(function (link) {
        return color(link.source, 4) || color(link.target, 1) || colorsMap.fallback
      })
      .nodeWidth(15)
      .nodePadding(10)
      .spread(true)
      .iterations(0)
      .draw(graph)

    function label (node) {
      return node.name.replace(/\s*\(.*?\)$/, '')
    }

    function color (node, depth) {
      const id = node.id.replace(/(_score)?(_\d+)?$/, '')
      if (colorsMap[id]) {
        return colorsMap[id]
      } else if (depth > 0 && node.targetLinks && node.targetLinks.length === 1) {
        return color(node.targetLinks[0].source, depth - 1)
      } else {
        return null
      }
    }
  }

  render()

  window.removeEventListener('resize', render)
  window.addEventListener('resize', render)
}

async function main () {
  try {
    const data = JSON.parse(localStorage.getItem('data'))
    if (data) {
      app.updateTransfers(data)
      await updateChart(app.transfers)
    }
  } catch (err) {
    console.error(err)
  }

  updateData()
  if (poll) {
    while (true) {
      await new Promise((resolve) => setTimeout(() => resolve(null), fetchInterval))
      await updateData()
      await updateChart(app.transfers)
    }
  }
}

main()
