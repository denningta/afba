import { MongoClient } from "mongodb";

const uri = 'mongodb://mongodb:27017/afba'

export const client = new MongoClient(uri)

export const database = client.db('afba')

