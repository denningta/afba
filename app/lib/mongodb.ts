import { MongoClient } from "mongodb";

const uri = 'mongodb://mongodb:27017/afba'

export const client = new MongoClient(uri)

export const database = client.db('afba')

export const transactions = database.collection('transactions')

export const transactionsSync = database.collection('transactionSync')

export const categories = database.collection('categories')

export const users = database.collection('users')
