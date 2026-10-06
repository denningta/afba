#!/usr/bin/env node
// One-time cleanup of transaction documents saved back from the transactions
// list, which used to replace whole documents with what the list returned:
//   - dates stored as MM/DD/YYYY go back to YYYY-MM-DD (Plaid's format)
//   - list-only fields (isoDate, month, account) are removed
//
//   docker exec afba node scripts/migrate-transactions.mjs --dry-run
//   docker exec afba node scripts/migrate-transactions.mjs
//
// Safe to run more than once: a second run finds nothing to change. Back up
// the database first (see README, Production Workflow).
import { MongoClient } from "mongodb"

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://mongodb:27017/afba"
const dryRun = process.argv.includes("--dry-run")

// The computed fields the list adds; never part of a stored transaction.
const LIST_ONLY_FIELDS = ["isoDate", "month", "account"]
const SLASH_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

const client = new MongoClient(MONGO_URI)
try {
  const transactions = client.db("afba").collection("transactions")

  const slashDated = await transactions.find({ date: SLASH_DATE }, { projection: { date: 1 } }).toArray()
  const withListFields = await transactions.countDocuments({ $or: LIST_ONLY_FIELDS.map(field => ({ [field]: { $exists: true } })) })
  const total = await transactions.estimatedDocumentCount()

  console.log(`${total} transactions`)
  console.log(`${slashDated.length} with MM/DD/YYYY dates`)
  console.log(`${withListFields} with list-only fields (${LIST_ONLY_FIELDS.join(", ")})`)

  if (dryRun) {
    const sample = slashDated.slice(0, 3).map(({ date }) => `${date} -> ${toISO(date)}`)
    if (sample.length) console.log(`e.g. ${sample.join(", ")}`)
    console.log("Dry run: nothing changed.")
  } else {
    if (slashDated.length) {
      const res = await transactions.bulkWrite(slashDated.map(({ _id, date }) => ({
        updateOne: { filter: { _id, date }, update: { $set: { date: toISO(date) } } },
      })))
      console.log(`Fixed ${res.modifiedCount} dates.`)
    }
    if (withListFields) {
      const res = await transactions.updateMany(
        { $or: LIST_ONLY_FIELDS.map(field => ({ [field]: { $exists: true } })) },
        { $unset: Object.fromEntries(LIST_ONLY_FIELDS.map(field => [field, ""])) }
      )
      console.log(`Removed list-only fields from ${res.modifiedCount} transactions.`)
    }
    const left = await transactions.countDocuments({ date: { $type: "string", $not: /^\d{4}-\d{2}-\d{2}$/ } })
    console.log(left ? `${left} transactions still have a date that isn't YYYY-MM-DD; check them by hand.` : "All dates are YYYY-MM-DD.")
  }
} finally {
  await client.close()
}

function toISO(date) {
  const [, month, day, year] = SLASH_DATE.exec(date)
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
}
