import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function singleConnection() {
    let connection;

    try {
        console.log('=== Одиночное соединение ===');

        connection = await mysql.createConnection(config);

        console.log('✔ Подключение установлено');

        const [rows] = await connection.query(`
            SELECT
                VERSION() AS version,
                DATABASE() AS database_name,
                USER() AS user_name
        `);

        console.log(`Версия MySQL: ${rows[0].version}`);
        console.log(`Текущая БД: ${rows[0].database_name}`);
        console.log(`Пользователь: ${rows[0].user_name}`);
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('✖ Сервер MySQL недоступен');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('✖ Неверный пользователь или пароль');
        } else {
            console.error(`✖ Ошибка: ${error.code} — ${error.message}`);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('✔ Соединение закрыто');
        }
    }
}

async function connectionPool() {
    let pool;

    try {
        console.log('\n=== Пул соединений ===');

        pool = mysql.createPool({
            ...config,
            connectionLimit: 10,
            waitForConnections: true,
            queueLimit: 0
        });

        console.log('✔ Пул создан (лимит: 10)');

        const [rows] = await pool.query(`
            SELECT
                VERSION() AS version,
                DATABASE() AS database_name,
                USER() AS user_name
        `);

        console.log(`Версия MySQL: ${rows[0].version}`);
        console.log(`Текущая БД: ${rows[0].database_name}`);
        console.log(`Пользователь: ${rows[0].user_name}`);

        console.log('Соединений в пуле: 10');
        console.log('✔ Пул готов к работе');
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('✖ Сервер MySQL недоступен');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('✖ Неверный пользователь или пароль');
        } else {
            console.error(`✖ Ошибка пула: ${error.code} — ${error.message}`);
        }
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

await singleConnection();
await connectionPool();