import Db, { getInstance } from './Db'
import { DateTime } from 'luxon'

export class Controller {
  db : Db = getInstance()

  async getTransfers (params: any) {
    const ts = Date.now()
    console.time('transfers ' + ts)
    let page = Number(params.page || 0)
    let perPage = Number(params.perPage || 100)
    const sourceChainSlug = params.sourceChainSlug
    const destinationChainSlug = params.destinationChainSlug
    const token = params.token
    let bonded = params.bonded
    const bonderAddress = params.bonderAddress
    const accountAddress = params.accountAddress
    const amountFormatted = Number(params.amountFormatted)
    const amountFormattedCmp = params.amountFormattedCmp
    const amountUsd = Number(params.amountUsd)
    const amountUsdCmp = params.amountUsdCmp
    const transferId = params.transferId
    const startDate = params.startDate
    const endDate = params.endDate
    let sortBy = params.sortBy
    const sortDirection = params.sortDirection

    if (bonded === 'pending') {
      bonded = false
    }
    if (bonded === 'bonded') {
      bonded = true
    }

    if (page <= 0) {
      page = 0
    }

    if (perPage <= 0) {
      perPage = 0
    }

    if (perPage > 10000) {
      perPage = 10000
    }

    let startTimestamp :any
    if (startDate) {
      startTimestamp = Math.floor(DateTime.fromFormat(startDate, 'yyyy-MM-dd').startOf('day').toUTC().toSeconds())
    }

    let endTimestamp :any
    if (endDate) {
      endTimestamp = Math.floor(DateTime.fromFormat(endDate, 'yyyy-MM-dd').endOf('day').toUTC().toSeconds())
    }

    if (sortBy) {
      const sortBys :any = {
        amount: 'amount',
        amountUsd: 'amount_usd',
        source: 'source_chain_slug',
        destination: 'destination_chain_slug',
        account: 'account_address',
        bonder: 'bonder_address',
        bonded: 'bonded',
        bonderFee: 'bonder_fee',
        bonderFeeUsd: 'bonder_fee_usd',
        recipient: 'recipient_address',
        transferId: 'transfer_id',
        bondTimestamp: 'bond_timestamp',
        bondWithinTimestamp: 'bond_within_timestamp'
      }
      sortBy = sortBys[sortBy]
    }

    if (sortDirection) {
      if (!['desc', 'asc'].includes(sortDirection)) {
        throw new Error('invalid sort direction')
      }
    }

    const transfers = await this.db.getTransfers({
      page,
      perPage,
      sourceChainSlug,
      destinationChainSlug,
      token,
      bonded,
      bonderAddress,
      accountAddress,
      amountFormatted,
      amountFormattedCmp,
      amountUsd,
      amountUsdCmp,
      transferId,
      endTimestamp,
      startTimestamp,
      sortBy,
      sortDirection
    })
    const data = (transfers as any[]).map((x: any, i: number) => {
      x.sourceChainId = Number(x.sourceChainId)
      x.destinationChainId = Number(x.destinationChainId)
      x.amountFormatted = Number(x.amountFormatted)
      x.amountUsd = Number(x.amountUsd)
      x.deadline = x.deadline ? Number(x.deadline) : null
      x.bonderFeeFormatted = x.bonderFeeFormatted ? Number(x.bonderFeeFormatted) : null
      x.bonderFeeUsd = x.bonderFeeUsd ? Number(x.bonderFeeUsd) : null
      x.bondTimestamp = x.bondTimestamp ? Number(x.bondTimestamp) : null
      x.bondWithinTimestamp = x.bondWithinTimestamp ? Number(x.bondWithinTimestamp) : null
      x.tokenPriceUsd = x.tokenPriceUsd ? Number(x.tokenPriceUsd) : null
      x.timestamp = x.timestamp ? Number(x.timestamp) : null

      x.i = i
      x.bonded = !!x.bonded
      x.timestampRelative = DateTime.fromSeconds(x.timestamp).toRelative()
      x.receiveStatusUnknown = undefined
      x.preregenesis = false
      x.bondTimestampRelative = x.bondTimestamp ? DateTime.fromSeconds(x.bondTimestamp).toRelative() : ''
      return x
    })
    console.timeEnd('transfers ' + ts)
    return data
  }
}