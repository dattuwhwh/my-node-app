import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    heartbeatFrequencyMS: 5000
});

async function main() {
    try {
        console.log('=== Лабораторная работа №23 ===');
        console.log('Задание 1. Подключение к MongoDB');
        console.log(`Группа: ББМО-01-23`);
        console.log(`База данных: ${dbName}`);
        console.log();

        // События heartbeat
        client.on('serverHeartbeatSucceeded', () => {
            console.log('[HEARTBEAT] MongoDB доступна');
        });

        client.on('serverHeartbeatFailed', (event) => {
            console.log('[HEARTBEAT] Ошибка:', event.failure?.message);
        });

        // Подключение
        await client.connect();
        console.log('[OK] Подключение к MongoDB установлено');

        const db = client.db(dbName);

        // Проверка соединения
        const ping = await db.command({ ping: 1 });
        console.log('[OK] Ping:', ping);

        // Информация о сервере
        const buildInfo = await db.command({ buildInfo: 1 });

        console.log('\n=== Информация о сервере ===');
        console.log(`MongoDB: ${buildInfo.version}`);
        console.log(`База данных: ${dbName}`);

        // Список баз данных
        const adminDb = client.db('admin');
        const databases = await adminDb.admin().listDatabases();

        console.log('\n=== Список баз данных ===');

        for (const database of databases.databases) {
            console.log(`- ${database.name}`);
        }

        // Список коллекций текущей БД
        const collections = await db.listCollections().toArray();

        console.log('\n=== Коллекции базы данных ===');

        if (collections.length === 0) {
            console.log('Коллекций пока нет');
        } else {
            for (const collection of collections) {
                console.log(`- ${collection.name}`);
            }
        }

        console.log('\n[OK] Задание 1 выполнено');

    } catch (error) {
        console.error('\n[ERROR] Ошибка подключения:');
        console.error(error.message);

        if (error.code === 'ECONNREFUSED') {
            console.error('MongoDB не запущена или недоступен порт 27017');
        }

    } finally {
        await client.close();
        console.log('\nСоединение закрыто');
    }
}

main();