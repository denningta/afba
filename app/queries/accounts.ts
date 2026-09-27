import { AnyBulkWriteOperation, Document } from "mongodb"
import { AccountBase } from "plaid"
import plaidClient from "@/app/lib/plaid"
import { accounts, transactions, transactionsSync, users } from "@/app/lib/mongodb"
import { listUser, User } from "./users"
import { Account, MANUAL_ACCOUNT_ID } from "../interfaces/account"

export const USER_ID = 'root-user'

/**
 * Stages that attach `account` (name, mask, type, subtype) to transaction docs
 * that still have their `account_id`.
 */
export const accountJoinStages: Document[] = [
  {
    $lookup: {
      from: "accounts",
      localField: "account_id",
      foreignField: "account_id",
      pipeline: [
        { $project: { _id: 0, name: 1, mask: 1, type: 1, subtype: 1 } }
      ],
      as: "account"
    }
  },
  {
    $set: {
      account: { $first: "$account" }
    }
  }
]

/**
 * Pulls account metadata from Plaid into the local `accounts` collection.
 * `includeInBudget` is only set on insert so a refresh never overwrites the
 * user's saved choice.
 */
export async function refreshAccounts() {
  const user = await listUser({ userId: USER_ID }) as User | null
  const updatedAt = new Date().toISOString()

  const itemResponses = await Promise.all(
    (user?.items ?? []).map(async ({ plaidAccessToken }) => {
      try {
        const res = await plaidClient.accountsGet({ access_token: plaidAccessToken })
        return res.data
      } catch (err: any) {
        // One broken item (e.g. ITEM_LOGIN_REQUIRED) shouldn't block the rest.
        console.error('accountsGet failed', err?.response?.data ?? err)
        return null
      }
    })
  )

  const ops: AnyBulkWriteOperation[] = itemResponses.flatMap((data) =>
    !data ? [] : data.accounts.map((account) => ({
      updateOne: {
        filter: { account_id: account.account_id },
        update: {
          $set: {
            item_id: data.item.item_id,
            name: account.name,
            official_name: account.official_name,
            mask: account.mask,
            type: account.type,
            subtype: account.subtype,
            institution_id: data.item.institution_id,
            institutionName: data.item.institution_name,
            currentBalance: account.balances.current ?? account.balances.available ?? null,
            updatedAt
          },
          $setOnInsert: { includeInBudget: true }
        },
        upsert: true
      }
    }))
  )

  ops.push({
    updateOne: {
      filter: { account_id: MANUAL_ACCOUNT_ID },
      update: {
        $set: { name: 'Manual / Imported', type: 'manual', subtype: 'manual', updatedAt },
        $setOnInsert: { includeInBudget: true }
      },
      upsert: true
    }
  })

  await accounts.bulkWrite(ops)

  return findAccounts()
}

async function findAccounts() {
  const res = await accounts
    .aggregate<Account>([
      { $set: { _id: { $toString: "$_id" }, isManual: { $eq: ["$account_id", MANUAL_ACCOUNT_ID] } } },
      { $sort: { isManual: 1, institutionName: 1, name: 1 } },
      { $unset: "isManual" }
    ])
    .toArray()

  return res
}

export async function listAccounts() {
  const res = await findAccounts()
  if (res.length) return res
  return refreshAccounts()
}

export async function setIncludeInBudget(account_id: string, includeInBudget: boolean) {
  const res = await accounts.updateOne({ account_id }, { $set: { includeInBudget } })
  return res
}

/**
 * Stages to prepend to any transactions `$lookup` pipeline that feeds budget
 * totals. Returns no stages when every account is included, so transactions
 * from since-unlinked accounts still count in that (default) case.
 */
export async function getBudgetAccountMatch(): Promise<Document[]> {
  const all = await listAccounts()
  if (all.every((a) => a.includeInBudget)) return []

  const includedIds = all
    .filter((a) => a.includeInBudget && a.account_id !== MANUAL_ACCOUNT_ID)
    .map((a) => a.account_id)
  const manualIncluded = all.some((a) => a.account_id === MANUAL_ACCOUNT_ID && a.includeInBudget)

  return [{
    $match: {
      $or: [
        { account_id: { $in: includedIds } },
        ...manualIncluded ? [{ account_id: { $exists: false } }, { account_id: null }] : []
      ]
    }
  }]
}

/**
 * Re-linking a login that's already connected creates a second Plaid item with
 * new account_ids for the same real accounts, so duplicates are matched on
 * institution + mask + subtype rather than id.
 */
export async function findDuplicateAccounts(
  institution_id: string | null | undefined,
  newAccounts: AccountBase[],
  newItemId: string
) {
  if (!institution_id) return []

  await refreshAccounts()
  const user = await listUser({ userId: USER_ID }) as User | null
  const linkedItemIds = (user?.items ?? [])
    .map((item) => item.item_id)
    .filter((id) => id !== newItemId)

  const existing = await accounts
    .find<Account>({ institution_id, item_id: { $in: linkedItemIds } })
    .toArray()

  return newAccounts.filter((account) =>
    existing.some((e) => e.mask === account.mask && e.subtype === account.subtype)
  )
}

const GONE_ITEM_ERRORS = new Set(['ITEM_NOT_FOUND', 'INVALID_ACCESS_TOKEN'])

/**
 * Disconnects a Plaid item (a bank login and all of its accounts) and removes
 * its local account cache and sync cursors. Transactions are kept unless
 * `deleteTransactions` is set, since they usually carry categorisation work.
 */
export async function removeItem(item_id: string, deleteTransactions = false) {
  const user = await listUser({ userId: USER_ID }) as User | null
  const item = user?.items?.find((i) => i.item_id === item_id)
  if (!user || !item) return null

  const cached = await accounts.find<Account>({ item_id }).toArray()
  const accountIds = new Set(cached.map((a) => a.account_id))

  try {
    // The cache may predate the last refresh, so ask Plaid too.
    const res = await plaidClient.accountsGet({ access_token: item.plaidAccessToken })
    res.data.accounts.forEach((a) => accountIds.add(a.account_id))
  } catch {
    // Item may already be broken or gone; the cache is the best we have.
  }

  try {
    await plaidClient.itemRemove({ access_token: item.plaidAccessToken })
  } catch (err: any) {
    // Already removed on Plaid's side - still clean up locally.
    if (!GONE_ITEM_ERRORS.has(err?.response?.data?.error_code)) throw err
  }

  const ids = Array.from(accountIds)

  await users.updateOne({ _id: user._id }, { $pull: { items: { item_id } } } as Document)
  await accounts.deleteMany({ item_id })
  await transactionsSync.deleteMany({ account_id: { $in: ids } })
  const deleted = deleteTransactions
    ? (await transactions.deleteMany({ account_id: { $in: ids } })).deletedCount
    : 0

  return { item_id, removedAccountIds: ids, deletedTransactions: deleted }
}
