#!/usr/bin/env node
// Lockout recovery: set a user's password (and optionally make them an admin)
// straight in the database, e.g. when the only admin forgot theirs.
//
//   docker exec -it afba node scripts/reset-password.mjs you@example.com [--admin]
//
// Prompts for the new password without echoing it, and signs the user out
// everywhere. Plain .mjs so it runs in the production image, where there is no
// TypeScript tooling, and it only needs `mongodb`, which the app already ships.
import { randomBytes, scrypt } from "node:crypto"
import { createInterface } from "node:readline"
import { MongoClient } from "mongodb"

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://mongodb:27017/afba"
const MIN_LENGTH = 8

// Better Auth's password hash (@better-auth/utils/password): scrypt with these
// parameters, stored as "<salt hex>:<key hex>". Keep in step if it changes.
const SCRYPT = { N: 16384, r: 16, p: 1, dkLen: 64 }
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  return new Promise((resolve, reject) => scrypt(
    password.normalize("NFKC"), salt, SCRYPT.dkLen,
    { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 128 * SCRYPT.N * SCRYPT.r * 2 },
    (err, key) => err ? reject(err) : resolve(`${salt}:${key.toString("hex")}`)
  ))
}

const args = process.argv.slice(2)
const email = args.find(arg => !arg.startsWith("--"))?.trim().toLowerCase()
const makeAdmin = args.includes("--admin")

if (!email) {
  console.error("Usage: node scripts/reset-password.mjs <email> [--admin]")
  process.exit(1)
}

// One reader for every prompt: separate readline instances would each buffer
// ahead and swallow the next answer when input is piped in.
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY })
const lines = rl[Symbol.asyncIterator]()
let hiding = false
// Don't echo typed passwords (the prompt itself is written directly).
rl._writeToOutput = text => { if (!hiding) process.stdout.write(text) }

async function promptHidden(question) {
  process.stdout.write(question)
  hiding = true
  const { value = "" } = await lines.next()
  hiding = false
  process.stdout.write("\n")
  return value
}

const client = new MongoClient(MONGO_URI)
try {
  const db = client.db("afba")
  const user = await db.collection("authUsers").findOne({ email })
  if (!user) {
    const known = await db.collection("authUsers").find({}, { projection: { email: 1 } }).toArray()
    console.error(`No user with email ${email}. Users: ${known.map(u => u.email).join(", ") || "(none - open /setup instead)"}`)
    process.exit(1)
  }

  const password = await promptHidden("New password: ")
  if (password.length < MIN_LENGTH) {
    console.error(`Password must be at least ${MIN_LENGTH} characters.`)
    process.exit(1)
  }
  if (await promptHidden("Repeat it: ") !== password) {
    console.error("The passwords don't match.")
    process.exit(1)
  }

  const now = new Date()
  await db.collection("authAccounts").updateOne(
    { userId: user._id, providerId: "credential" },
    {
      $set: { password: await hashPassword(password), updatedAt: now },
      $setOnInsert: { accountId: user._id.toString(), createdAt: now },
    },
    { upsert: true }
  )
  const signedOut = await db.collection("authSessions").deleteMany({ userId: user._id })
  if (makeAdmin) {
    await db.collection("authUsers").updateOne({ _id: user._id }, { $set: { role: "admin", updatedAt: now } })
  }

  console.log(`Password updated for ${user.email}${makeAdmin ? ", now an admin" : ""}; ${signedOut.deletedCount} session(s) signed out.`)
} finally {
  rl.close()
  await client.close()
}
