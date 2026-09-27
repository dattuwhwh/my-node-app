import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const envPath = fileURLToPath(
    new URL('./.env', import.meta.url)
);

dotenv.config({
    path: envPath
});

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

console.log(`[INFO] MONGO_URI: ${uri}`);
console.log(`[INFO] MONGO_DB: ${dbName}`);

const client = new MongoClient(uri);

let db;

export async function connectDB() {
    await client.connect();

    db = client.db(dbName);

    await db.command({
        ping: 1
    });

    console.log('[INFO] MongoDB подключена');
    console.log(`[INFO] База данных: ${dbName}`);

    return db;
}

export function getDB() {
    if (!db) {
        throw new Error('MongoDB не подключена');
    }

    return db;
}

export async function closeDB() {
    await client.close();
}