import { ObjectId } from "mongodb"
import { users } from "../lib/mongodb"

export interface User {
  _id?: ObjectId
  userId?: string
  plaidAccessToken?: string
  items?: {
    item_id: string
    plaidAccessToken: string
  }[]
}

export async function listUser(filter: User) {
  const res = await users.findOne(filter)
  return res
}

export async function replaceUser(filter: User, replacement: User) {
  filter._id = new ObjectId(filter._id)

  const {
    _id,
    ...rest
  } = replacement

  const res = await users
    .replaceOne(
      filter,
      rest,
    )

  return res
}

export async function insertUser(user: User) {
  const res = await users
    .insertOne(user)

  return res
}

export async function deleteUser(query: User) {
  if (query._id) {
    query._id = new ObjectId(query._id)
  }

  const res = await users
    .deleteOne(query)

  return res
}

