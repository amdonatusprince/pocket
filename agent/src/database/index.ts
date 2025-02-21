// MongoDB
import { MongoDBDatabaseAdapter } from '@elizaos/adapter-mongodb';
import { MongoClient } from 'mongodb';


export function initializeDatabase() {
  if (process.env.MONGODB_URI) {
    const client = new MongoClient(process.env.MONGODB_URI);
    const db = new MongoDBDatabaseAdapter(
        client,
        process.env.MONGODB_DB
    );
    return db;
}
throw new Error("No database setup found");
}
