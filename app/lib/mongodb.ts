import { MongoClient } from "mongodb";

const uri = 'mongodb://mongodb:27017/afba'

export const client = new MongoClient(uri)

export const database = client.db('afba')

export const transactions = database.collection('transactions')

export const transactionsSync = database.collection('transactionSync')

export const categories = database.collection('categories')

export const users = database.collection('users')

export const accounts = database.collection('accounts')

export const scheduledTransactions = database.collection('scheduledTransactions')

export const streamOverrides = database.collection('streamOverrides')

export const aiSettings = database.collection('aiSettings')

export const aiConversations = database.collection('aiConversations')

export const paySchedules = database.collection('paySchedules')

export const forecastSettings = database.collection('forecastSettings')

export const forecastSnapshots = database.collection('forecastSnapshots')
